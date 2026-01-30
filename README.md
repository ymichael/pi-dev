# Pi Dev Package

Personal [pi coding agent](https://github.com/badlogic/pi-mono) configuration package. Installs as a pi package to provide extensions, skills, prompts, agents, and themes out of the box.

## What's Included

### Extensions

| Extension      | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| **web_search** | Search the web via Brave Search API. Requires `BRAVE_API_KEY`      |
| **web_fetch**  | Fetch any URL as clean markdown via Jina Reader                    |
| **handoff**    | Transfer context to a new focused session via `/handoff <goal>`    |
| **subagent**   | Delegate tasks to specialized agents with isolated context windows |

### Agents (for subagent)

| Agent        | Model         | Description                                                                                          |
| ------------ | ------------- | ---------------------------------------------------------------------------------------------------- |
| **explore**  | Haiku         | Fast read-only codebase explorer (Claude Code style). Finds files, searches code, answers questions. |
| **reviewer** | gpt-5.2-codex | Code reviewer with prioritized findings (inspired by Codex `/review`)                                |
| **worker**   | (inherited)   | General-purpose agent with full capabilities, uses the spawning model                                |

### Prompt Templates

| Prompt            | Description                                             |
| ----------------- | ------------------------------------------------------- |
| `/review [focus]` | Review code changes for bugs, security, and correctness |

### Config (optional)

Reference configuration files in `config/` that can be synced to `~/.pi/agent/`:

- `settings.json` — default provider, model, thinking level
- `APPEND_SYSTEM.md` — appended to the system prompt

## Quick Start

### Local development (recommended)

```bash
git clone <this-repo> ~/Projects/dev
cd ~/Projects/dev
./setup.sh    # creates .pi/ with symlinks to package resources
pi             # run pi from this directory — everything just works
```

`setup.sh` creates a `.pi/` directory with symlinks:

```
.pi/
  extensions → extensions/
  skills → skills/
  prompts → prompts/
  agents → agents/
  settings.json → config/settings.json
  APPEND_SYSTEM.md → config/APPEND_SYSTEM.md
```

Edit any resource file and `/reload` in pi to pick up changes instantly — no reinstall needed.

### Install as a pi package

For use in other projects (no symlinks, pi copies/registers the package):

```bash
# From local path
pi install ~/Projects/dev

# From git (on a new machine)
pi install git:github.com/<user>/dev
```

## Usage Examples

```
# Review code changes
/review security

# Direct subagent use — explore is great for codebase navigation
Use the explore agent to find all TypeScript files related to authentication

# Parallel exploration
Run 2 explore agents in parallel: one to find all API routes, one to find all middleware

# Delegate work to the worker agent
Use the worker agent to refactor the auth module to use JWT tokens
```

## Environment Variables

| Variable        | Required       | Description                                                                              |
| --------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `BRAVE_API_KEY` | For web search | Free tier: 2,000 searches/month at [brave.com/search/api](https://brave.com/search/api/) |
| `JINA_API_KEY`  | Optional       | Higher rate limits for web_fetch (200/min vs 20/min)                                     |

## Structure

```
dev/
├── package.json              # pi package manifest
├── README.md
├── setup.sh                  # creates .pi/ symlinks for local dev
├── .gitignore
├── extensions/
│   ├── handoff.ts             # Context transfer to new session
│   ├── web-search.ts         # Brave web search tool
│   ├── web-fetch.ts          # Jina web fetch tool
│   └── subagent/             # Subagent tool (delegates to agents)
│       ├── index.ts
│       └── agents.ts         # Agent discovery logic
├── agents/                   # Agent definitions (markdown + frontmatter)
│   ├── explore.md            # Read-only codebase explorer (Claude Code style)
│   ├── reviewer.md           # Code reviewer on gpt-5.2-codex
│   └── worker.md             # General-purpose
├── skills/                   # Custom skills (add SKILL.md folders)
├── prompts/                  # Prompt templates
│   └── review.md
├── themes/                   # Custom themes (add .json files)
└── config/                   # Reference configs for ~/.pi/agent/
    ├── settings.json
    └── APPEND_SYSTEM.md
```

## Customizing Agents

Agent definitions live in `agents/*.md`. Each is a markdown file with YAML frontmatter:

```markdown
---
name: my-agent
description: What this agent does
tools: read, grep, find, ls
model: claude-haiku-4-5
---

System prompt for the agent goes here.
```

The subagent extension discovers agents from three locations (later overrides earlier):

1. **Bundled** — `agents/` in this package (always loaded)
2. **User** — `~/.pi/agent/agents/` (your personal agents)
3. **Project** — `.pi/agents/` (project-local, requires `agentScope: "both"`)

## Adding New Resources

- **Extensions**: Add `.ts` files to `extensions/`
- **Agents**: Add `.md` files to `agents/`
- **Skills**: Add a folder with `SKILL.md` to `skills/`
- **Prompts**: Add `.md` files to `prompts/`
- **Themes**: Add `.json` files to `themes/`

After adding, run `/reload` in pi or restart.

## License

MIT
