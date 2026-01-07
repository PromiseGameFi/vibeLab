# Content - VibeLab Research & Guides

This file contains the deep research findings used to populate VibeLab.

## Vibecode & Vibe Coding
- **Advanced Workflow**: "Vibe PMing" - Use AI to generate a full README.md and technical design document *before* any code.
- **Tip**: Modular refinement. Refactor file-by-file to keep context clean.
- **Debugger**: Invoke "Debug Voice" to ask the AI to explain architectural failures.

## Kling (Video)
- **Advanced Workflow**: FORMS formula (Focus, Outcome, Realism, Motion, Setting).
- **Control**: Use Motion Brush for sub-frame animation control.
- **Consistency**: Elements feature - upload up to 4 images to lock in character faces and costumes.

## Midjourney (Image)
- **Parameters**: `--sref` (Style Reference) with weight codes. `--p` (Personalization) for unique style learning.
- **Realism**: `--style raw` and `--v 6.1` for pure photographic output.
- **Character**: `--cref` for consistent faces across generations.

## Cursor (IDE)
- **Advanced Workflow**: `.cursorrules` for project scaffolding.
- **Tip**: Use '@Codebase' to force the AI to index the entire project before answering complex technical questions.
- **Power Feature**: Composer (Cmd+I) for multi-file feature implementation.

## Luma Dream Machine (Video)
- **Advanced Workflow**: Keyframe interpolation. Set Start/End frames to dictate transitions.
- **Tip**: Loop prompts for 360 world assets or infinite textures.

## Flux.1 (Image)
- **Advanced Workflow**: Layered prompting (Foreground -> Mid-ground -> Background).
- **Tip**: Natural language is better than weights. MJ weights don't work here.
- **Power Feature**: Perfect text rendering for posters, UI, and signage.

## Meshy (3D)
- **Advanced Workflow**: AI Texture Healing - re-render artifact-heavy areas of a model by positioning the camera close to them.
- **Tip**: Style Transfer - use existing 3D assets to match new ones.

## Skybox AI (Environments)
- **Advanced Workflow**: Depth Map Integration. Export 2k depth maps into Unity for instant 3D geometry.
- **Tip**: 'Advanced (No Style)' for maximum control over complex structural prompts.

## ElevenLabs (Audio)
- **Advanced Workflow**: '[Audio Tags]' - Using bracketed cues like `[happy]` or `[whispers]` to direct the AI performance.
- **Tip**: Speech-to-Speech is the most reliable way to get custom emotional cadence.

---

## Universal Skills Content

Skills are reusable instruction sets for AI coding agents. Each skill contains:

### Skill Categories
| Category | Description |
|---|---|
| Frontend | React, Next.js, Vue, Tailwind, CSS |
| Backend | Node, Python, Go, APIs, Databases |
| DevOps | Docker, CI/CD, Deployment, Git |
| Testing | Jest, Playwright, Vitest, TDD |
| AI/ML | Prompting, Fine-tuning, RAG |
| General | TypeScript, Code Style, Architecture |

### Pre-built Skills
1. **Next.js App Router** - Server Components, App Router patterns
2. **React Best Practices** - Hooks, composition, performance
3. **TypeScript Strict Mode** - Type-safe development patterns
4. **Tailwind CSS Patterns** - Utility-first CSS organization
5. **REST API Design** - Endpoints, status codes, error handling
6. **Git Commit Convention** - Conventional commits, branching

### Skill Anatomy
```yaml
---
name: skill-name
description: What it does and when to use it
category: frontend | backend | devops | testing | ai-ml | general
agents: [cursor, claude-code, antigravity, codex, windsurf, cline]
---

## Instructions
- Step-by-step guidance

## Rules
- NEVER do X
- ALWAYS do Y

## Examples
- Code snippets
```
