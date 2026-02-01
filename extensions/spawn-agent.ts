/**
 * Spawn Agent extension - spawn a new agent with context from the current session
 *
 * Extracts what matters for the next task and spawns a new independent agent
 * in a new tmux pane. The current session continues uninterrupted.
 *
 * Requires tmux - the current pi session must be running inside tmux.
 *
 * Usage:
 *   /spawn-agent now implement this for teams as well
 *   /spawn-agent execute phase one of the plan
 *   /spawn-agent check other places that need this fix
 *
 * The generated prompt appears in an editor for review before spawning.
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { complete, type Message } from "@mariozechner/pi-ai";
import type { ExtensionAPI, SessionEntry } from "@mariozechner/pi-coding-agent";
import { BorderedLoader, convertToLlm, serializeConversation } from "@mariozechner/pi-coding-agent";

const SYSTEM_PROMPT = `You are a context transfer assistant. Given a conversation history and the user's goal for a new thread, generate a focused prompt that:

1. Summarizes relevant context from the conversation (decisions made, approaches taken, key findings)
2. Lists any relevant files that were discussed or modified
3. Clearly states the next task based on the user's goal
4. Is self-contained - the new thread should be able to proceed without the old conversation

Format your response as a prompt the user can send to start the new thread. Be concise but include all necessary context. Do not include any preamble like "Here's the prompt" - just output the prompt itself.

Example output format:
## Context
We've been working on X. Key decisions:
- Decision 1
- Decision 2

Files involved:
- path/to/file1.ts
- path/to/file2.ts

## Task
[Clear description of what to do next based on user's goal]`;

/**
 * Write content to a temp file and return its path.
 */
function writeTempFile(name: string, content: string): { dir: string; filePath: string } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-spawn-agent-"));
  const filePath = path.join(tmpDir, name);
  fs.writeFileSync(filePath, content, { encoding: "utf-8", mode: 0o600 });
  return { dir: tmpDir, filePath };
}

function shellEscape(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}

/**
 * Check if we're running inside tmux.
 */
function isInsideTmux(): boolean {
  return Boolean(process.env.TMUX);
}

/**
 * Check if the tmux server is running (even if we're not inside a tmux session).
 */
function isTmuxServerRunning(): boolean {
  try {
    execSync("tmux list-sessions", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Spawn a new pi session via tmux.
 * - If inside tmux: opens a new window in the current session.
 * - If tmux server is running: opens a new window in the first available session.
 * - Otherwise: starts a new detached tmux session with the pi command.
 */
function spawnViaTmux(cwd: string, piCommand: string): string {
  if (isInsideTmux()) {
    execSync(`tmux new-window -c ${shellEscape(cwd)} ${shellEscape(piCommand)}`);
    return "new tmux window";
  }

  if (isTmuxServerRunning()) {
    // Grab the first session and create a new window in it
    const firstSession = execSync("tmux list-sessions -F '#{session_name}'", { encoding: "utf-8" }).trim().split("\n")[0];
    execSync(`tmux new-window -t ${shellEscape(firstSession)} -c ${shellEscape(cwd)} ${shellEscape(piCommand)}`);
    return `new window in tmux session "${firstSession}"`;
  }

  // No tmux at all — start a new detached session
  execSync(`tmux new-session -d -s pi-spawn -c ${shellEscape(cwd)} ${shellEscape(piCommand)}`);
  return 'new tmux session "pi-spawn" (attach with: tmux attach -t pi-spawn)';
}

export default function (pi: ExtensionAPI) {
  pi.registerCommand("spawn-agent", {
    description: "Spawn a new agent via tmux with context from the current session",
    handler: async (args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("spawn-agent requires interactive mode", "error");
        return;
      }

      if (!ctx.model) {
        ctx.ui.notify("No model selected", "error");
        return;
      }

      try {
        execSync("which tmux", { stdio: "ignore" });
      } catch {
        ctx.ui.notify("spawn-agent requires tmux to be installed", "error");
        return;
      }

      const goal = args.trim();
      if (!goal) {
        ctx.ui.notify("Usage: /spawn-agent <goal for new agent>", "error");
        return;
      }

      // Gather conversation context from current branch
      const branch = ctx.sessionManager.getBranch();
      const messages = branch
        .filter((entry): entry is SessionEntry & { type: "message" } => entry.type === "message")
        .map((entry) => entry.message);

      if (messages.length === 0) {
        ctx.ui.notify("No conversation to hand off", "error");
        return;
      }

      // Convert to LLM format and serialize
      const llmMessages = convertToLlm(messages);
      const conversationText = serializeConversation(llmMessages);

      // Generate the handoff prompt with loader UI
      const result = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
        const loader = new BorderedLoader(tui, theme, `Generating context prompt...`);
        loader.onAbort = () => done(null);

        const doGenerate = async () => {
          const apiKey = await ctx.modelRegistry.getApiKey(ctx.model!);

          const userMessage: Message = {
            role: "user",
            content: [
              {
                type: "text",
                text: `## Conversation History\n\n${conversationText}\n\n## User's Goal for New Thread\n\n${goal}`,
              },
            ],
            timestamp: Date.now(),
          };

          const response = await complete(
            ctx.model!,
            { systemPrompt: SYSTEM_PROMPT, messages: [userMessage] },
            { apiKey, signal: loader.signal },
          );

          if (response.stopReason === "aborted") {
            return null;
          }

          return response.content
            .filter((c): c is { type: "text"; text: string } => c.type === "text")
            .map((c) => c.text)
            .join("\n");
        };

        doGenerate()
          .then(done)
          .catch((err) => {
            console.error("Context prompt generation failed:", err);
            done(null);
          });

        return loader;
      });

      if (result === null) {
        ctx.ui.notify("Cancelled", "info");
        return;
      }

      // Let user edit the generated prompt
      const editedPrompt = await ctx.ui.editor("Edit context prompt", result);

      if (editedPrompt === undefined) {
        ctx.ui.notify("Cancelled", "info");
        return;
      }

      // Write the prompt to a temp file to pass via --append-system-prompt
      // (avoids shell argument length limits for large context prompts)
      const { filePath: promptFile } = writeTempFile("context.md", editedPrompt);

      // Build the pi command
      const modelId = ctx.model.id;
      const piArgs: string[] = ["pi", "--model", shellEscape(modelId), "--append-system-prompt", shellEscape(promptFile)];
      piArgs.push(shellEscape("Execute the task described in the system prompt context."));
      const piCommand = piArgs.join(" ");

      try {
        const method = spawnViaTmux(ctx.cwd, piCommand);
        ctx.ui.notify(`Agent spawned in ${method}`, "info");
      } catch (err) {
        // Clean up temp file on failure
        try {
          fs.unlinkSync(promptFile);
          fs.rmdirSync(path.dirname(promptFile));
        } catch { /* ignore */ }
        ctx.ui.notify(`Failed to spawn agent: ${err}`, "error");
      }
    },
  });
}
