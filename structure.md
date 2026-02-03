# VibeLab Project Structure

## Overview
VibeLab is built using **Next.js 16 (App Router)** with TypeScript and Tailwind CSS.

---

##  Root Directory
```
vibelab/
├── src/                 # Application source code
├── public/              # Static assets
├── .env.local           # Environment variables
├── README.md            # Project overview
├── progress.md          # Feature completion log
├── prd.md               # Product requirements
├── structure.md         # This file
└── package.json         # Dependencies
```

---

##  `src/app/` (Routes)

### Core Pages
| Route | File | Description |
|-------|------|-------------|
| `/` | `page.tsx` | Homepage with Quick Actions grid |
| `/[slug]` | `[slug]/page.tsx` | Dynamic tool blueprints |
| `/scan` | `scan/page.tsx` | Security Scanner |
| `/skills` | `skills/page.tsx` | AI Coding Skills |
| `/brain` | `brain/page.tsx` | Project Brain Generator |

### VibeMarket (`/vibeMarket`)
| Route | Description |
|-------|-------------|
| `/token-calc` | Token Cost Calculator (7 providers) |
| `/prompt-optimizer` | Prompt compression tool |
| `/gtm` | GTM Strategy Generator |
| `/templates` | Marketing Strategy Templates |
| `/builder` | Custom Marketing Builder |
| `/thread-studio` | AI Thread Builder |
| `/planner` | Posting Calendar |
| `/vault` | Evergreen Content Vault |
| `/profiles` | Personality Voice Presets |
| `/scorecard` | Engagement Tracker |
| `/agent` | Browser Automation Scripts |

### API Routes (`/api`)
| Route | Purpose |
|-------|---------|
| `/auth/[...nextauth]` | GitHub OAuth handler |
| `/scan` | Security scan endpoint |
| `/repos` | Fetch user's GitHub repos |
| `/generate/skill` | AI skill generation |
| `/generate/gtm` | AI GTM strategy |
| `/generate/marketing` | AI marketing strategy |
| `/generate/brain` | Project documentation generation |

---

##  `src/lib/` (Data & Logic)

| File | Purpose |
|------|---------|
| `toolsData.ts` | AI tool definitions, prompts, workflows |
| `skillsData.ts` | Coding skills with export formatters |
| `scanData.ts` | Security patterns and severity config |
| `frontendScanner.ts` | Vulnerability scanning engine |
| `generateFix.ts` | AI fix generation + exports |
| `groq.ts` | Groq API for AI generation |

---

##  `src/components/`

| Component | Purpose |
|-----------|---------|
| `Navbar.tsx` | Global navigation |
| `ToolCard.tsx` | Tool directory cards |
| `AuthProvider.tsx` | NextAuth session wrapper |
| `CopyButton.tsx` | Clipboard utility |

---

##  Environment Variables

```env
# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# AI APIs
NEXT_PUBLIC_GEMINI_API_KEY=
GROQ_API_KEY=

# Optional
GITHUB_TOKEN=
```

---

##  Information Architecture

```
VibeLab
├── Homepage (/)
│   ├── Quick Actions Grid
│   └── Tool Directory
│
├── Security Scanner (/scan)
│   ├── GitHub OAuth Sign-in
│   ├── User Repo List
│   ├── Scan Interface
│   └── Results + AI Fixes
│
├── VibeMarket (/vibeMarket)
│   ├── Token Cost Tools
│   │   ├── Token Calculator
│   │   └── Prompt Optimizer
│   ├── Strategy Tools
│   │   ├── GTM Generator
│   │   ├── Templates
│   │   └── Custom Builder
│   └── SMM Tools
│       ├── Thread Studio
│       ├── Planner
│       ├── Vault
│       └── ...
│
├── Skills (/skills)
│   ├── Skill Browser
│   ├── Category Filter
│   ├── Export Modal
│   └── Skill Creator
│
└── Tool Detail (/[slug])
    ├── Tips & Best Practices
    ├── Annotated Prompts
    └── Workflows
```
