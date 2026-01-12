# VibeLab Loop - VS Code Extension

> **Native to Antigravity IDE** - Also works in VS Code and Cursor

## Native Antigravity Usage

In Antigravity, the AI chat IS your loop. Just say:

```
"VibeLab Loop mode - read PROMPT.md and complete all tasks autonomously"
```

The extension provides additional features like dashboard and status bar.

## Features

- **Native Antigravity** - Use Gemini directly as your loop
- **Command Palette** - Start, stop, and manage loops
- **Webview Dashboard** - Real-time stats and file changes
- **Status Bar** - Quick status at a glance
- **Multi-Adapter** - CLI and Language Model API support

## Commands

| Command | Description |
|---------|-------------|
| `VibeLab: Start Autonomous Loop` | Start the loop |
| `VibeLab: Stop Loop` | Stop running loop |
| `VibeLab: Select AI Adapter` | Choose adapter |
| `VibeLab: Open Dashboard` | Open webview dashboard |

## Adapters

### Native (Default)
| Adapter | Provider |
|---------|----------|
| `antigravity` | Gemini (Native to Antigravity) |

### CLI Adapters
| Adapter | CLI |
|---------|-----|
| `aider` | Aider |
| `claude` | Claude Code CLI |
| `cursor` | Cursor |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `vibeloop.adapter` | `antigravity` | AI adapter |
| `vibeloop.timeout` | `15` | Timeout per iteration (minutes) |
| `vibeloop.maxCalls` | `100` | Max API calls per hour |
| `vibeloop.promptFile` | `PROMPT.md` | Project requirements file |
| `vibeloop.autoStart` | `false` | Auto-start on workspace open |

## Installation

### From VSIX
```bash
Cmd+Shift+P → "Install from VSIX" → vibeloop-0.1.0.vsix
```

### From OpenVSX (Antigravity)
```bash
ovsx install vibelab.vibeloop
```

### From Source
```bash
cd vscode-extension
npm install
npm run compile
npm run package  # Creates .vsix file
```

## Requirements

- VS Code 1.90+ (for Language Model API)
- One of: Aider CLI, Claude CLI, or GitHub Copilot

## License

MIT
