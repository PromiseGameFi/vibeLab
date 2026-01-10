# VibeLab Memory - Chrome Extension v2.0

Universal AI memory capture from ChatGPT, Claude, Gemini, Perplexity, and Copilot.

## Installation

1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this `extensions/chrome` folder

## Features

### Supported Sites
| Site | Status |
|------|--------|
| ChatGPT | ✅ chat.openai.com, chatgpt.com |
| Claude | ✅ claude.ai |
| Gemini | ✅ gemini.google.com |
| Perplexity | ✅ perplexity.ai |
| Copilot | ✅ copilot.microsoft.com |

### Key Features
- 🧠 **One-click save** - Floating button on all AI sites
- ⌨️ **Keyboard shortcuts** - Cmd+Shift+S to save, Cmd+Shift+A to toggle auto-save
- 🔄 **Auto-save** - Optionally save after each conversation
- 📋 **Context menu** - Right-click any text to save
- 🏷️ **Auto-tagging** - Detects code, api, debug, design, ideas
- 🔗 **Sync** - Saves to VibeLab dashboard

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+S` | Save current conversation |
| `Cmd+Shift+A` | Toggle auto-save mode |

### Context Menu
Right-click on any page:
- **Save to VibeLab Memory** - Save selected text
- **Save page to VibeLab Memory** - Save full page content

## Files

```
extensions/chrome/
├── manifest.json         # Chrome extension config
├── background.js         # Service worker (storage, menus, shortcuts)
├── content-chatgpt.js    # ChatGPT extraction
├── content-claude.js     # Claude extraction
├── content-gemini.js     # Gemini extraction
├── content-perplexity.js # Perplexity extraction
├── content-copilot.js    # Copilot extraction
├── popup.html/js         # Extension popup
└── icons/                # Extension icons
```

## Settings

In the popup:
- **Auto-save** - Automatically save after conversations
- **Sync** - Sync memories to VibeLab dashboard

## Troubleshooting

If extraction doesn't work:
1. Reload the extension in `chrome://extensions/`
2. Refresh the AI chat page
3. Make sure the page has fully loaded before clicking Save
