# VibeLab Project Structure

## Overview
VibeLab is built using **Next.js 14 (App Router)** with a focus on modularity, AI tool guides, and universal skills.

---

## 📁 Root Directory
- `src/` - Primary source code containing the application logic.
- `public/` - Static assets including icons, logos, and global SVGs.
- `Vibelab.md` - Product vision including Skills architecture.
- `prd.md` - Core product requirements and vision.
- `progress.md` - Living log of completed and planned features.
- `content.md` - Detailed content for AI tools and skills.
- `marketing.md` - Marketing strategy and positioning.
- `SMM.md` - SMM toolkit research and specifications.

---

## 📁 `src/app/` (Application Layer)
- `[slug]/` - **Dynamic Tool Pages**: Individual "Blueprint" manuals (e.g., `/vibecode`, `/kling`).
- `layout.tsx` - Global layout with Navbar and SEO metadata.
- `page.tsx` - **Homepage**: Hero section and tool directory.
- `globals.css` - Framer-style dark theme design system.
- `not-found.tsx` - Custom 404 handler.

---

## 📁 `src/app/skills/` (Universal Skills)

### Coding Skills
- `page.tsx` - **Skills Directory**: Browse and search AI coding agent skills.
- `create/` - **Skill Creator**: Build custom skills with live preview and export.

### Marketing Skills (/vibeMarket → will redirect to /skills/marketing)
- `page.tsx` - **Marketing Skills Landing**: Hub for marketing tools.
- `thread-studio/` - AI-powered thread builder with hooks.
- `planner/` - Visual posting calendar with best-time recommendations.
- `vault/` - Evergreen content storage with performance tags.
- `profiles/` - Multi-account voice presets with AI prompt export.
- `scorecard/` - Gamified engagement tracker with badges.
- `agent/` - Browser scripts for automated X engagement.

### Planned Marketing Features
- `gtm/` - Go-To-Market Strategy Generator
- `templates/` - Marketing Strategy Templates
- `builder/` - Custom Marketing Builder (sentiment-based)

---

## 📁 `src/components/` (UI Layer)
- `Navbar.tsx` - Global navigation with Product, VibeMarket, Skills, Tools links.
- `ToolCard.tsx` - Reusable card component for the tool directory.
- `CopyButton.tsx` - Client-side utility for copying pro-prompts.

---

## 📁 `src/lib/` (Data & Logic Layer)
- `toolsData.ts` - **Tool Knowledge Base**: AI tool definitions, tips, prompts.
- `skillsData.ts` - **Skills Data**: Skill definitions and export formatters.

---

## ⚙️ Configuration Files
- `next.config.ts` - Next.js framework settings.
- `tailwind.config.ts` - Design system variables.
- `tsconfig.json` - TypeScript configuration.
- `package.json` - Dependencies (Next.js, Tailwind, Lucide React).

---

## 🎨 Design System
See `/Ui/Ui-ux.md` for complete design tokens, components, and patterns.

---

## 📊 Information Architecture

```
VibeLab
├── Home (/)
│   └── Tool Directory
│       └── [slug] → Tool Detail Pages
│
├── Skills (/skills)
│   ├── Coding Skills
│   │   ├── Browse & Filter
│   │   └── Skill Creator (/skills/create)
│   │
│   └── Marketing Skills (/vibeMarket)
│       ├── Thread Studio
│       ├── Posting Planner
│       ├── Evergreen Vault
│       ├── Personality Profiles
│       ├── Engagement Scorecard
│       ├── Browser Agent
│       └── (Planned)
│           ├── GTM Generator
│           ├── Strategy Templates
│           └── Custom Builder
```
