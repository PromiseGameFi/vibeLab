# Contributing to VibeLab

## Documentation Update Rules

When contributing to VibeLab, please keep the documentation files in sync with your changes.

### Always Update

| File | When |
|------|------|
| `progress.md` | After completing any feature or milestone |
| `structure.md` | When adding new files, folders, pages, components, or API routes |

### Update When Relevant

| File | Purpose | Update When |
|------|---------|-------------|
| `prd.md` | Product requirements & vision | Adding major features or changing product direction |
| `Vibelab.md` | Product vision & architecture | Adding new product areas (e.g., new Skills category) |
| `content.md` | Tool & skill content definitions | Adding new tools or skills content |
| `marketing.md` | Marketing strategy & positioning | Updating go-to-market or messaging |
| `SMM.md` | Social media toolkit specs | Updating VibeMarket/SMM features |
| `Ui/Ui-ux.md` | Design system documentation | Adding new components or changing design tokens |
| `README.md` | Project setup & overview | Changing dependencies or setup instructions |

---

## Code Style

- Use **TypeScript** with strict mode
- Follow the **Framer-style design system** in `Ui/Ui-ux.md`
- Use **functional React components**
- Keep components focused and reusable
- Use semantic HTML tags

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + CSS Variables
- **Icons:** Lucide React
- **AI:** Groq API (llama-3.3-70b-versatile)

---

## Environment Variables

Copy `.env.example` to `.env.local` and add your keys:

```bash
GROQ_API_KEY=your_groq_api_key
```

---

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`
