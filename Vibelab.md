# VibeLab

> Everything you need to build a brand.

---

## Vision

**VibeLab is the universal hub for AI tool optimization** — providing blueprints, pro prompts, and now **universal coding agent skills** that work across every major AI IDE.

---

## Products

### 1. Tool Directory
Curated guides for AI tools (Vibecode, Kling, Midjourney, etc.) with pro tips and workflow blueprints.

### 2. VibeMarket
SMM toolkit for X (Twitter) — Thread Studio, Planner, Vault, Browser Agent, Scorecard, Profiles.

### 3. Universal Skills *(NEW)*
**The Hugging Face of AI coding skills** — create, share, and export skills that work across all coding agents.

---

## Universal Skills

### The Problem
Every AI coding agent has its own format:

| Agent | Format |
|---|---|
| Cursor | `.cursorrules` |
| Claude Code | `CLAUDE.md` / Skills |
| Codex / ChatGPT | System prompts |
| Windsurf | `.windsurfrules` |
| Antigravity | `.agent/workflows/` |
| Cline | `.clinerules` |

Developers rewrite the same knowledge for each tool. There's no universal standard.

### The Solution
VibeLab introduces a **Universal Skill Format** that:
1. **Creates once** → Exports to any agent format
2. **Portable** → Works in Cursor, Claude Code, Antigravity, etc.
3. **Shareable** → Community skill marketplace

### Skill Format

```yaml
---
name: nextjs-app-router
description: Best practices for Next.js App Router development
agents: [cursor, claude-code, antigravity, codex]
category: frontend
---
```

```markdown
# Next.js App Router

## Instructions
- Use `app/` directory structure
- Prefer Server Components by default
- Use `"use client"` only when needed
- ...

## Examples
[Concrete examples]
```

### Export Targets

| Target | Output |
|---|---|
| Cursor | `.cursorrules` file |
| Claude Code | `CLAUDE.md` + Skills folder |
| Antigravity | `.agent/workflows/*.md` |
| Codex | System prompt text |
| Copy/Paste | Raw markdown |

### Skill Categories
- **Frontend**: React, Next.js, Vue, Tailwind
- **Backend**: Node, Python, Go, APIs
- **DevOps**: Docker, CI/CD, Deployment
- **Testing**: Jest, Playwright, Vitest
- **AI/ML**: Prompting, Fine-tuning, RAG

### Revenue Model
- **Free**: Browse & use community skills
- **Pro**: Create private skills, analytics, team sharing
- **Enterprise**: Custom skill library, SSO, API access

---

## Why This Wins

| Factor | Advantage |
|---|---|
| **First mover** | No dominant standard exists |
| **Real pain point** | Devs hate rewriting rules per IDE |
| **Viral potential** | Skills are shareable |
| **Low barrier** | Just markdown + YAML |
| **Network effects** | More skills → more users → more skills |

---

## Roadmap

### Phase 1: Foundation
- [ ] Universal Skill format spec
- [ ] Skill Creator UI
- [ ] Export to Cursor, Claude Code

### Phase 2: Marketplace
- [ ] Community skill directory
- [ ] Import existing `.cursorrules`
- [ ] User profiles & ratings

### Phase 3: Ecosystem
- [ ] IDE plugins (VS Code, JetBrains)
- [ ] API for programmatic access
- [ ] Enterprise features
