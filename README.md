# VibeLab

> **Build better AI workflows, faster**

VibeLab helps you use AI tools effectively. Security scanners, AI memory, and curated workflows.

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
| **URL/File Import** | Import from any URL or upload files |
| **Token Budgeting** | Export 500-8000 tokens with auto-summarization |
| **Browser Extension** | Auto-capture from ChatGPT, Claude, Gemini |
| **MCP Server** | Access from Cursor/Claude Desktop |

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

# Gemini API (required for AI features)
NEXT_PUBLIC_GEMINI_API_KEY=
```

## 📁 Project Structure

```
src/
├── app/
│   ├── scan/              # Security scanner
│   ├── memory/            # AI memory dashboard
│   ├── memory/chat/       # Chat with memories
│   ├── skills/            # AI coding skills
│   ├── vibeMarket/        # Marketing tools
│   └── api/memory/        # Memory APIs (chat, import, search)
├── lib/
│   ├── memoryStore.ts     # IndexedDB storage
│   ├── memoryTypes.ts     # Memory interfaces
│   └── scanPatterns/      # Scanner patterns
└── components/

extensions/
└── chrome/                # Browser extension

mcp-server/
└── index.js               # MCP server
```

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js (GitHub OAuth)
- **AI:** Gemini (embeddings, chat, fixes)

## 📄 License

MIT
