# VibeLab - Product Requirements

> **Build better AI workflows, faster** — Cut token costs by up to 40%

## Vision
VibeLab is the pro manual for AI tools + a suite of utilities that help users **save money on AI costs** and **work more efficiently**.

---

## The 4 Main Pillars

### 1. Security Scanner (`/scan`)
Enterprise-grade vulnerability scanning for GitHub repositories.

**Features:**
- 153 security patterns (secrets, vulnerabilities, misconfigurations)
- 3 external APIs: OSV, deps.dev, GitHub Advisory
- GitHub OAuth for private repositories
- Real-time scan progress with file-by-file updates
- AI-powered fix suggestions via Gemini
- Export: JSON, SARIF, Markdown

**User Flow:** Sign in with GitHub → Select repo from list → Scan → Get findings with fix suggestions

---

### 2. Token Cost Tools (`/vibeMarket`)

**Token Calculator:**
- Compare 7 AI providers (GPT-4o, Claude 3.5, Gemini 1.5, DeepSeek V3)
- Paste text or enter token counts
- See cheapest option with savings percentage

**Prompt Optimizer:**
- Remove filler words (please, basically, just, very)
- Show token reduction (up to 40%)
- Smart optimization tips

---

### 3. AI Tool Directory (`/` + `/[slug]`)
Curated blueprints for AI tools with pro tips and workflows.

**Tools Covered:**
- Vibecode, Cursor (Coding)
- Midjourney, Flux.1 (Image)
- Kling, Luma Dream Machine (Video)
- ElevenLabs (Audio)
- Meshy, Skybox AI (3D)

**Each Tool Has:**
- Pro tips from power users
- Annotated prompts with explanations
- Recommended workflows
- Tool integrations

---

### 4. Universal Skills (`/skills`)
Pre-built coding rules that work across AI agents.

**Supported Agents:**
- Cursor (.cursorrules)
- Claude Code (CLAUDE.md)
- Antigravity (.agent/workflows/)
- Windsurf, Cline, Codex

**Skill Categories:**
- Frontend (React, Next.js, Tailwind)
- Backend (APIs, Databases)
- DevOps (Git, CI/CD)
- Testing, General

**Value Prop:** Define rules once → AI remembers → Less repeated prompting → Save tokens

---

## Supporting Features

### VibeMarket Marketing Tools
- GTM Strategy Generator (AI-powered)
- Marketing Strategy Templates (5 industries)
- Custom Marketing Builder (sentiment-based)
- Thread Studio, Posting Planner, Evergreen Vault

### Quick Actions Grid
Homepage shows 4 key actions:
1. Security Scanner
2. Token Calculator
3. Prompt Optimizer
4. AI Skills

---

## Target Users

| Persona | Problem | Solution |
|---------|---------|----------|
| **Developer** | Overpaying for AI tokens | Token Calculator + Prompt Optimizer |
| **Security Engineer** | Need to scan repos fast | Security Scanner with OAuth |
| **AI Power User** | Don't know tool best practices | Tool blueprints + pro tips |
| **Marketer** | Need GTM strategy | AI Strategy Generator |

---

## Tech Stack
- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Auth: NextAuth.js (GitHub OAuth)
- APIs: OSV, GitHub Advisory, Gemini