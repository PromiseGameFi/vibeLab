# VibeLab UI/UX Design System

> **Design Reference**: [Framer.com](https://framer.com) - Premium dark aesthetic

---

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `--background` | `#000000` | Main background (true black) |
| `--background-elevated` | `#0a0a0a` | Elevated surfaces |
| `--background-card` | `rgba(255,255,255,0.03)` | Card backgrounds |
| `--foreground` | `#ffffff` | Primary text |
| `--foreground-secondary` | `#999999` | Secondary text, descriptions |
| `--foreground-muted` | `#666666` | Muted text, placeholders |
| `--accent` | `#0066FF` | Primary accent (blue) |
| `--accent-secondary` | `#8B5CF6` | Secondary accent (purple) |
| `--border` | `rgba(255,255,255,0.1)` | Default borders |
| `--border-hover` | `rgba(255,255,255,0.2)` | Hover state borders |

---

## Typography

### Font Stack
```css
font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
```

### Hierarchy

| Element | Size | Weight | Notes |
|---|---|---|---|
| Hero Title | `clamp(3rem, 10vw, 5rem)` | 400 | Use `<em>` for italic emphasis |
| Section Title | `clamp(2rem, 5vw, 3rem)` | 400 | Use `<em>` for italic |
| Card Title | `1.25rem` (20px) | 600 | Semibold |
| Body Text | `1rem` (16px) | 400 | Regular |
| Small Text | `0.875rem` (14px) | 500 | Medium |
| Label | `0.75rem` (12px) | 500 | Uppercase, tracking-wider |

### Example
```html
<h1 class="hero-title">Build better <em>AI workflows,</em> faster</h1>
```

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `12px` | Small elements, badges |
| `--radius-md` | `20px` | Inputs, medium cards |
| `--radius-lg` | `28px` | Large cards, sections |
| `--radius-pill` | `9999px` | Buttons, badges |

---

## Buttons

### Primary (`.btn-primary`)
- **Background**: White `#ffffff`
- **Text**: Black `#000000`
- **Border Radius**: Pill (9999px)
- **Hover**: Scale 1.02, subtle glow

```html
<button class="btn-primary">Start for free</button>
```

### Secondary (`.btn-secondary`)
- **Background**: Transparent
- **Border**: 1px `--border`
- **Text**: White
- **Hover**: Subtle background fill

```html
<button class="btn-secondary">
  Explore VibeMarket
  <ArrowRight />
</button>
```

### Ghost (`.btn-ghost`)
- **Background**: None
- **Text**: White
- **Arrow**: Moves right on hover

```html
<span class="btn-ghost">Learn more <ArrowRight /></span>
```

---

## Cards

### Standard Card (`.card`)
```css
.card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28px;
}
```

### Interactive Card (`.card-interactive`)
- Adds `cursor: pointer`
- On hover: `translateY(-2px)`, elevated shadow

### Card Anatomy
```
┌────────────────────────────────┐
│  Badge (optional)              │
│  Title (font-semibold, white)  │
│  Description (gray)            │
│  ─────────────────────────     │
│  Footer / CTA                  │
└────────────────────────────────┘
```

---

## Badges

### Standard (`.badge`)
```html
<span class="badge">Category</span>
```
- Background: `--background-card`
- Border: `--border`
- Radius: Pill
- Font: 12px, medium weight

### Accent (`.badge-accent`)
- Background: Blue 10%
- Border: Blue 20%
- Text: `--accent`

---

## Inputs

```html
<input class="input" placeholder="Search..." />
```

| Property | Value |
|---|---|
| Background | `--background-card` |
| Border | `--border` |
| Border Radius | `--radius-md` (20px) |
| Padding | `0.875rem 1rem` |
| Focus | Border `--border-hover`, subtle glow |

---

## Spacing System

| Value | Pixels | Usage |
|---|---|---|
| `1` | 4px | Tight gaps |
| `2` | 8px | Icon gaps |
| `3` | 12px | Small gaps |
| `4` | 16px | Default gap |
| `6` | 24px | Section padding |
| `8` | 32px | Large gaps |
| `12` | 48px | Section margins |
| `16` | 64px | Hero padding |
| `24` | 96px | Section vertical spacing |

---

## Layout Patterns

### Hero Section
- Centered text
- Large bold/italic headline
- Description in secondary color
- Two pill buttons side-by-side
- Padding: `pt-32 pb-24`

### Feature Section
- Two-column layout (text left, visual right)
- Sticky scroll behavior (optional)
- Border-top separator

### Grid Layout
- 1 column mobile, 2 tablet, 3 desktop
- Gap: `24px` (gap-6)

---

## Navbar

```
┌─────────────────────────────────────────────┐
│  Logo     [Product] [VibeMarket] [Tools]    │
│                                   Log in  [Sign up] │
└─────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Background | Transparent (scrolled: black 80% + blur) |
| Padding | `1rem 2rem` |
| Links | Gray on default, white on hover |
| CTA | White pill button |

---

## Animations

### Transitions
```css
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

### Hover Effects
- Buttons: `transform: scale(1.02)`
- Cards: `translateY(-2px)`
- Links: Color change + gap increase for arrows

### Page Animations
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## Icons

**Library**: [Lucide React](https://lucide.dev/icons/)

| Size | Pixels | Usage |
|---|---|---|
| `w-3 h-3` | 12px | Badge icons, inline |
| `w-4 h-4` | 16px | Buttons, navigation |
| `w-5 h-5` | 20px | Card headers |
| `w-6 h-6` | 24px | Feature icons |
| `w-8 h-8` | 32px | Stats, large icons |

---

## Component Quick Reference

| Component | Class | Key Features |
|---|---|---|
| Button Primary | `.btn-primary` | White pill, black text |
| Button Secondary | `.btn-secondary` | Transparent, border |
| Button Ghost | `.btn-ghost` | Text only, arrow |
| Card | `.card` | Dark glass, rounded |
| Badge | `.badge` | Pill shape, small text |
| Input | `.input` | Dark bg, rounded |

---

## File Structure

```
src/
├── app/
│   ├── globals.css        # Design system tokens
│   ├── page.tsx           # Homepage
│   ├── [slug]/page.tsx    # Tool detail
│   └── vibeMarket/        # SMM feature pages
├── components/
│   ├── Navbar.tsx
│   ├── ToolCard.tsx
│   ├── SpawnerTerminal.tsx
│   └── BlueprintCanvas.tsx
└── lib/
    └── toolsData.ts       # Data layer
```

---

## Adding New Features

When adding new pages or components:

1. **Use existing CSS classes** - `.btn-primary`, `.card`, `.badge`, `.input`
2. **Follow spacing system** - Use Tailwind spacing (4, 6, 8, 12, 24)
3. **Match typography** - Use established font sizes and weights
4. **Maintain dark aesthetic** - True black base, subtle borders
5. **Add hover states** - All interactive elements need transitions
6. **Use Lucide icons** - Consistent icon library

---

## Reference Screenshots

| Homepage | Tool Cards | VibeMarket |
|---|---|---|
| Bold italic hero, pill CTAs | Dark cards, blue accent badges | Centered hero, feature grid |
