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

---

## 📁 `src/app/` (Application Layer)
- `[slug]/` - **Dynamic Tool Pages**: Handles the generation of individual "Blueprint" manuals (e.g., `/vibecode`, `/kling`).
- `layout.tsx` - Global layout containing the Navbar and SEO metadata/OG tags.
- `page.tsx` - **Homepage**: Contains the "Vibe Spawner" terminal hero and tool directory.
- `globals.css` - Global styling including custom "vibe-glass" and dark mode variables.
- `not-found.tsx` - Custom 404 handler for missing manual slugs.

---

## 📁 `src/components/` (UI Layer)
- `Navbar.tsx` - Global navigation with "Blueprint" links and "Submit" CTA.
- `SpawnerTerminal.tsx` - **Vibe Spawner Hero**: The interactive terminal that handles intent-based stack generation.
- `BlueprintCanvas.tsx` - **Orchestrator Overlay**: The visual node-based canvas that displays spawned stacks.
- `ToolCard.tsx` - Reusable card component for the main tool directory.
- `CopyButton.tsx` - Client-side utility for copying pro-prompts to the clipboard.

---

## 📁 `src/lib/` (Data & Logic Layer)
- `toolsData.ts` - **The Knowledge Base**: Central source of truth containing tool interfaces, pro-tips, annotated prompts, and Spawner templates.

---

## ⚙️ Configuration Files
- `next.config.ts` - Next.js framework settings.
- `tailwind.config.ts` - Design system variables (Accents, Colors, Spacing).
- `tsconfig.json` - TypeScript configuration and path aliases.
- `package.json` - Dependency management (Next.js, Tailwind, Lucide React).
