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
GROQ_API_KEY=
```

---

## Key Routes

| Route | Purpose |
|-------|---------|
| `/scan` | Security Scanner |
| `/memory` | AI Memory Dashboard |
| `/memory/chat` | Chat with Memories |
| `/memory/graph` | Memory Graph Visualization |
| `/predictions` | Prediction Market Scanner |
| `/predictions/whales` | Smart Money Tracker |
| `/predictions/sentiment` | News Sentiment Monitor |
| `/predictions/alerts` | Market Alerts |
| `/skills` | AI Coding Skills |
| `/vibeMarket` | Marketing Tools |
| `/[slug]` | Tool Blueprints |
| `vibeloop/` | Autonomous Loop CLI & VS Code Extension |

## API Routes

### Memory APIs
| Route | Purpose |
|-------|---------|
| `/api/memory/chat` | RAG-based chat |
| `/api/memory/import` | URL fetcher |
| `/api/memory/search` | Semantic search |
| `/api/memory/sync` | Extension sync |

### Prediction APIs
| Route | Purpose |
|-------|---------|
| `/api/predictions/polymarket` | Polymarket markets |
| `/api/predictions/kalshi` | Kalshi markets |
| `/api/predictions/analyze` | AI probability analysis |
| `/api/predictions/arbitrage` | Arbitrage detection |
| `/api/predictions/whales` | Smart money tracking |
| `/api/predictions/sentiment` | News sentiment analysis |
| `/api/predictions/alerts` | Market alerts management |

### Other APIs
| Route | Purpose |
|-------|---------|
| `/api/scan` | Security scan |
| `/api/repos` | GitHub repos |
| `/api/generate/skill` | Skill generation |
| `/api/generate/gtm` | GTM strategy |
| `/api/generate/marketing` | Marketing content |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js (GitHub OAuth)
- **Icons:** Lucide React
- **AI:** Groq (chat), Gemini (embeddings)

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
- Supports: ChatGPT, Claude, Gemini, Perplexity, Copilot, Twitter, X
- Features: Auto-save, keyboard shortcuts, context menu

### MCP Server
Location: `mcp-server/`
- Install: `cd mcp-server && npm install`
- Configure in Cursor: `~/.cursor/mcp.json`
- Tools: add_memory, search_memories, get_context, list_memories, delete_memory

---

## Testing

```bash
npm run build   # Check for type errors
npm run lint    # Check for lint issues
```
