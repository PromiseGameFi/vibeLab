# AI Project Scaffolding Prompt

**Copy and paste the following prompt into any AI agent or LLM (like Claude, ChatGPT, or Antigravity) to initialize your project with the VibeLab documentation stack.**

---

**You are an expert Senior Software Architect and Project Manager.**

I am starting a new project. Your goal is to set up the "Brain" of the project by generating a set of core Markdown specification files. These files will guide all future development and ensure the project remains organized, scalable, and easy for AI agents to navigate.

**Task:**
1.  Ask me for the **Project Name** and a **Description** of what I want to build.
2.  Once I provide that, generate the following **9 files** with the specific content templates below.
3.  **Adapt the content** of each file (Tech Stack, Requirements, Features) to match the project description I give you.
4.  **Strictly maintain the directory structure** defined in the file paths.

---

### File 1: `prd.md` (Product Requirements Document)
**Path:** `./prd.md`
**Content Template:**
```markdown
# [Project Name] - Product Requirements

## Vision
[One sentence "North Star" vision for the project]

## Core Pillars
1. **Feature A**: [Description]
2. **Feature B**: [Description]
3. **Feature C**: [Description]

## User Flow
[Step-by-step walkthrough of how a user interacts with the app]
1. User lands on ...
2. User clicks ...
3. System responds ...

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **State**: [e.g., Zustand, Context]
- **Database**: [e.g., Supabase, PostgreSQL]
- **AI**: [e.g., Gemini, OpenAI]

## Future Roadmap
- [ ] [Feature X]
- [ ] [Feature Y]
```

---

### File 2: `progress.md` (Project Tracker)
**Path:** `./progress.md`
**Content Template:**
```markdown
# Progress Tracker - [Project Name]

##  Completed
- [ ] Project Initialization

##  In Progress
- [ ] [Current Active Task]

##  Planned
### Phase 1: MVP
- [ ] Setup Next.js + Tailwind
- [ ] Create basic layout (Navbar, Footer)
- [ ] [Feature A] Implementation

### Phase 2: Core Features
- [ ] [Feature B] Implementation
- [ ] [Feature C] Implementation

### Phase 3: Polish
- [ ] UI/UX Refinement
- [ ] Mobile Responsiveness
```

---

### File 3: `structure.md` (Architecture Map)
**Path:** `./structure.md`
**Content Template:**
```markdown
# Codebase Structure

## Overview
This document maps the project structure to help AI agents navigate without excessive file listing.

## Root Directory
- `src/` - Source code
- `public/` - Static assets
- `prd.md` - Requirements
- `progress.md` - Status log
- `structure.md` - This file
- `content.md` - Static content/data
- `CONTRIBUTING.md` - Dev guidelines
- `.agent/` - Agent rules and workflows

## Key Directories
### `src/app/` (Routes)
- `/` - Landing Page
- `/dashboard` - [Description]

### `src/components/`
- `ui/` - Reusable primitives (Buttons, Cards)
- `features/` - Feature-specific components

### `src/lib/`
- `utils.ts` - Helper functions
- `api.ts` - API clients
```

---

### File 4: `PROMPT.md` (Context Memory)
**Path:** `./PROMPT.md`
**Content Template:**
```markdown
# Current Task Context

## Objective
[Describe the immediate specific task to work on RIGHT NOW]

## Sub-Tasks
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Constraints
- Follow the design system in `Ui/design_system.md`
- Use TypeScript strict mode
- Update `progress.md` upon completion

## Exit Condition
When all sub-tasks are checked and the server creates no errors.
```

---

### File 5: `Ui/design_system.md` (UI/UX Specs)
**Path:** `./Ui/design_system.md`
**Content Template:**
```markdown
# Design System

## Philosophy
[e.g., "Premium Dark Mode", "Clean Minimalist", "Cyberpunk"]

## Color Palette
| Token | Value | Usage |
|---|---|---|
| `--background` | `...` | Main background |
| `--foreground` | `...` | Main text |
| `--primary` | `...` | Primary buttons/accents |
| `--secondary` | `...` | Secondary elements |

## Typography
- **Headings**: Inter / Sans-serif
- **Body**: Inter / Sans-serif

## Components
### Buttons
- **Primary**: Pill shape, solid background
- **Secondary**: Outline, transparent background

### Cards
- **Style**: Glassmorphism (backdrop-blur), thin borders
- **Radius**: `rounded-2xl`
```

---

### File 6: `content.md` (Static Content & Data)
**Path:** `./content.md`
**Content Template:**
```markdown
# Project Content & Constants

## Overview
This file serves as the Single Source of Truth for static text, label strings, and configuration constants. AI agents should read from here instead of hardcoding text in components.

## Site Metadata
- **Title**: [Project Name]
- **Description**: [Project Description]

## Feature Content
### [Feature A]
- **Headline**: "..."
- **Subtext**: "..."

### [Feature B]
- **Headline**: "..."
- **Subtext**: "..."

## References
[Links to external docs, APIs, or resources]
```

---

### File 7: `CONTRIBUTING.md` (Developer Guidelines)
**Path:** `./CONTRIBUTING.md`
**Content Template:**
```markdown
# Contributing to [Project Name]

## Getting Started
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.

## Coding Standards
- **Framework**: Next.js App Router (strict adherence).
- **Styling**: Tailwind CSS only (no CSS-in-JS).
- **Type Safety**: TypeScript Strict Mode enabled.
- **Formatting**: Code should be formatted with Prettier.

## Commit Message Convention
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `chore:` Maintenance tasks
```

---

### File 8: `.agent/rules/rules.md` (Agent Instructions)
**Path:** `./.agent/rules/rules.md`
**Content Template:**
```markdown
# Project Rules for AI Agents

## Overview
These rules must be followed by any AI agent working on this codebase.

## Tech Stack Rules
1. **Next.js**: Use App Router (`app/` directory).
2. **Tailwind**: Use utility classes, avoid arbitrary values (use config).
3. **Icons**: Use Lucide React.
4. **Data**: Define types/interfaces in `src/types`.

## Workflow
1. **Read**: Always read `PROMPT.md` first to understand the active task.
2. **Plan**: Update `structure.md` if creating new files.
3. **Log**: Mark tasks as complete in `progress.md`.

## Coding Standards
- Use functional React components.
- Ensure mobile responsiveness (`md:`, `lg:` prefixes).
- No console logs in production code.
```

---

### File 9: `.agent/workflows/docs-sync.md` (Documentation Workflow)
**Path:** `./.agent/workflows/docs-sync.md`
**Content Template:**
```markdown
---
description: How to keep documentation files updated when making changes
---

# Documentation Sync Workflow

## Trigger
Use this workflow whenever you complete a coding task or modify the project structure.

## Rules

### 1. Update `progress.md`
- Mark the completed task as `[x]`.
- Add any new sub-tasks discovered during implementation.

### 2. Update `structure.md`
- If you created a new file, add it to the file tree.
- If you deleted a file, remove it.

### 3. Update `content.md`
- If you introduced new user-facing text, add it here first.
- Do not hardcode long text strings in React components.

### 4. Update `prd.md`
- If the implementation deviated from the original plan, update the specs to match reality.
```
