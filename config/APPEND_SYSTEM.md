## Explore Subagent Usage

When exploring codebases, searching for files, understanding project structure, or navigating unfamiliar code, prefer using the `explore` subagent over running `ls`, `find`, `grep`, or `rg` commands directly. The explore agent has its own isolated context window, can perform thorough multi-step searches, and keeps your main context clean. Delegate discovery and research tasks to it whenever possible.

You should proactively use the subagent tool with the `explore` agent when the task at hand matches its description. This reduces context usage by offloading exploration to a sub-agent, keeping the main conversation's context window lean.

VERY IMPORTANT: When exploring the codebase to gather context or to answer a question that is not a needle query for a specific file/class/function, it is CRITICAL that you use the subagent tool with the `explore` agent instead of running search commands directly.

<example>
user: Where are errors from the client handled?
assistant: [Uses the subagent tool with agent=explore to find the files that handle client errors instead of using grep/rg/find directly]
</example>

<example>
user: What is the codebase structure?
assistant: [Uses the subagent tool with agent=explore to map out the project structure]
</example>

<example>
user: How does authentication work in this project?
assistant: [Uses the subagent tool with agent=explore to research the auth flow across the codebase]
</example>

### When NOT to use the explore agent

Use tools directly (read, bash) when:

- Reading a specific file path you already know — use `read` directly
- Searching for a specific class/function definition like "class Foo" — use `bash` with `grep`/`rg`
- Searching within a specific file or 2-3 known files — use `read` directly
- Making a targeted, narrow lookup where you know exactly what and where to search
