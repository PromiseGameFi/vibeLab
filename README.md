# VibeLab

> **Build better AI workflows, faster**

VibeLab helps you use AI tools effectively. Security scanners, AI memory, prediction market intelligence, and curated workflows.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✨ Features

### 🔒 Security Scanner (`/scan`)
- Scan GitHub repos (public & private via OAuth)
- 218+ vulnerability patterns across 6 categories
- AI-powered fix suggestions with Gemini
- Export: JSON, SARIF, Markdown

### 🧠 AI Memory (`/memory`)
Universal AI memory system inspired by [supermemory.ai](https://supermemory.ai):

| Feature | Description |
|---------|-------------|
| **Chat with Memories** | Ask questions, AI answers using your context |
| **Semantic Search** | AI-powered vector search (click "AI" toggle) |
| **Memory Graph** | Visualize connections between memories |
| **URL/File Import** | Import from any URL or upload files |
| **Token Budgeting** | Export 500-8000 tokens with auto-summarization |
| **Browser Extension** | Auto-capture from ChatGPT, Claude, Gemini, Twitter, Perplexity, Copilot |
| **MCP Server** | Access from Cursor/Claude Desktop |

### 📊 Prediction Markets (`/predictions`)
AI-powered prediction market intelligence:

| Feature | Description |
|---------|-------------|
| **Market Scanner** | Aggregate odds from Polymarket & Kalshi |
| **Arbitrage Finder** | Detect guaranteed profit opportunities |
| **AI Research Agent** | Deep probability analysis with edge detection |
| **Smart Money** | Track whale wallet activity (`/predictions/whales`) |
| **News Sentiment** | AI-powered sentiment analysis (`/predictions/sentiment`) |
| **Market Alerts** | Custom price and volume alerts (`/predictions/alerts`) |

### 🔄 VibeLab Loop (`vibeloop/`)
Autonomous AI development loop for Cursor, Antigravity, and VS Code:

| Feature | Description |
|---------|-------------|
| **CLI Tool** | `vibeloop start` - run autonomous loop from terminal |
| **VS Code Extension** | Dashboard, status bar, commands |
| **Multi-IDE** | Works on VS Code, Cursor, Antigravity (OpenVSX) |
| **Exit Detection** | Auto-stop when tasks complete |
| **Circuit Breaker** | Prevents stuck loops |

### 🎯 AI Skills (`/skills`)
- Pre-built coding rules for Cursor, Claude Code, Windsurf
- One-click export to `.cursorrules`, `CLAUDE.md`, etc.

### 📈 VibeMarket (`/vibeMarket`)
- GTM Strategy Generator
- Marketing Templates
- Custom Strategy Builder

## 🔑 Environment Variables

```env
# GitHub OAuth (for private repos)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# AI APIs
NEXT_PUBLIC_GEMINI_API_KEY=  # For embeddings
GROQ_API_KEY=                 # For chat & analysis
```

## 📁 Project Structure

```
src/
├── app/
│   ├── scan/              # Security scanner
│   ├── memory/            # AI memory dashboard
│   ├── memory/chat/       # Chat with memories
│   ├── memory/graph/      # Memory graph visualization
│   ├── predictions/       # Prediction market scanner
│   ├── skills/            # AI coding skills
│   ├── vibeMarket/        # Marketing tools
│   └── api/
│       ├── memory/        # Memory APIs (chat, import, search, sync)
│       └── predictions/   # Prediction APIs (polymarket, kalshi, analyze, arbitrage)
├── lib/
│   ├── memoryStore.ts     # IndexedDB storage
│   ├── memoryTypes.ts     # Memory interfaces
│   ├── predictionTypes.ts # Prediction interfaces
│   └── scanPatterns/      # Scanner patterns
└── components/

extensions/
└── chrome/                # Browser extension (7 sites)

mcp-server/
└── index.js               # MCP server for Cursor/Claude

vibeloop/
├── core/                  # Loop engine, exit detector, circuit breaker
├── adapters/              # Claude Code, Cursor, OpenCode, Antigravity
├── cli/                   # CLI tool (vibeloop start)
└── vscode-extension/      # VS Code extension with webview dashboard
```

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js (GitHub OAuth)
- **AI:** Groq (llama-3.3-70b), Gemini (embeddings)

## 📄 License

MIT
