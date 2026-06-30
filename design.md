# MidasAI Design System

**Last updated:** 2026-06-23  
**Status:** Canonical reference for UI agents — matches `app/globals.css` and live components.

---

## Brand Direction

**Dark luxury technology marketplace** — premium, confident, minimal chrome. Inspiration: Linear (density + clarity), Stripe (trust), Vercel (motion), OpenAI (typography hierarchy).

Not generic SaaS. Not light-mode-first.

---

## Color Palette

| Token | Value | Usage |
|-------|-------|--------|
| Background | `#09090B` | Page canvas (`--background`) |
| Foreground | `#FAFAF9` | Primary text |
| Card | `#1C1917` | Elevated surfaces |
| Muted | `#27272A` / `#A1A1AA` | Secondary text, borders |
| **CTA / Accent** | `#CA8A04` (gold) | Primary actions, highlights, stars |
| Destructive | `#EF4444` | Errors, destructive actions |
| Verified badge | `emerald-400` on `emerald-500/10` | Social proof (reviews) |
| Border | `rgba(255,255,255,0.1)` | Cards, inputs, dividers |

Tailwind aliases used in components: `text-text-primary`, `text-text-secondary`, `text-text-tertiary`, `bg-surface`, `text-cta`, `bg-cta`, `glass`.

---

## Typography

| Role | Font | Weights |
|------|------|---------|
| Headings | Poppins (`--font-heading`) | 400–700 |
| Body | Open Sans / DM Sans (`--font-sans`) | 300–700 |

Scale: Hero `text-5xl–6xl`, page title `text-3xl–4xl`, section `text-2xl`, body `text-sm–base`, meta `text-xs`.

---

## Layout & Spacing

- **Container:** `container mx-auto px-4`
- **Section padding:** `py-12` (pages), `p-6` (cards)
- **Grid:** `max-w-5xl` listing detail, `lg:grid-cols-3` detail layout
- **Sticky sidebar:** `sticky top-24` on listing detail

### Navigation architecture (2026-06)

| Context | Component | Notes |
|---------|-----------|--------|
| Public / marketplace | `Navbar` + `Footer` | Root layout |
| Authenticated app | `AuthenticatedNavbar` only | `(authenticated)/layout` via `AuthenticatedShell` |
| Rule | Guest chrome hidden on auth routes | `lib/routing.ts` → `isAuthenticatedAppRoute()` |

**Never render both navbars on the same route.**

---

## Components

### Cards
- Class: `glass` — glassmorphism, subtle border, backdrop blur
- Hover: `hover:shadow-glow transition-smooth`

### Buttons
- Primary: gold gradient `from-cta to-cta-light`, `shadow-glow`
- Outline: `border border-white/10`, ghost on dark surfaces

### Badges
- Verified review: green pill + `BadgeCheck` icon
- Status pills: `rounded-full px-3 py-1 text-xs`

### Code / install blocks
- Background `#0a0a0f`, monospace, `text-green-400`

---

## Motion

- `animate-fade-in-up` on page sections
- `transition-smooth` on interactive elements
- `PremiumGradientBackground` on authenticated shell
- `ambient-glow` + `noise-overlay` on marketplace pages

---

## Accessibility

- Focus rings: `focus-visible:ring-2 focus-visible:ring-cta`
- Icon-only buttons need `aria-label`
- Badge text must be readable (not color-only)

---

## Page Patterns

### Listing detail (`/listing/[id]`)
1. Back link → title/description
2. Media + CTA row (download/purchase, bookmark, share)
3. Install commands (per platform)
4. FAQ accordion-style list
5. Reviews with verified badges + creator responses
6. Sticky details sidebar + creator card

### Creator listing management (`/creator/listings/[id]/*`)
- Subnav tabs: Reviews | FAQ | Install
- `ListingSubnav` shared across sub-pages

---

## Do / Don't

**Do**
- Reuse shadcn primitives from `components/ui`
- Keep marketplace-first navigation for all logged-in users
- Use real Supabase data; empty states over mock data

**Don't**
- Add a second navbar on authenticated routes
- Use light-mode-only colors on forced-dark pages
- Hardcode install commands in JSX — use `listing_install_commands` table
