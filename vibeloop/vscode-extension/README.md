# VibeLab Loop - VS Code Extension

> Autonomous AI development loop for VS Code, Cursor, and Antigravity

## Features

- 🚀 **Command Palette** - Start, stop, and manage loops
- 📊 **Webview Dashboard** - Real-time stats and file changes
- 📍 **Status Bar** - Quick status at a glance
- ⚙️ **Configurable** - Adapter, timeout, and more

## Commands

| Command | Description |
|---------|-------------|
| `VibeLab: Start Autonomous Loop` | Start the loop |
| `VibeLab: Stop Loop` | Stop running loop |
| `VibeLab: Show Loop Status` | Show current status |
| `VibeLab: Open Dashboard` | Open webview dashboard |
| `VibeLab: Initialize Project` | Create PROMPT.md |
| `VibeLab: Reset Session` | Reset session state |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `vibeloop.adapter` | `claude-code` | AI adapter (claude-code, cursor, opencode) |
| `vibeloop.timeout` | `15` | Timeout per iteration (minutes) |
| `vibeloop.maxCalls` | `100` | Max API calls per hour |
| `vibeloop.promptFile` | `PROMPT.md` | Project requirements file |
| `vibeloop.autoStart` | `false` | Auto-start on workspace open |

## Installation

### From OpenVSX (Antigravity)
```bash
ovsx install vibelab.vibeloop
```

### From VS Code Marketplace
Search for "VibeLab Loop" in the extensions panel.

### From Source
```bash
cd vscode-extension
npm install
npm run compile
# Press F5 to launch Extension Development Host
```

## Publishing

### To OpenVSX (for Antigravity)
```bash
npm run publish:ovsx
```

### To VS Code Marketplace
```bash
npm run publish:vscode
```

## Requirements

- One of: Claude CLI, Cursor, or OpenCode installed
- A `PROMPT.md` file in your workspace

## License

MIT
