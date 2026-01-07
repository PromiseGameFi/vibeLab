# VibeLab Project Structure

## Overview
VibeLab is built using **Next.js 14 (App Router)** with a focus on modularity and high-utility "Manual" pages for AI tools.

---

## 📁 Root Directory
- `src/` - Primary source code containing the application logic.
- `public/` - Static assets including icons, logos, and global SVGs.
- `marketing.md` - Strategy document for VibeLab's "AI Manual" positioning.
- `prd.md` - Core product requirements and vision.
- `progress.md` - Living log of completed and planned features.
- `content.md` - Detailed research findings for all integrated AI tools.
- `Vibelab.md` - Product vision including Universal Skills.

---

## 📁 `src/app/` (Application Layer)
- `[slug]/` - **Dynamic Tool Pages**: Handles the generation of individual "Blueprint" manuals (e.g., `/vibecode`, `/kling`).
- `layout.tsx` - Global layout containing the Navbar and SEO metadata/OG tags.
- `page.tsx` - **Homepage**: Contains the hero section and tool directory.
- `globals.css` - Global styling with Framer-style dark theme.
- `not-found.tsx` - Custom 404 handler for missing manual slugs.

---

## 📁 `src/app/vibeMarket/` (VibeMarket SMM Tool)
- `page.tsx` - **VibeMarket Landing**: The hero section for the X-first SMM tool.
- `thread-studio/` - AI-powered thread builder and preview.
- `planner/` - Visual posting calendar with best-time recommendations.
- `vault/` - Evergreen content storage and recycling with performance tags.
- `profiles/` - Multi-account personality presets with AI prompt export.
- `scorecard/` - Gamified engagement tracker with badges.
- `agent/` - Browser agent for automated X engagement.

---

## 📁 `src/app/skills/` (Universal Skills)
- `page.tsx` - **Skills Directory**: Browse and search AI coding agent skills.
- `create/` - **Skill Creator**: Build custom skills with live preview and export.

---

## 📁 `src/components/` (UI Layer)
- `Navbar.tsx` - Global navigation with Product, VibeMarket, Skills, Tools links.
- `ToolCard.tsx` - Reusable card component for the main tool directory.
- `CopyButton.tsx` - Client-side utility for copying pro-prompts to the clipboard.

---

## 📁 `src/lib/` (Data & Logic Layer)
- `toolsData.ts` - **The Knowledge Base**: Central source of truth for AI tools.
- `skillsData.ts` - **Skills Data**: Universal skill definitions and export formatters.

---

## ⚙️ Configuration Files
- `next.config.ts` - Next.js framework settings.
- `tailwind.config.ts` - Design system variables (Accents, Colors, Spacing).
- `tsconfig.json` - TypeScript configuration and path aliases.
- `package.json` - Dependency management (Next.js, Tailwind, Lucide React).

---

## 🎨 Design System
See `/Ui/Ui-ux.md` for complete design tokens, components, and patterns.
