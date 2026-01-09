# Content - VibeLab Research & Guides

Research and content specifications for VibeLab features.

---

## AI Tool Blueprints

### Coding Tools
| Tool | Key Features |
|------|--------------|
| **Vibecode** | Vibe PMing (README first), modular loops |
| **Cursor** | .cursorrules, @Codebase, Composer (Cmd+I) |

### Image Tools
| Tool | Key Features |
|------|--------------|
| **Midjourney** | --sref, --cref, --style raw, --v 6.1 |
| **Flux.1** | Perfect text rendering, layered prompts |

### Video Tools
| Tool | Key Features |
|------|--------------|
| **Kling** | FORMS formula, Motion Brush, Elements |
| **Luma Dream Machine** | Keyframe interpolation, loop prompts |

### 3D Tools
| Tool | Key Features |
|------|--------------|
| **Meshy** | Image-to-3D, AI Healing, FBX export |
| **Skybox AI** | 360° environments, depth maps |

### Audio Tools
| Tool | Key Features |
|------|--------------|
| **ElevenLabs** | [Audio tags], Speech-to-Speech |

---

## Token Cost Data (Jan 2025)

| Provider | Input/1M | Output/1M |
|----------|----------|-----------|
| GPT-4o | $2.50 | $10.00 |
| GPT-4o Mini | $0.15 | $0.60 |
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3 Haiku | $0.25 | $1.25 |
| Gemini 1.5 Pro | $1.25 | $5.00 |
| Gemini 1.5 Flash | $0.075 | $0.30 |
| DeepSeek V3 | $0.27 | $1.10 |

---

## Prompt Optimization Patterns

### Filler Words to Remove
- please, kindly, basically, actually
- just, really, very, quite, literally

### Verbose → Concise
| Before | After |
|--------|-------|
| "in order to" | "to" |
| "due to the fact that" | "because" |
| "at this point in time" | "now" |
| "I would like you to" | (remove) |
| "Can you please" | (remove) |

---

## Security Scanner Patterns

### Pattern Categories
| Category | Examples |
|----------|----------|
| Secrets | API keys, tokens, passwords |
| Crypto | Weak algorithms, hardcoded keys |
| Injection | SQL, XSS, command injection |
| Auth | Missing validation, weak session |
| Config | Debug mode, CORS misconfig |

### External APIs
| API | Coverage |
|-----|----------|
| OSV | Open source vulnerabilities |
| deps.dev | Dependency metadata |
| GitHub Advisory | Security advisories |

---

## Coding Skills Content

### Pre-built Skills
1. **Next.js App Router** - Server Components, App Router
2. **React Best Practices** - Hooks, composition
3. **TypeScript Strict Mode** - Type-safe patterns
4. **Tailwind CSS Patterns** - Utility organization
5. **REST API Design** - Endpoints, error handling
6. **Git Commit Convention** - Conventional commits

### Export Formats
| Agent | File |
|-------|------|
| Cursor | .cursorrules |
| Claude Code | CLAUDE.md |
| Antigravity | .agent/workflows/ |
| Windsurf | .windsurfrules |
| Cline | .clinerules |

---

## Marketing Strategy Templates

| Template | Target |
|----------|--------|
| SaaS Launch | PLG, freemium, B2B |
| Creator Economy | Audience, monetization |
| E-commerce | D2C, subscriptions |
| Agency Model | Client acquisition |
| Developer Tools | DevRel, open source |
