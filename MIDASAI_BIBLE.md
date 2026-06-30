# MidasAI System Bible

> **Version:** 1.0.0 | **Last Updated:** 2026-06-29 | **Status:** Canonical single source of truth  
> **Classification:** Internal Engineering Reference

---

## Table of Contents

1. [Identity & Mission](#1-identity--mission)
2. [Platform Architecture](#2-platform-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Architecture](#4-database-architecture)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Routing & Navigation](#6-routing--navigation)
7. [API Architecture](#7-api-architecture)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Design System](#9-design-system)
10. [Marketplace Engine](#10-marketplace-engine)
11. [Payment & Commerce](#11-payment--commerce)
12. [Search & Discovery](#12-search--discovery)
13. [Creator Ecosystem](#13-creator-ecosystem)
14. [MCP & AI Systems](#14-mcp--ai-systems)
15. [Media & Storage](#15-media--storage)
16. [Notifications & Real-Time](#16-notifications--real-time)
17. [Analytics & Growth](#17-analytics--growth)
18. [Monetization](#18-monetization)
19. [Security Model](#19-security-model)
20. [Agent Organization](#20-agent-organization)
21. [Development Workflow](#21-development-workflow)
22. [Testing & Deployment](#22-testing--deployment)
23. [Environment Configuration](#23-environment-configuration)
24. [Rules & Constraints](#24-rules--constraints)

---

<a id="1-identity--mission"></a>
## 1. Identity & Mission

### 1.1 What MidasAI Is

MidasAI is the world's premier marketplace and discovery platform for AI development resources. It is a **production SaaS application** — not a demo, not a prototype, not a mockup. Every contribution must move the platform toward production readiness.

### 1.2 Product Categories

| Type Enum | Display Name | Description |
|-----------|-------------|-------------|
| `SKILL` | Claude Skills | Reusable skill files for Claude and Claude Code |
| `PLUGIN` | Plugins | IDE extensions and integrations |
| `MCP` | MCP Servers | Model Context Protocol server implementations |
| `AGENT` | AI Agents | Autonomous agent configurations and packages |
| `PROMPT` | Prompt Packs | Curated system prompts and prompt libraries |
| `WORKFLOW` | Workflows | Windsurf workflows and automation chains |
| `TEMPLATE` | Templates | Project templates and starter kits |
| `AUTOMATION` | Automations | Task automation scripts and pipelines |
| `DEVELOPER_TOOL` | Developer Tools | CLI tools, SDKs, and development utilities |

### 1.3 Supported Install Platforms

`CURSOR` · `CLAUDE_CODE` · `CLAUDE_DESKTOP` · `WINDSURF` · `VSCODE` · `GITHUB_COPILOT` · `CLI` · `NPM` · `MANUAL` · `OTHER`

### 1.4 Core Value Propositions

- **Discoverability:** AI-powered search, trending algorithms, personalized recommendations, curated collections
- **Trust:** Verified reviews, creator verification, quality scores, download counts
- **Commerce:** Free + paid listings, Stripe checkout, creator payouts via Stripe Connect
- **Developer Experience:** One-click install commands per platform, version tracking, changelogs
- **Creator Economy:** Studio dashboard, analytics, revenue tracking, follower system

### 1.5 Design Philosophy

Every decision optimizes for: User experience → Discoverability → Performance → Scalability → Security → Maintainability → Revenue → Long-term growth.

---

<a id="2-platform-architecture"></a>
## 2. Platform Architecture

### 2.1 High-Level Stack

```
CLIENT:     Next.js 15 App Router (React 18 RSC) + Tailwind + shadcn/ui
MIDDLEWARE: Supabase SSR Auth · Rate Limiting · CSRF · Security Headers · Subdomain Routing
API:        40+ Next.js Route Handlers · Public REST API (v1/) · Stripe Webhooks · GitHub OAuth
BACKEND:    Supabase PostgreSQL (60+ tables, RLS) · Supabase Auth · Supabase Storage · Edge Functions
EXTERNAL:   Stripe · GitHub API · Google Gemini · PostHog · Resend Email
```

### 2.2 Application Structure

```
app/
├── (marketing)/        # Public: homepage, explore, search, listing/[id], creators, pricing, docs
├── (protected)/        # Auth-required: dashboard, admin, creator studio, developer portal,
│                       #   bookmarks, collections, messages, notifications, account, purchases
├── api/                # 40+ endpoint groups (v1/, stripe/, github/, listings/, admin/, etc.)
│
components/             # admin(10), marketplace(27), creator(17), layout(10), ui(17), notifications(6)
lib/                    # supabase/, auth/, api/, billing/, stripe/, github/, ai/, search/, security/,
│                       #   storage/, mcp/, email/, routing.ts, roles.ts, rate-limit.ts, seo.ts, trust.ts
supabase/
├── migrations/         # 23 versioned SQL migrations
├── functions/          # Edge Functions (ai-notifications, api-keys, applications, etc.)
types/database.ts       # Auto-generated Supabase types (3445 lines)
tests/e2e/              # Playwright smoke + authenticated specs
```

---

<a id="3-technology-stack"></a>
## 3. Technology Stack

### 3.1 Core

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.3.9 |
| Language | TypeScript | ^5.5.4 |
| Runtime | Node.js | >=20.0.0 |
| UI | React | ^18.3.1 |
| Styling | Tailwind CSS | ^3.4.9 |
| Components | shadcn/ui (Radix primitives) | Latest |
| Icons | lucide-react | ^0.424.0 |
| Validation | Zod | ^3.25.76 |

### 3.2 Backend

| Service | Technology |
|---------|-----------|
| Database | Supabase PostgreSQL (project: `rqermggomchlipmuigan`) |
| Auth | Supabase Auth + `@supabase/ssr` ^0.4.0 |
| Storage | Supabase Storage (avatars, listing-assets, listing-media) |
| Edge Functions | Supabase Edge Functions (Deno) |
| Payments | Stripe ^22.2.3 (Checkout + Connect + Webhooks) |
| AI | @google/generative-ai ^0.21.0 (Gemini) |
| Email | Resend ^6.14.0 |
| Markdown | react-markdown ^10.1.0 + remark-gfm ^4.0.1 |

### 3.3 Dev & Testing

Playwright ^1.61.1 · ESLint · GitHub Actions CI · PostCSS + Autoprefixer

---

<a id="4-database-architecture"></a>
## 4. Database Architecture

### 4.1 Overview

60+ tables with RLS enabled. Schema managed via versioned SQL migrations in `supabase/migrations/`. Types auto-generated to `types/database.ts`.

### 4.2 Core Tables

**Marketplace:** `listings` · `categories` · `tags` · `listing_tags` · `listing_versions` · `listing_faqs` · `listing_install_commands` · `assets`

**Users & Creators:** `profiles` · `creators` · `creator_accounts` · `follows` · `bookmarks` · `downloads` · `collections` · `collection_items`

**Commerce:** `transactions` · `subscriptions` · `feature_entitlements` · `billing_events` · `payouts` · `affiliate_payouts`

**Reviews & Trust:** `reviews` · `review_responses` · `content_flags` · `moderation_reports`

**Developer Platform:** `api_keys` · `api_logs` · `api_usage` · `applications` · `oauth_authorizations` · `oauth_tokens` · `webhooks` · `webhook_deliveries`

**MCP System:** `mcp_servers` · `mcp_connections` · `mcp_tokens` · `mcp_usage`

**Communication:** `notifications` · `messages` · `comments` · `email_logs` · `email_verifications`

**Analytics:** `analytics` · `analytics_events` · `page_views` · `activity_feed` · `audit_logs`

**Platform:** `platform_announcements` · `platform_announcement_reads` · `rate_limit_alerts` · `error_logs` · `csrf_tokens` · `password_resets` · `github_connections` · `watchlist`

### 4.3 Key Listing Fields

```
id, title, description, short_description (≤250 chars), seo_title, type, status, price,
creator_id, category_id, github_url, downloads, views, average_rating, review_count,
quality_score, featured, search_vector (tsvector), created_at, updated_at
```

### 4.4 Enums

```
listing_status_enum:       DRAFT | PENDING | ACTIVE | REJECTED | SUSPENDED
listing_type_enum:         SKILL | PLUGIN | MCP | AGENT | PROMPT | WORKFLOW | TEMPLATE | AUTOMATION | DEVELOPER_TOOL
transaction_status_enum:   PENDING | COMPLETED | FAILED | REFUNDED
transaction_type_enum:     PURCHASE | PAYOUT | REFUND | COMMISSION
subscription_tier_enum:    FREE | STARTER | PRO | BUSINESS | ENTERPRISE
role_enum:                 USER | CREATOR | ADMIN | MODERATOR | OWNER
notification_type_enum:    REVIEW | BOOKMARK | DOWNLOAD | PURCHASE | SYSTEM | MODERATION | BILLING | PROMOTIONS | MARKETPLACE | MESSAGES | LEADS | JOBS | AI_ASSISTANT | ANNOUNCEMENTS
install_platform_enum:     CURSOR | CLAUDE_CODE | CLAUDE_DESKTOP | WINDSURF | VSCODE | GITHUB_COPILOT | CLI | NPM | MANUAL | OTHER
webhook_event_enum:        LISTING_CREATED | LISTING_UPDATED | LISTING_DELETED | PURCHASE_COMPLETED | PURCHASE_REFUNDED | REVIEW_CREATED | CREATOR_FOLLOWED | SUBSCRIPTION_UPDATED | MCP_* | WORKFLOW_* | AGENT_*
```

### 4.5 RPCs

| Function | Purpose |
|----------|---------|
| `get_trending_listings` | Views + downloads weighted by recency |
| `get_fastest_growing_listings` | Growth velocity ranking |
| `get_recently_updated_listings` | Recently modified active listings |
| `get_popular_by_category` | Per-category popularity |
| `get_recently_viewed_listings` | User's recently viewed |
| `get_recommendations_because_you_downloaded` | Collaborative filtering |
| `mark_all_notifications_read` | Batch notification update |

### 4.6 DDL Policy

1. Supabase MCP `apply_migration` → 2. `npx supabase db query --linked` → 3. PAT in `.cursor/mcp.json`

---

<a id="5-authentication--authorization"></a>
## 5. Authentication & Authorization

### 5.1 Auth Flow

Supabase Auth (email/password). Session via HTTP-only cookies (`@supabase/ssr`). Middleware refreshes session on every request via `updateSession()`.

### 5.2 Supabase Clients

| Client | File | Usage |
|--------|------|-------|
| Server (auth) | `lib/supabase/server.ts` | Server Components, Route Handlers |
| Client (browser) | `lib/supabase/client.ts` | Client Components |
| Middleware | `lib/supabase/middleware.ts` | Session refresh |
| Public | `lib/supabase/public.ts` | SEO/static pages (no cookie) |
| Service Role | Via env key | Admin ops, bypasses RLS |

### 5.3 RBAC

`USER` → `CREATOR` → `MODERATOR` → `ADMIN` → `OWNER`. Role checks in `lib/roles.ts`.

### 5.4 Admin Security

- Admin panel uses route obfuscation (`NEXT_PUBLIC_ADMIN_ROUTE_PREFIX`)
- `/admin` returns **404** (no redirect leak)
- Additional `ADMIN_SECRET_ROUTE` gate via query param or `x-admin-secret` header

### 5.5 GitHub OAuth

API routes: `/api/github/auth` → `/api/github/callback` → `/api/github/repos` → `/api/github/scan`

### 5.6 API Key Auth

Developer keys in `api_keys` table with hashed storage, prefix-based lookup, per-key rate limits, domain/IP restrictions.

---

<a id="6-routing--navigation"></a>
## 6. Routing & Navigation

### 6.1 Route Groups

| Group | Chrome | Purpose |
|-------|--------|---------|
| `(marketing)` | `Navbar` + `Footer` | Public/guest pages |
| `(protected)` | `AuthenticatedNavbar` via `AuthenticatedShell` | App pages |

**CRITICAL:** Never render both navbars on the same route. `isAuthenticatedAppRoute()` in `lib/routing.ts` determines which.

### 6.2 Protected Route Prefixes

`/dashboard` · `/admin` · `/bookmarks` · `/notifications` · `/profile` · `/settings` · `/explore` · `/marketplace` · `/downloads` · `/collections` · `/messages` · `/account` · `/purchases` · `/developer` · `/developers` · `/architect`

Creator studio segments: `dashboard` · `listings` · `analytics` · `payouts` · `upload` · `revenue` · `reviews` · `followers`

### 6.3 Redirects

`/` → `/explore` (authenticated) · `/skills` → `/explore?type=SKILL` · `/marketplace` → `/explore` · `/details/[id]` → `/listing/[id]`

### 6.4 Middleware Pipeline

1. Subdomain detection → 2. Subdomain rewrite → 3. Rate limiting (API/auth) → 4. Public API passthrough (`/v1/`) → 5. Session refresh → 6. CSRF on mutations → 7. Admin obfuscation → 8. Legacy redirects → 9. Auth root redirect

---

<a id="7-api-architecture"></a>
## 7. API Architecture

### 7.1 Public REST API (`/api/v1/`)

`listings` · `listings/[id]` · `categories` · `search` · `trending` · `creators/[id]` · `health` · `mcp`

### 7.2 Internal APIs (40+ groups)

**Listings:** CRUD, purchase, download, reviews, tags, versions  
**Stripe:** checkout, webhook, subscribe, connect, payouts, refund, portal, prices  
**GitHub:** auth, callback, repos, scan, status  
**Admin:** users, listings, moderation, stats, transactions, refund, settings, announcements, import, roles  
**Social:** follows, bookmarks, collections, messages, comments  
**Developer:** keys, oauth (authorize/token/revoke), webhooks  
**Analytics:** events  
**Search:** suggestions, autocomplete  
**Other:** account, billing, moderation, health, mcp (5 endpoints)

### 7.3 Security Layers

- **Rate limiting:** `lib/rate-limit.ts` + `lib/rate-limit-middleware.ts` (auth vs general)
- **CSRF:** Token-based via `lib/csrf.ts`, `X-CSRF-Protection` header on mutations
- **Security headers:** `lib/security/headers.ts` (X-Frame-Options, CSP, etc.)
- **Input validation:** Zod schemas in `lib/validation/`

---

<a id="8-frontend-architecture"></a>
## 8. Frontend Architecture

### 8.1 RSC Model

Server Components for data fetching and SEO. Client Components (`"use client"`) for interactivity. **Critical:** Functions/components cannot cross the RSC→client boundary — use string identifiers + client-side maps.

### 8.2 Key Component Groups

- **`components/marketplace/` (27 files):** `MarketplaceCard`, `MarketplaceListingGrid`, `MarketplaceTypeFilters`, `SearchAutocomplete`, `CreateSkillWizard`
- **`components/layout/` (10 files):** `Navbar`, `AuthenticatedNavbar`, `AuthenticatedShell`, `Footer`
- **`components/creator/` (17 files):** `ListingSubnav`, `CreatorDashboard`, studio UIs
- **`components/ui/` (17 files):** shadcn primitives (Button, Dialog, Input, etc.)

### 8.3 Data Fetching Patterns

- Server Component: direct Supabase queries (SEO-critical)
- Route Handlers: mutations, complex logic
- Client fetch: real-time updates, user actions
- Public client: `createPublicClient()` for static/SEO pages
- Error wrapping: all fetches in try/catch with graceful fallbacks

### 8.4 Error Handling

`app/error.tsx` + `app/global-error.tsx` (boundaries) · `loading.tsx` (skeletons) · Empty states in every list/grid

---

<a id="9-design-system"></a>
## 9. Design System

**Canonical reference:** `design.md`

### 9.1 Brand

**Dark luxury technology marketplace.** Inspiration: Linear, Stripe, Vercel, OpenAI. Not generic SaaS. Not light-mode-first.

### 9.2 Colors

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#09090B` | Page canvas |
| Foreground | `#FAFAF9` | Primary text |
| Card | `#1C1917` | Elevated surfaces |
| **CTA** | `#CA8A04` (gold) | Primary actions, highlights |
| CTA Light | `#EAB308` | Hover/gradient |
| Destructive | `#EF4444` | Errors |
| Border | `rgba(255,255,255,0.1)` | Dividers |
| Glass | `rgba(28,25,23,0.6)` | Glassmorphism |
| Text: Primary/Secondary/Tertiary | `#FAFAF9` / `#A1A1AA` / `#71717A` | — |

### 9.3 Typography

DM Sans for headings and body. Scale: Hero `5xl–6xl`, title `3xl–4xl`, section `2xl`, body `sm–base`, meta `xs`.

### 9.4 Components

- **Glass card:** `glass` class, `hover:shadow-glow transition-smooth`
- **Primary button:** Gold gradient `from-cta to-cta-light`, `shadow-glow`
- **Code blocks:** `#0a0a0f` bg, monospace, `text-green-400`
- **Focus:** `focus-visible:ring-2 focus-visible:ring-cta`

### 9.5 Motion

`animate-fade-in-up` (500ms) · `animate-scale-in` (300ms) · `animate-float` (3s infinite) · `animate-pulse-glow` · `animate-shimmer` · `PremiumGradientBackground` · `ambient-glow` + `noise-overlay`

### 9.6 Rules

**Do:** Reuse shadcn primitives · marketplace-first nav · real Supabase data · empty states over mock  
**Don't:** Double navbar · light-mode colors on dark pages · hardcode install commands in JSX

---

<a id="10-marketplace-engine"></a>
## 10. Marketplace Engine

### 10.1 Listing Lifecycle

`DRAFT → PENDING → ACTIVE → [SUSPENDED | REJECTED]`

### 10.2 Quality Score

Computed from: downloads (weighted) + views + average rating + review count + update recency + completeness (description, install commands, FAQs, media). Used for search ranking and discovery feeds.

### 10.3 Upload Flows

1. **GitHub Import:** Connect GitHub → select repo → Gemini AI scans → auto-generates metadata, tags, install commands
2. **Manual:** `CreateSkillWizard` → multi-step form → metadata, pricing, tags → publish
3. **Post-upload:** Tags → `listing_tags`, commands → `listing_install_commands`, thumbnail → Storage

---

<a id="11-payment--commerce"></a>
## 11. Payment & Commerce

### 11.1 Stripe Endpoints

`/api/stripe/checkout` · `webhook` · `subscribe` · `portal` · `connect` · `payouts` · `refund` · `prices`

### 11.2 Purchase Flow

Paid: User → Stripe Checkout → webhook → `transactions` (COMPLETED) → download access → creator notification  
Free: User → immediate transaction (amount=0) → download access

### 11.3 Subscription Tiers

`FREE` (ads, limited) → `STARTER` → `PRO` (ad-free, unlimited, advanced analytics) → `BUSINESS` → `ENTERPRISE`

Feature entitlements in `feature_entitlements` table, checked via `lib/subscription-guard.ts`.

### 11.4 Commission

Platform fee: `PLATFORM_FEE_PERCENT` (default 15%). Creator receives remainder via Stripe Connect.

---

<a id="12-search--discovery"></a>
## 12. Search & Discovery

### 12.1 Search

PostgreSQL `tsvector` on `listings.search_vector`. Autocomplete via `/api/search/suggestions`. Filters: type, category, price, rating, platform. Sort: relevance, newest, most downloaded, highest rated, trending.

### 12.2 Discovery Feeds (`/explore`)

Recommended · Trending · New · Fastest Growing · Featured Collections · Recently Updated · Because You Downloaded · Popular by Category · Recently Viewed

### 12.3 SEO

`app/sitemap.ts` (auto-generated) · `app/robots.ts` (public indexing, blocks admin/auth) · `generateMetadata()` with `seo_title`, `short_description` · OpenGraph tags · JSON-LD structured data

---

<a id="13-creator-ecosystem"></a>
## 13. Creator Ecosystem

### 13.1 Creator Studio Routes

`/creator/dashboard` · `listings` · `listings/[id]/reviews` · `listings/[id]/faq` · `listings/[id]/install` · `analytics` · `payouts` · `revenue` · `upload` · `reviews` · `followers`

### 13.2 Creator Profiles

`creators` table: display_name, slug, bio, avatar, banner, social links (GitHub, Twitter, website, LinkedIn, YouTube, Discord), verified status. Public at `/creator/[slug]`.

### 13.3 Paywall

**Removed.** Any authenticated user can publish. Premium plans for advanced features only.

### 13.4 Followers

`follows` table (follower_id → followed_id). Creators receive notifications on new follows. Follower counts displayed on profiles.

---

<a id="14-mcp--ai-systems"></a>
## 14. MCP & AI Systems

### 14.1 MCP Registry

`mcp_servers` · `mcp_connections` · `mcp_tokens` · `mcp_usage`. APIs: `/api/mcp/servers` · `connect` · `disconnect` · `tokens` · `usage`

### 14.2 AI Features

| Feature | Provider | File |
|---------|----------|------|
| Repo scanning | Google Gemini | `lib/github/scan.ts` |
| SEO generation | Google Gemini | Auto seo_title + short_description |
| Content analysis | Google Gemini | Quality assessment, tag suggestion |
| AI review | Custom | `/api/ai-review` |

### 14.3 Webhooks

Events: `LISTING_CREATED/UPDATED/DELETED` · `PURCHASE_COMPLETED/REFUNDED` · `REVIEW_CREATED` · `CREATOR_FOLLOWED` · `SUBSCRIPTION_UPDATED` · `MCP_*/WORKFLOW_*/AGENT_*`

---

<a id="15-media--storage"></a>
## 15. Media & Storage

Supabase Storage buckets: `avatars` · `listing-assets` · `listing-media` · `documentation`. All public read, owner/creator write (RLS). Asset metadata in `assets` table (THUMBNAIL, GALLERY, BANNER, DOCUMENTATION, AVATAR).

---

<a id="16-notifications--real-time"></a>
## 16. Notifications & Real-Time

### 16.1 Notification Types

`REVIEW` · `BOOKMARK` · `DOWNLOAD` · `PURCHASE` · `SYSTEM` · `MODERATION` · `BILLING` · `PROMOTIONS` · `MARKETPLACE` · `MESSAGES` · `LEADS` · `JOBS` · `AI_ASSISTANT` · `ANNOUNCEMENTS`

Each notification has: `title`, `message`, `action_url`, `action_label`, `read` flag. Bulk mark-read via `mark_all_notifications_read` RPC.

### 16.2 Platform Announcements

`platform_announcements` (kind: CHANGELOG | BANNER) + `platform_announcement_reads` tracking. Components: `ChangelogPopup`, `ChangelogGate`.

---

<a id="17-analytics--growth"></a>
## 17. Analytics & Growth

**PostHog** (product analytics) · **Google Analytics** (traffic) · **Microsoft Clarity** (session replay). Internal: `analytics` + `analytics_events` + `page_views` + `activity_feed` tables. Events tracked: views, downloads, purchases, searches.

---

<a id="18-monetization"></a>
## 18. Monetization

**Revenue streams:** Paid listings · Subscriptions · Platform commission · Google AdSense (FREE tier only) · Featured listings · Sponsored listings (planned).

AdSense: `components/ads/AdPlacement.tsx` · `GoogleAdSlot.tsx` · `AdSenseScript.tsx`. PRO/ENTERPRISE = ad-free. Revenue must never harm UX.

---

<a id="19-security-model"></a>
## 19. Security Model

### 19.1 RLS

All tables have RLS. Users read/write own data only. Public data readable by all. Admin operations require `role = 'ADMIN'`. Service role bypasses RLS.

### 19.2 Security Headers

`X-Frame-Options: DENY` · `X-Content-Type-Options: nosniff` · `X-XSS-Protection` · `Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy`

### 19.3 Function Security

All trigger functions have `PUBLIC EXECUTE` revoked. `SECURITY DEFINER` RPCs set explicit `search_path`. Migration `20260623` enforces compliance.

### 19.4 Secrets

Server-only: `SUPABASE_SERVICE_ROLE_KEY` · `STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` · `ADMIN_SECRET_ROUTE` · `HEALTH_CHECK_SECRET` · `ADMIN_SECRET_KEY` · `GITHUB_CLIENT_SECRET`

Client-safe: All `NEXT_PUBLIC_*` prefixed variables only.

### 19.5 Post-DDL Audit

After every schema change: run `get_advisors` (security) → verify RLS → check no `PUBLIC EXECUTE` on triggers → review `security_invoker`.

---

<a id="20-agent-organization"></a>
## 20. Agent Organization

### 20.1 Agent Registry

| ID | Role | Ownership |
|----|------|-----------|
| 0 | Orchestrator | Cycle plans, conflict resolution, build validation |
| 1 | Frontend/UI/UX | Homepage, marketplace UI, navigation, design system |
| 2 | Database & Backend | Supabase, schema, migrations, auth, RLS, APIs |
| 3 | Search & SEO | Indexing, ranking, filters, metadata, sitemap |
| 4 | MCP & AI | MCP metadata, agent metadata, AI integrations |
| 5 | Edge Functions | Background jobs, automation, scheduled tasks |
| 6 | User & Creator | Profiles, settings, notifications, collections, creator dashboard |
| 7 | QA & Hardening | Testing, performance, accessibility, build validation |
| 8 | Data Framework | Import, normalization, ingestion, deduplication |
| 9 | Monetization | Stripe, AdSense, featured listings, subscriptions |
| 10 | Analytics & Growth | PostHog, event tracking, trending algorithms |
| 11 | Media System | Images, storage, CDN, optimization |
| 12 | Security | RLS audits, permissions, API security, secrets |
| 13 | Documentation | Setup guides, API docs, architecture docs |

### 20.2 Cycle Model

2-week sprints. Each cycle: checkpoint → test report → review → next plans. Cycles 12–15 complete. Cycle 16 in progress.

### 20.3 Collaboration Rules

- Never overwrite another agent's work
- Review ownership before changing shared systems
- Coordinate via `memory/project-state.md`
- Prefer extending over rebuilding

---

<a id="21-development-workflow"></a>
## 21. Development Workflow

### 21.1 Startup Sequence

1. `git pull` → 2. Read `CLAUDE.md` → 3. Read `AGENTS.md` → 4. Read `AGENT_HANDOFF.md` → 5. Read `memory/project-state.md` → 6. Read latest checkpoint → 7. Review recent commits → 8. Review TODOs

### 21.2 Git Protocol

```bash
git pull                              # Before coding
git add . && git commit -m "[AGENT-X] Description" && git push origin <branch>  # After work
```

Push frequently. Keep commits focused. Build must pass. GitHub is source of truth.

### 21.3 Feature Order

1. Database models (migrations) → 2. APIs → 3. UI → 4. Validation (Zod) → 5. Authorization (RLS, roles) → 6. Error handling

### 21.4 Definition of Done

Functionality works · Mock data removed · Real data connected · Errors handled · Loading states · Empty states · Types pass · Build passes · Docs updated · Memory updated · Committed & pushed. **A page existing is NOT completion. Working functionality is completion.**

---

<a id="22-testing--deployment"></a>
## 22. Testing & Deployment

### 22.1 E2E Tests

```bash
npm run test:e2e          # Playwright: 19+ public smoke tests
npm run test:e2e:ui       # Interactive mode
```

`tests/e2e/smoke.spec.ts` (public) + `authenticated.spec.ts` (env-gated).

### 22.2 CI

GitHub Actions: install → build → E2E smoke → report.

### 22.3 Health Endpoint

`/api/health` — public: `{ status, timestamp }` only. With `HEALTH_CHECK_SECRET`: full Supabase + Stripe diagnostics.

### 22.4 Deployment

Target: **Vercel**. `next.config.mjs`: `typescript.ignoreBuildErrors: true` (supabase/ssr type issue), `eslint.ignoreDuringBuilds: true`.

### 22.5 Build Validation

Every cycle: `npm run build` (zero errors) → `npm run test:e2e` (all pass) → `curl /api/health` (200).

---

<a id="23-environment-configuration"></a>
## 23. Environment Configuration

### 23.1 Required

```
NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL · NEXT_PUBLIC_SITE_URL · NEXT_PUBLIC_API_URL
NEXT_PUBLIC_ADMIN_ROUTE_PREFIX · ADMIN_ROUTE_PREFIX · HEALTH_CHECK_SECRET · ADMIN_SECRET_KEY
```

### 23.2 Payments

```
STRIPE_SECRET_KEY · STRIPE_WEBHOOK_SECRET · NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_STARTER_MONTHLY_PRICE_ID · STRIPE_PRO_MONTHLY_PRICE_ID · STRIPE_BUSINESS_MONTHLY_PRICE_ID
STRIPE_STARTER_YEARLY_PRICE_ID · STRIPE_PRO_YEARLY_PRICE_ID · STRIPE_BUSINESS_YEARLY_PRICE_ID
PLATFORM_FEE_PERCENT=15
```

### 23.3 Integrations

```
GITHUB_CLIENT_ID · GITHUB_CLIENT_SECRET · GITHUB_TOKEN
OPENROUTER_API_KEY · CF_ACCOUNT_ID · CF_AI_TOKEN
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID · NEXT_PUBLIC_ADSENSE_SLOT_*
SKILLSMP_API_KEY
E2E_TEST_EMAIL · E2E_TEST_PASSWORD · E2E_FREE_LISTING_ID
```

### 23.4 Pre-Launch Supabase

1. Enable leaked password protection
2. Run `get_advisors` (security) — confirm clean
3. Set Stripe webhook URL: `https://domain.com/api/stripe/webhook`

---

<a id="24-rules--constraints"></a>
## 24. Rules & Constraints

### 24.1 Global Rules (All Agents)

- Avoid duplicate implementations, components, and database structures
- Reuse existing systems; prefer extension over replacement
- Use TypeScript; follow existing architecture
- Keep code production-ready at all times

### 24.2 Never

- Leave mock data or placeholder functionality
- Leave broken pages
- Introduce fake APIs or integrations
- Render two navbars on the same route
- Use light-mode colors on dark pages
- Hardcode install commands in JSX
- Expose server-only secrets to client
- Grant `PUBLIC EXECUTE` on trigger functions

### 24.3 Quality Standards

- TypeScript strict
- Next.js App Router best practices
- Mobile responsive
- Accessible (focus rings, aria-labels, semantic HTML)
- Production-oriented (error boundaries, loading states, empty states)

### 24.4 Production Readiness Score

| Layer | Score |
|-------|-------|
| Application code | 100/100 |
| Database + RLS | 100/100 |
| Tests (public smoke) | 100/100 |
| External secrets | User action |

**Overall when secrets configured: 100/100**

---

## Key Documents Reference

| Document | Purpose |
|----------|---------|
| `MIDASAI_BIBLE.md` | This file — complete system reference |
| `AGENTS.md` | Agent ownership, cycles, collaboration rules |
| `CLAUDE.md` | Working style and quality standards |
| `AGENT_HANDOFF.md` | Agent continuation protocol |
| `design.md` | UI/UX canonical design system |
| `memory/project-state.md` | Current project state |
| `memory/checkpoints/` | Milestone checkpoints |
| `PRODUCTION_CHECKLIST.md` | Launch readiness checklist |
| `.env.example` | Environment variable template |
| `types/database.ts` | Auto-generated database types |

---

*This is the MidasAI Bible. It is the single source of truth. All agents, contributors, and systems operating on MidasAI must reference this document. Keep it synchronized with implementation.*
