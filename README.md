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
- Persistent context across all AI tools
- Token-budgeted export (500-8000 tokens)
- Auto-summarization (10x compression)
- **Browser Extension** - Auto-capture from ChatGPT, Claude, Gemini
- **MCP Server** - Access memories from Cursor/Claude Desktop

### 🎯 AI Skills (`/skills`)
- Pre-built coding rules for Cursor, Claude Code, Windsurf
- One-click export to `.cursorrules`, `CLAUDE.md`, etc.
- Reduce repeated prompting

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

# Optional: Gemini API (AI features)
NEXT_PUBLIC_GEMINI_API_KEY=
```

## 📁 Project Structure

```
src/
├── app/
│   ├── scan/          # Security scanner
│   ├── memory/        # AI memory dashboard
│   ├── skills/        # AI coding skills
│   ├── vibeMarket/    # Marketing tools
│   └── [slug]/        # Tool detail pages
├── lib/
│   ├── memoryStore.ts # AI memory storage
│   ├── scanPatterns/  # Scanner patterns
│   └── toolsData.ts   # AI tool blueprints
└── components/

extensions/
└── chrome/            # Browser extension for memory capture

mcp-server/
└── index.js           # MCP server for Cursor/Claude Desktop
```

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js (GitHub OAuth)
- **APIs:** OSV, GitHub Advisory, Gemini

## 📄 License

MIT
