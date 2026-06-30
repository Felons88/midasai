# PROJECT_CONTEXT.md — MidasAI Architecture Map

> **Purpose:** Complete architecture reference for IDE agents. Read this to understand the full system before making changes.  
> **Last updated:** 2026-06-29  
> **Canonical deep reference:** `MIDASAI_BIBLE.md` (28K words)

---

## 1. What Is MidasAI

A production SaaS marketplace and discovery platform for AI development resources: Claude Skills, Cursor Rules, Windsurf Workflows, MCP Servers, AI Agents, Prompt Packs, Templates, and Automations.

**Not a demo. Not a prototype. Every change must be production-ready.**

Think: GitHub + Product Hunt + Gumroad + npm — for AI ecosystems.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 App Router (TypeScript) |
| Styling | Tailwind CSS 3.4 + shadcn/ui + Radix |
| Database | Supabase PostgreSQL (project: `rqermggomchlipmuigan`) |
| Auth | Supabase Auth (cookie-based SSR via `@supabase/ssr`) |
| Payments | Stripe (Checkout + Connect + Webhooks) |
| AI | Google Gemini (`@google/generative-ai`) |
| Email | Resend |
| Icons | lucide-react |
| Validation | Zod |
| Testing | Playwright E2E |

---

## 3. Route Groups

### `(marketing)` — Public pages
Rendered with `Navbar` + `Footer`. No auth required.

| Route | Purpose |
|-------|---------|
| `/explore` | Primary discovery feed (default landing) |
| `/search` | Full-text search with autocomplete |
| `/listing/[id]` | Listing detail page |
| `/creators/[id]` | Public creator profile |
| `/categories` | Category browser |
| `/pricing` | Subscription plans |
| `/skills`, `/plugins`, `/mcp`, `/agents`, `/prompts`, `/workflows`, `/templates` | Type-filtered views |
| `/about`, `/faq`, `/contact`, `/docs`, `/blog` | Info pages |
| `/api-docs/*` | API documentation |
| `/verify-email` | Email verification |

### `(protected)` — Authenticated pages
Rendered with `AuthenticatedNavbar` via `AuthenticatedShell`. Auth enforced by middleware.

| Route | Purpose |
|-------|---------|
| `/dashboard` | User home |
| `/creator/*` | Creator studio (dashboard, listings, analytics, payouts, upload, followers, settings) |
| `/admin/*` | Admin panel (obfuscated — returns 404 without env prefix) |
| `/account/*` | User account (profile, settings, security, billing, api-keys) |
| `/developer` | Developer portal |
| `/bookmarks`, `/collections`, `/downloads`, `/purchases` | User content |
| `/feed`, `/messages`, `/notifications` | Social |
| `/profile`, `/settings`, `/support` | User pages |

### `(architect)` — AI Architect tool
Separate navbar. Own layout.

| Route | Purpose |
|-------|---------|
| `/architect` | AI project generator chat |
| `/architect/workshop` | Workflow expansion workshop |
| `/architect/history` | Legacy redirect → workshop |

---

## 4. Database Schema (60+ tables)

### Core Marketplace
`listings` → `listing_versions` → `listing_tags` → `tags` → `categories`  
`listing_faqs`, `listing_install_commands` — per-listing metadata  
`reviews` → `review_responses` — social proof with verified badges  
`downloads`, `bookmarks`, `follows` — engagement  
`collections` → `collection_items` — curated groups

### Users & Creators
`users` → `profiles` → `roles` — identity + RBAC  
`creators` → `creator_accounts` — creator ecosystem  

### Commerce
`transactions`, `stripe_customers`, `stripe_events` — payments  
`subscriptions` — tier management (FREE, PRO, ENTERPRISE, STARTER, BUSINESS)

### Communication
`notifications`, `messages` — user messaging  
`platform_announcements` — system announcements  
`activity_feed` — activity tracking

### Developer Platform
`api_keys`, `oauth_authorizations`, `oauth_tokens` — API access  
`webhooks`, `webhook_deliveries` — event delivery  
`mcp_servers`, `mcp_connections`, `mcp_tokens` — MCP ecosystem

### AI Workflows
`workflow_expansions` → `workflow_expansion_steps` — AI expansion pipeline  
Status enum: DRAFT, RUNNING, COMPLETED, FAILED, ARCHIVED, IMPORTED

### Trust & Safety
`content_flags`, `moderation_reports` — content moderation  
`audit_logs`, `error_logs` — system logging

### Analytics
`analytics`, `analytics_events`, `page_views` — tracking

### Key Enums
- `listing_type_enum`: SKILL, PLUGIN, MCP, AGENT, PROMPT, WORKFLOW, TEMPLATE, AUTOMATION, DEVELOPER_TOOL
- `listing_status_enum`: DRAFT, PENDING, ACTIVE, REJECTED, SUSPENDED
- `role_enum`: USER, CREATOR, ADMIN, MODERATOR, OWNER
- `install_platform_enum`: CURSOR, CLAUDE_CODE, CLAUDE_DESKTOP, WINDSURF, VSCODE, GITHUB_COPILOT, CLI, NPM, MANUAL, OTHER

