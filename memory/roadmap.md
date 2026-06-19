# MidasAI Roadmap

## Last Updated
2026-06-19 — Agent 0 (Project Manager)

---

## Phase 0: Unblock the Project (P0 — CURRENT)
**Goal**: Make the codebase buildable, runnable, and ready for feature work.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 0.1 | Resolve architecture contradiction (update CLAUDE.md to Supabase stack) | Agent 0 or next agent | NOT STARTED | CLAUDE.md says Prisma/NextAuth; code uses Supabase |
| 0.2 | Provision Supabase project + set env vars | Owner (James) | BLOCKED | Need NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY |
| 0.3 | Apply `supabase/schema.sql` to Supabase | Next agent | BLOCKED on 0.2 | Schema exists, just needs to be run |
| 0.4 | Run `npm install` and verify build (`next build`) | Next agent | NOT STARTED | Dependencies never installed |
| 0.5 | Create README.md with setup instructions | Next agent | NOT STARTED | |
| 0.6 | Fix design system: implement gold `#D4AF37` theme per context.md | Next agent | NOT STARTED | Currently blue; context.md says gold |

**Exit criteria**: `npm run build` succeeds, Supabase connected, README exists, CLAUDE.md accurate.

---

## Phase 1: Data Layer + Core API (P1)
**Goal**: Replace all mock data with real Supabase queries.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.1 | Generate TypeScript types from Supabase schema | — | NOT STARTED | Use `supabase gen types` |
| 1.2 | Create server actions for listings CRUD | — | NOT STARTED | |
| 1.3 | Create server actions for reviews CRUD | — | NOT STARTED | |
| 1.4 | Create server actions for bookmarks CRUD | — | NOT STARTED | |
| 1.5 | Create server actions for notifications | — | NOT STARTED | |
| 1.6 | Create server actions for categories | — | NOT STARTED | |
| 1.7 | Wire listing directory pages to real DB queries | — | NOT STARTED | skills, plugins, mcp, agents, prompts, workflows, templates |
| 1.8 | Wire listing detail page to real DB query | — | NOT STARTED | |
| 1.9 | Wire dashboards (user, creator, admin) to real data | — | NOT STARTED | |
| 1.10 | Wire search page to Supabase full-text search | — | NOT STARTED | |

**Exit criteria**: Every page that shows data pulls from Supabase. No hardcoded mock data remains.

---

## Phase 2: UI/UX Transformation (P1)
**Goal**: Premium dark luxury theme matching context.md vision.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 2.1 | Implement gold (#D4AF37) color system in globals.css | — | NOT STARTED | |
| 2.2 | Dark background (#050505) + card (#0D0D0D) + border (#1A1A1A) | — | NOT STARTED | |
| 2.3 | Glassmorphism effects on cards and modals | — | NOT STARTED | Utility classes exist, not applied |
| 2.4 | Hero section with gradient/animation | — | NOT STARTED | Currently static |
| 2.5 | Responsive polish (mobile-first) | — | NOT STARTED | Basic responsive exists |
| 2.6 | Loading states and skeleton UI | — | NOT STARTED | |
| 2.7 | Error boundaries | — | NOT STARTED | |

---

## Phase 3: Admin Security (P1)
**Goal**: Replace `/admin` with env-based hidden route.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 3.1 | Create env var `ADMIN_ROUTE_PREFIX` | — | NOT STARTED | context.md requires hidden admin route |
| 3.2 | Move admin pages under dynamic route | — | NOT STARTED | |
| 3.3 | Add role-based access control in middleware | — | NOT STARTED | Currently only checks auth, not role |

---

## Phase 4: Marketplace Features (P2)
**Goal**: Core marketplace functionality.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 4.1 | Reviews + ratings system | — | NOT STARTED | DB schema exists |
| 4.2 | Bookmarks system | — | NOT STARTED | DB schema exists |
| 4.3 | Tags system (DB model + UI) | — | NOT STARTED | Missing from schema |
| 4.4 | Downloads tracking | — | NOT STARTED | Column exists on listings |
| 4.5 | File upload for listings (Supabase Storage) | — | NOT STARTED | |
| 4.6 | Creator profiles + public profile pages | — | NOT STARTED | |
| 4.7 | Collections system | — | NOT STARTED | Missing from schema |

---

## Phase 5: Search (P2)
**Goal**: GitHub-quality search experience.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 5.1 | Supabase full-text search on listings | — | NOT STARTED | |
| 5.2 | Faceted filters (type, category, platform, price, rating) | — | NOT STARTED | |
| 5.3 | Sort by popularity, recency, rating, downloads | — | NOT STARTED | |
| 5.4 | Search suggestions / autocomplete | — | NOT STARTED | |

---

## Phase 6: SEO (P3)
**Goal**: Every listing indexable with full metadata.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 6.1 | Dynamic metadata per page (generateMetadata) | — | NOT STARTED | |
| 6.2 | OpenGraph + Twitter Card tags | — | NOT STARTED | |
| 6.3 | Schema.org structured data | — | NOT STARTED | |
| 6.4 | Dynamic sitemap.xml | — | NOT STARTED | |
| 6.5 | robots.txt | — | NOT STARTED | |

---

## Phase 7: Infrastructure (P3)
**Goal**: Production-ready ops.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 7.1 | CI/CD pipeline (GitHub Actions) | — | NOT STARTED | |
| 7.2 | Deployment (Vercel or similar) | — | NOT STARTED | |
| 7.3 | Testing framework (Vitest + Playwright) | — | NOT STARTED | |
| 7.4 | Performance monitoring | — | NOT STARTED | |
| 7.5 | Lighthouse 95+ | — | NOT STARTED | |

---

## Phase 8: Monetization (P3)
**Goal**: Revenue systems.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 8.1 | Stripe integration for payments | — | NOT STARTED | |
| 8.2 | Creator payouts | — | NOT STARTED | |
| 8.3 | Premium memberships | — | NOT STARTED | |
| 8.4 | Google AdSense integration | — | NOT STARTED | |
