# VibeLab Loop - VS Code Extension

> Autonomous AI development loop for VS Code, Cursor, and Antigravity

## Features

-  **Command Palette** - Start, stop, and manage loops
-  **Webview Dashboard** - Real-time stats and file changes
-  **Status Bar** - Quick status at a glance
-  **Multi-Adapter** - CLI and Language Model API support
-  **Configurable** - Adapter, timeout, and more

## Commands

| Command | Description |
|---------|-------------|
| `VibeLab: Start Autonomous Loop` | Start the loop |
| `VibeLab: Stop Loop` | Stop running loop |
| `VibeLab: Select AI Adapter` | Choose adapter |
| `VibeLab: Show Loop Status` | Show current status |
| `VibeLab: Open Dashboard` | Open webview dashboard |
| `VibeLab: Initialize Project` | Create PROMPT.md |
| `VibeLab: Reset Session` | Reset session state |

## Adapters

### CLI Adapters
| Adapter | CLI | Status |
|---------|-----|--------|
| `claude` | Claude Code CLI |  |
| `aider` | Aider |  Recommended |
| `cursor` | Cursor |  Experimental |
| `opencode` | OpenCode |  Experimental |

### Language Model API Adapters
| Adapter | Provider | Status |
|---------|----------|--------|
| `antigravity` | Gemini (vscode.lm) |  |
| `copilot` | GitHub Copilot |  |
| `lm-api` | Any LM provider |  |

When using LM API adapters, the extension communicates directly with the AI via VS Code's Language Model API (`vscode.lm`) - no CLI required!

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `vibeloop.adapter` | `aider` | AI adapter |
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
