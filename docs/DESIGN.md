# MidasAI — Design System (UI Source of Truth)

This document is derived from the **actual implemented tokens** in `tailwind.config.ts` and the conventions used across existing pages (e.g. `app/(marketing)/listing/[id]/page.tsx`, `app/(protected)/developer/keys/new/page.tsx`). It is the reference for keeping UI consistent. Inspirations: Stripe, Linear, Vercel, GitHub, Notion, Cursor — a **dark luxury technology marketplace**.

> Rule of thumb: prefer existing tokens/components over inventing new ones. If a value isn't here, check `tailwind.config.ts` and `app/globals.css` before adding.

---

## 1. Branding & theme
- Dark-first (`darkMode: "class"`), deep near-black canvas with **gold** as the primary accent/CTA and subtle ambient glow + noise overlays.
- Signature effects: `.glass` surfaces, `shadow-glow` (gold) / `shadow-glow-blue`, `ambient-glow`, `noise-overlay`.

## 2. Color tokens (from `tailwind.config.ts`)
| Token | Value | Use |
|-------|-------|-----|
| `background` | `#09090B` | Page canvas |
| `surface` | `#18181B` | Panels, inputs |
| `elevated` | `#27272A` | Raised elements |
| `card` | `#1C1917` | Cards |
| `glass` | `rgba(28,25,23,0.6)` | Glass cards (with `backdrop-blur`) |
| `cta` / `cta.light` | `#CA8A04` / `#EAB308` | Primary buttons, links, highlights |
| `accent.blue/purple/green/red` | `#3B82F6` / `#8B5CF6` / `#10B981` / `#EF4444` | Status, gradients |
| `destructive` | `#EF4444` | Errors, destructive actions |
| `text.primary/secondary/tertiary` | `#FAFAF9` / `#A1A1AA` / `#71717A` | Text hierarchy |
| `border` | `rgba(255,255,255,0.1)` | Hairline borders |
| `ring` | `#CA8A04` | Focus rings |

Common ad-hoc utilities seen in code: `bg-white/[0.04]`, `border-white/[0.08]`, `focus:border-amber-500/50` for inputs.

## 3. Typography
- Font: **DM Sans** (`font-sans` and `font-heading`), fallback `system-ui`.
- Scale (observed): page H1 `text-4xl`→`text-6xl font-bold`; section H2 `text-3xl font-bold`; card titles `text-xl`/`text-2xl`; body `text-base`/`text-sm`; meta `text-xs`.
- Body text `text-text-secondary`; muted/meta `text-text-tertiary`.

## 4. Spacing & grid
- Container: centered, `padding: 2rem`, max width `2xl: 1400px`. Page content commonly wrapped in `container mx-auto px-4 py-12`.
- Content max widths: marketing detail `max-w-5xl`/`max-w-6xl`; forms `max-w-2xl`.
- Extra spacing steps: `18, 22, 72, 84, 96`. Section rhythm: `mb-8`/`mb-12`/`mb-16`.
- Radius: `sm .375rem` → `3xl 1.5rem`, `full`. Cards typically `rounded-xl`.

## 5. Motion
- Durations: `fast 150ms`, `base 200ms`, `slow 300ms`, `slower 400ms`, `slowest 600ms`; easing `smooth` = `cubic-bezier(0.4,0,0.2,1)`.
- Named animations: `fade-in-up`, `scale-in`, `float`, `pulse-glow`, `shimmer`, `slide-in-right`, `pulse-subtle`, `notification-dot`.
- Convention: stagger lists with inline `style={{ animationDelay: '${i*0.1}s' }}` + `animate-fade-in-up`. Hover: `transition-smooth`, `group-hover:shadow-glow`, `hover:scale-105`.

## 6. Components (inventory in `components/ui`)
`button`, `input`, `textarea`, `label`, `select`, `card`, `badge`, `dropdown-menu`, `separator`, `loading`, `upload-modal`, `animated-background`, plus banners. Reuse these; do not duplicate.

### Buttons
- Primary CTA: gold (`bg-amber-500 text-black hover:bg-amber-400`) or `Button` default + `shadow-glow`. Sizes via `size`; icon-only `size="icon"`. Disabled: `disabled:opacity-50`.

### Cards
- `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`. Marketplace/detail cards use `glass` + `hover:shadow-glow transition-all`.

### Forms
- Label above control. Inputs: `w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50`. Helper text `text-xs text-white/40 mt-1`. Errors `text-sm text-red-500`.

### Badges
- `Badge variant="secondary"` with `bg-white/[0.1] text-white/80` for tags/status pills.

### Tables / lists
- Prefer card-grid or row lists with hairline dividers `border-white/5`; right-align numeric/meta.

### Notifications
- Toast system (`NotificationProvider`) using `slide-in-right`/`slide-out-right` + `notification-dot` pulse.

## 7. Page archetypes
- **Marketplace / listing detail:** hero title + description, glass media/action card, sidebar "Details" + "Creator" cards, reviews section. Back-link to `/`.
- **Creator pages:** upload (option cards), listings, analytics, payouts, settings.
- **Billing pages:** plan tiers (FREE/STARTER/PRO/BUSINESS), usage meters (`x / limit`), upgrade prompts.
- **Dashboard:** greeting, stat cards, quick actions, priorities, analytics overview, usage overview, profile card.
- **Admin:** users / listings / settings moderation tables.

## 8. States
- **Empty:** centered icon + headline + sub-copy + primary CTA (see `/blog`, dashboard empty metrics).
- **Loading:** `components/ui/loading.tsx`, skeleton/`shimmer`; buttons show "…ing" label and disable.
- **Upgrade prompts:** `UpgradeBanner` / `DeveloperConversionBanners` — gold gradient, never block core UX.

## 9. Responsive & mobile
- Mobile-first; grids collapse `grid-cols-1` → `md:grid-cols-2` → `lg:grid-cols-3/4`. Hero type scales `text-5xl md:text-6xl`. Sidebars hidden/drawer on small screens.

## 10. Accessibility
- Maintain text contrast against `#09090B`; visible focus via `ring` gold. Use semantic headings, `Label` with `htmlFor`, `alt` on images, and accessible names on icon-only buttons.
