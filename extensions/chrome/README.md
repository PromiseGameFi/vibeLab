# VibeLab Memory - Chrome Extension

Automatically capture AI conversations from ChatGPT, Claude, and Gemini to build your persistent AI memory.

## Installation

### From Source (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select this `extensions/chrome` folder
5. The VibeLab Memory extension should now appear!

## Features

- 🧠 **One-click save** - Floating button on ChatGPT, Claude, and Gemini
- 📊 **Auto-extract** - Captures full conversations with role attribution
- 💾 **Local storage** - Memories stored in browser, synced to VibeLab dashboard
- 🎯 **Token tracking** - See token count for each saved memory

## Supported Sites

| Site | URL | Status |
|------|-----|--------|
| ChatGPT | chat.openai.com, chatgpt.com | ✅ |
| Claude | claude.ai | ✅ |
| Gemini | gemini.google.com | ✅ |

## Usage

1. Visit any supported AI chat site
2. Have a conversation
3. Click the floating "🧠 Save to Memory" button
4. Open the extension popup or VibeLab dashboard to view memories

## Files

```
extensions/chrome/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for storage
├── content-chatgpt.js     # ChatGPT content script
├── content-claude.js      # Claude content script
├── content-gemini.js      # Gemini content script
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
└── icons/                 # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Development

To modify the extension:

1. Edit the content scripts for DOM extraction logic
2. Reload the extension in `chrome://extensions/`
3. Refresh the AI chat page to see changes

## Syncing with VibeLab Dashboard

Currently, memories are stored in Chrome's local storage. To sync with the VibeLab dashboard:

1. Open the extension popup
2. Click "Open Memory Dashboard"
3. (Future) Auto-sync via API when authenticated
