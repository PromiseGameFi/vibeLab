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

## Documentation Updates

When contributing, keep these docs in sync:

| File | Update When |
|------|-------------|
| `progress.md` | Completing any feature |
| `structure.md` | Adding new routes/files |
| `prd.md` | Major features |
| `README.md` | Setup/dependency changes |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js (GitHub OAuth)
- **Icons:** Lucide React
- **AI:** Gemini, Groq

---

## Code Style

- Functional React components
- TypeScript with strict mode
- Tailwind for styling (no inline styles)
- Semantic HTML tags
- Keep components focused and reusable

---

## Key Routes

| Route | Purpose |
|-------|---------|
| `/scan` | Security Scanner |
| `/vibeMarket/token-calc` | Token Calculator |
| `/vibeMarket/prompt-optimizer` | Prompt Optimizer |
| `/skills` | AI Coding Skills |
| `/[slug]` | Tool Blueprints |
