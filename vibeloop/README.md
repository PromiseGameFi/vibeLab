# VibeLab Loop

> **Autonomous AI development loop with multi-IDE support**

Ported from [Ralph for Claude Code](https://github.com/frankbria/ralph-claude-code) with support for multiple AI coding tools.

## Features

- 🔄 **Autonomous Loop** - Continuously executes AI with your requirements
- 🎯 **Exit Detection** - Stops when project is complete
- ⚡ **Circuit Breaker** - Prevents stuck loops
- 💾 **Session Continuity** - Preserves context across iterations
- 🔌 **Multi-IDE Adapters** - Claude, Cursor, Aider, OpenCode
- 📊 **Live Dashboard** - tmux-based monitoring
- 📁 **Project Templates** - Ralph-style structure

## Quick Start

### 1. Install (One Time)

```bash
cd vibeloop
./install.sh
source ~/.zshrc  # or ~/.bashrc
```

### 2. Create Project

```bash
vibeloop-setup my-project
cd my-project
```

### 3. Run Loop

```bash
# With default adapter (claude)
vibeloop

# With tmux monitoring
vibeloop --monitor

# With different adapter
vibeloop --adapter aider
```

## Adapters

| Adapter | CLI | Status |
|---------|-----|--------|
| Claude Code | `claude` | ✅ |
| Cursor | `cursor` | ⚠️ Experimental |
| Aider | `aider` | ✅ |
| OpenCode | `opencode` | ⚠️ Experimental |

```bash
# List available adapters
vibeloop --list-adapters

# Use specific adapter
vibeloop --adapter aider
```

## Commands

```bash
vibeloop              # Run autonomous loop
vibeloop-setup        # Create new project
vibeloop-monitor      # Live dashboard
```

## Options

```
-a, --adapter NAME    AI adapter (default: claude)
-p, --prompt FILE     Prompt file (default: PROMPT.md)
-t, --timeout MIN     Timeout per iteration (default: 15)
-c, --calls NUM       Max API calls/hour (default: 100)
-m, --monitor         Enable tmux dashboard
-v, --verbose         Verbose output
--status              Show current status
--reset-session       Reset session
--reset-circuit       Reset circuit breaker
```

## Project Structure

```
my-project/
├── PROMPT.md           # Main instructions for AI
├── @fix_plan.md        # Priority task list
├── @AGENT.md           # Build/run instructions
├── specs/              # Requirements
├── src/                # Source code
├── logs/               # Execution logs
└── docs/generated/     # Auto-generated docs
```

## Configuration

Edit thresholds in `~/.vibeloop/vibeloop_loop.sh`:

```bash
# Exit detection
MAX_CONSECUTIVE_TEST_LOOPS=3
MAX_CONSECUTIVE_DONE_SIGNALS=2

# Circuit breaker
CB_NO_PROGRESS_THRESHOLD=3
CB_SAME_ERROR_THRESHOLD=5
```

## Requirements

- Bash 4+
- tmux (for `--monitor` mode)
- One of: claude, cursor, aider, opencode CLI

## License

MIT
