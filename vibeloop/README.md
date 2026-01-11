# VibeLab Autonomous Loop (vibeloop)

> Put your AI coding agent on autopilot

An autonomous development loop for **Claude Code**, **Cursor**, **Antigravity**, and other AI coding tools. Inspired by [Ralph for Claude Code](https://github.com/frankbria/ralph-claude-code).

## Features

- 🔄 **Autonomous Loop** - Continuously execute AI agent until task is complete
- 🎯 **Exit Detection** - Automatically stop when objectives are met
- ⚡ **Circuit Breaker** - Detect stuck loops and repeated errors
- 🚦 **Rate Limiting** - Manage API calls, handle usage limits
- 💾 **Session Continuity** - Preserve context across iterations
- 📊 **Live Dashboard** - Real-time progress monitoring (coming soon)

## Quick Start

```bash
# Install dependencies
cd vibeloop && npm install

# Initialize a project
npx ts-node cli/index.ts init

# Edit PROMPT.md with your requirements

# Start the loop
npx ts-node cli/index.ts start
```

## Commands

### `vibeloop start`

Start the autonomous development loop.

```bash
vibeloop start [options]

Options:
  -p, --prompt <file>     Prompt file path (default: "PROMPT.md")
  -a, --adapter <type>    AI adapter to use (default: "claude-code")
  -t, --timeout <minutes> Execution timeout per iteration (default: 15)
  -c, --calls <number>    Max API calls per hour (default: 100)
  -m, --monitor           Enable live monitoring dashboard
  -v, --verbose           Enable verbose output
```

### `vibeloop status`

Check current loop status and session info.

### `vibeloop init`

Create a `PROMPT.md` template in the current directory.

### `vibeloop reset`

Reset session and circuit breaker state.

## How It Works

1. **Read Prompt** - Loads your `PROMPT.md` with project requirements
2. **Execute Agent** - Runs the AI coding agent with context
3. **Track Progress** - Monitors file changes and output
4. **Detect Completion** - Looks for "done" signals in output
5. **Repeat** - Continues until complete or limits reached

## Adapters

| Adapter | Status | CLI Command |
|---------|--------|-------------|
| Claude Code | ✅ Ready | `claude` |
| Cursor | 🔜 Coming | - |
| Antigravity | 🔜 Coming | - |
| OpenCode | 🔜 Coming | - |
| Copilot | 🔜 Coming | - |

## Configuration

### PROMPT.md Template

```markdown
# Project Requirements

## Objective
Describe what you want to build.

## Tasks
- [ ] Task 1
- [ ] Task 2

## Exit Conditions
When all tasks are complete, signal by saying "All tasks complete."
```

### Exit Detection

The loop automatically exits when:
- 2 consecutive "completion" signals detected
- 3 consecutive test-only loops
- 3 consecutive loops with no file changes

### Circuit Breaker

Opens when:
- 3 loops with no progress (no file changes)
- 5 loops with the same error
- Output declines by >70%

## Requirements

- Node.js 18+
- Claude Code CLI (`claude`) for Claude adapter

## License

MIT
