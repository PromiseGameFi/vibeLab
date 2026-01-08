---
description: How to keep documentation files updated when making changes
---

# Documentation Update Workflow

When making changes to the VibeLab codebase, follow these rules to keep docs in sync.

## Always Update These Files

### 1. `progress.md`
Update after completing any feature or milestone.
- Mark items as `[x]` when done
- Add new items under appropriate sections

### 2. `structure.md`
Update when adding:
- New pages (`src/app/*/page.tsx`)
- New components (`src/components/*.tsx`)
- New lib files (`src/lib/*.ts`)
- New API routes (`src/app/api/*/route.ts`)

---

## Update When Relevant

| Change Type | File to Update |
|-------------|----------------|
| Major new feature | `prd.md`, `Vibelab.md` |
| New tool or skill content | `content.md` |
| Marketing/messaging changes | `marketing.md` |
| VibeMarket/SMM updates | `SMM.md` |
| New UI components | `Ui/Ui-ux.md` |
| Dependency changes | `README.md` |

---

## Checklist Before Completing Any Task

- [ ] Updated `progress.md` with completed items
- [ ] Updated `structure.md` if new files added
- [ ] Updated relevant content docs if applicable
