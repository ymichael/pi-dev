# Pi Dev

Personal [pi](https://github.com/badlogic/pi-mono) package.

### Extensions

| Extension      | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| **web_search** | Search the web via Brave Search API. Requires `BRAVE_API_KEY`      |
| **web_fetch**  | Fetch any URL as clean markdown via Jina Reader                    |
| **spawn-agent** | Spawn a new agent via tmux with current session context via `/spawn-agent <goal>` |
| **subagent**   | Delegate tasks to specialized agents with isolated context windows |

### Agents (for subagent)

| Agent        | Model         | Description                                                                                          |
| ------------ | ------------- | ---------------------------------------------------------------------------------------------------- |
| **explore**  | Haiku         | Fast read-only codebase explorer (Claude Code style). Finds files, searches code, answers questions. |
| **reviewer** | gpt-5.2-codex | Code reviewer with prioritized findings (inspired by Codex `/review`)                                |
| **worker**   | (inherited)   | General-purpose agent with full capabilities, uses the spawning model                                |

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

## Environment Variables

| Variable        | Required       | Description                                                                              |
| --------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `BRAVE_API_KEY` | For web search | Free tier: 2,000 searches/month at [brave.com/search/api](https://brave.com/search/api/) |
| `JINA_API_KEY`  | Optional       | Higher rate limits for web_fetch (200/min vs 20/min)                                     |

## License

MIT
