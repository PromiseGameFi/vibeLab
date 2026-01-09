# VibeLab

> **Build better AI workflows, faster** — Cut token costs by up to 40%

VibeLab helps you use AI tools effectively while reducing costs. Security scanners, token optimizers, and curated workflows.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✨ Features

### 🔒 Security Scanner (`/scan`)
- Scan GitHub repos (public & private via OAuth)
- 153 vulnerability patterns + 3 APIs (OSV, deps.dev, GitHub Advisory)
- AI-powered fix suggestions with Gemini
- Export: JSON, SARIF, Markdown

### 💰 Token Cost Tools (`/vibeMarket`)
- **Token Calculator** - Compare 7 AI providers (GPT-4o, Claude, Gemini, DeepSeek)
- **Prompt Optimizer** - Remove filler words, save up to 40% tokens

### 🎯 AI Skills (`/skills`)
- Pre-built coding rules for Cursor, Claude Code, Windsurf
- One-click export to `.cursorrules`, `CLAUDE.md`, etc.
- Reduce repeated prompting = save tokens

### 📈 VibeMarket Tools
- GTM Strategy Generator
- Thread Studio (AI threads)
- Evergreen Vault (content recycler)

## 🔑 Environment Variables

```env
# GitHub OAuth (for private repos)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Optional: Gemini API (AI fixes)
NEXT_PUBLIC_GEMINI_API_KEY=
```

## 📁 Project Structure

```
src/
├── app/
│   ├── scan/          # Security scanner
│   ├── skills/        # AI coding skills
│   ├── vibeMarket/    # Token tools + marketing
│   └── [slug]/        # Tool detail pages
├── lib/
│   ├── toolsData.ts   # AI tool blueprints
│   ├── skillsData.ts  # Coding skills
│   └── scanData.ts    # Scanner patterns
└── components/
```

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js (GitHub OAuth)
- **APIs:** OSV, GitHub Advisory, Gemini

## 📄 License

MIT