---

## 5. Authentication Model

- **Provider:** Supabase Auth with `@supabase/ssr` cookie transport
- **Middleware:** `middleware.ts` protects all `(protected)` routes
- **Server helpers:** `lib/supabase/` — `createClient()` (server), `createBrowserClient()` (client), `createPublicClient()` (SSG/ISR)
- **Admin security:** `/admin` returns 404 unless `ADMIN_ROUTE_PREFIX` env var matches
- **RLS:** All tables have Row-Level Security; trigger functions have EXECUTE revoked from PUBLIC
- **RBAC:** USER → CREATOR → MODERATOR → ADMIN → OWNER (via `roles` table)

---

## 6. Design System

**Theme:** Dark luxury technology marketplace  
**Background:** `#09090B` | **Cards:** `#1C1917` | **CTA:** `#CA8A04` (gold)  
**Fonts:** Poppins (headings) + DM Sans (body)  
**Glass:** `backdrop-blur + border-white/10` on card surfaces  
**Canonical file:** `design.md`

### Component Library
- Base: `components/ui/` (shadcn/ui — Button, Dialog, Dropdown, Select, Tabs, Toast, Avatar, Label, Separator, Slot)
- Layout: `components/layout/` (Navbar, Footer, AuthenticatedNavbar, AuthenticatedShell, PremiumGradientBackground)
- Marketplace: `components/marketplace/` (MarketplaceCard, ListingGrid, TypeFilters, SearchAutocomplete)
- Feature-specific: `components/{architect,creator,admin,collections,messages,notifications,analytics,billing,developer}/`

---

## 7. API Architecture

All API routes under `app/api/`. See `memory/project-state.md` §4 for the complete route table.

### Patterns
- Auth: `createClient()` → `supabase.auth.getUser()` → 401 if unauthenticated
- Validation: Zod schemas in `lib/validation/`
- Error format: `{ error: string }` with appropriate HTTP status
- Streaming: Used in `/api/workflows/[id]/expand` for file generation progress
- Admin: Role check via `roles` table query

### Key External APIs
- **Stripe:** Checkout sessions, webhooks, Connect onboarding
- **Gemini:** Description generation, tag generation, repo scanning
- **GitHub:** OAuth + REST API for repo listing
- **Resend:** Transactional email

---

## 8. Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Marketplace browse/search/filter | ✅ Live | Explore + Search pages |
| Listing CRUD | ✅ Live | Manual + GitHub import + AI scan |
| Stripe payments | ✅ Test mode | Needs live keys for prod |
| Creator studio | ✅ Live | Dashboard, analytics, payouts, settings |
| Reviews + responses | ✅ Live | Verified badges |
| Collections + bookmarks | ✅ Live | Full CRUD |
| Admin panel | ✅ Live | Obfuscated route |
| Developer portal | ✅ Live | API keys, webhooks, MCP, OAuth |
| Architect AI generator | ✅ Live | Chat + file generation |
| Workshop expansion | ✅ Live | AI analysis + file gen |
| SEO | ✅ Live | Sitemap, robots, OG, structured data |
| Notifications + messaging | ✅ Live | Mark-read, action links |
| Activity feed | ✅ Live | Profile activity |
| E2E tests | ✅ 14+ passing | Playwright |
| Analytics integration | ⏳ Pending | PostHog/GA/Clarity not wired |
| Stripe live mode | ⏳ Pending | Keys not configured |
| Email production | ⏳ Pending | SMTP verification |

---

## 9. Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# AI
GEMINI_API_KEY=

# Email
RESEND_API_KEY=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Admin
ADMIN_ROUTE_PREFIX=        # Obfuscated admin route prefix

# App
NEXT_PUBLIC_APP_URL=
```

---

## 10. Testing

- **Framework:** Playwright (`playwright.config.ts`)
- **Tests:** `tests/` directory — 14+ E2E smoke tests
- **Run:** `npm run test:e2e` or `npm run test:e2e:ui`
- **Auth tests:** Env-gated (need real credentials)

---

## 11. File Reading Priority for New Agents

1. **`AGENTS.md`** — Who owns what, cycle plans
2. **`CLAUDE.md`** — Working style, quality standards
3. **`PROJECT_CONTEXT.md`** — This file (architecture overview)
4. **`memory/project-state.md`** — Current state + API route table
5. **`memory/checkpoints/`** — Latest milestone details
6. **`MIDASAI_BIBLE.md`** — Exhaustive 28K-word reference
7. **`design.md`** — UI/UX design system

---

## 12. Rules

- Never leave mock data or placeholder functionality
- Never break the build — verify with `npm run build`
- Use TypeScript, Tailwind, shadcn/ui
- Reuse existing components and patterns
- Extend rather than replace existing systems
- RLS on every new table
- Update `memory/project-state.md` after significant work
- Commit frequently with descriptive messages
- GitHub is the source of truth
