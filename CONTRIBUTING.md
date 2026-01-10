# Contributing to VibeLab

## Quick Start

```bash
npm install
npm run dev
```

Add environment variables to `.env.local`:
```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_GEMINI_API_KEY=
```

---

## Key Routes

| Route | Purpose |
|-------|---------|
| `/scan` | Security Scanner |
| `/memory` | AI Memory Dashboard |
| `/memory/chat` | Chat with Memories |
| `/skills` | AI Coding Skills |
| `/vibeMarket` | Marketing Tools |
| `/[slug]` | Tool Blueprints |

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/memory/chat` | RAG-based chat |
| `/api/memory/import` | URL fetcher |
| `/api/memory/search` | Semantic search |
| `/api/scan` | Security scan |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js (GitHub OAuth)
- **Icons:** Lucide React
- **AI:** Gemini (embeddings, chat)

---

## Code Style

- Functional React components
- TypeScript with strict mode
- Tailwind for styling (no inline styles)
- Semantic HTML tags
- Keep components focused and reusable

---

## Extensions

### Browser Extension
Location: `extensions/chrome/`
- Install via `chrome://extensions/` → Load unpacked

### MCP Server
Location: `mcp-server/`
- Install: `cd mcp-server && npm install`
- Configure in Cursor: `~/.cursor/mcp.json`
