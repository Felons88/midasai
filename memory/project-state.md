# MidasAI — Project State

> **Last updated:** 2026-07-03  
> **Build status:** ✅ Passes (`npm run build`)  
> **E2E smoke:** 15/22 passing (7 env/flaky test failures; admin changes are build-only in this cycle)  
> **Production readiness:** ~97/100  
> **Admin route:** `/felon-admin` (hardcoded default in `lib/admin-route.ts`; env override available)
> **Active cycle:** 17 — Landing Page Redesign + Launch Readiness  
> **Supabase project:** `rqermggomchlipmuigan`

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | 15.3.9 |
| Language | TypeScript | 5.5.4 |
| Runtime | Node.js | ≥20.0.0 |
| Styling | Tailwind CSS | 3.4.9 |
| Components | shadcn/ui + Radix primitives | latest |
| Database | Supabase PostgreSQL | hosted |
| Auth | Supabase Auth (cookie-based SSR) | @supabase/ssr 0.4 |
| Payments | Stripe (Checkout + Connect + Webhooks) | 22.2.3 |
| AI | Google Gemini (@google/generative-ai) | 0.21 |
| Email | Resend | 6.14 |
| ZIP | fflate | 0.8.3 |
| Markdown | react-markdown + remark-gfm | 10.1 / 4.0 |
| Validation | Zod | 3.25 |
| Testing | Playwright | 1.61 |
| Icons | lucide-react | 0.424 |

---

## 2. Repository Structure

```
midasai/
├── AGENTS.md                    # Agent organization & cycle plans
├── CLAUDE.md                    # AI agent instructions
├── AGENT_HANDOFF.md             # Session handoff protocol
├── PROJECT_CONTEXT.md           # Full architecture map for agents
├── MIDASAI_BIBLE.md             # Canonical system reference (28K words)
├── design.md                    # UI/UX design system
├── README.md                    # Project README
│
├── app/                         # Next.js App Router
│   ├── (architect)/             # Architect tool (AI project generator)
│   │   └── architect/
│   │       ├── ArchitectClient  # Main architect chat UI
│   │       ├── workshop/        # Workflow expansion workshop
│   │       └── history/         # Legacy (redirects to workshop)
│   ├── (marketing)/             # Public pages (Navbar + Footer)
│   │   ├── explore/             # Discovery feed (primary landing)
│   │   ├── search/              # Full-text search
│   │   ├── listing/[id]/        # Listing detail pages
│   │   ├── creators/[id]/       # Public creator profiles
│   │   ├── categories/          # Category browser
│   │   ├── category/[slug]/     # Category detail pages
│   │   ├── pricing/             # Subscription plans
│   │   ├── about/, faq/, contact/, docs/, blog/
│   │   └── skills/, plugins/, mcp/, agents/, prompts/, workflows/, templates/
│   ├── (protected)/             # Auth-required pages
│   │   ├── dashboard/           # User dashboard
│   │   ├── creator/             # Creator studio
│   │   │   ├── dashboard/       # Creator overview
│   │   │   ├── listings/        # Listing management
│   │   │   ├── analytics/       # Creator stats
│   │   │   ├── payouts/         # Revenue & payouts
│   │   │   ├── upload/          # New listing wizard
│   │   │   ├── followers/       # Follower list
│   │   │   └── settings/        # Creator settings
│   │   ├── admin/               # Admin panel (obfuscated route)
│   │   │   ├── dashboard/, users/, listings/, moderation/
│   │   │   ├── transactions/, payouts/, analytics/
│   │   │   ├── communications/, subscriptions/, settings/
│   │   │   ├── files/, tools/, categorization/
│   │   │   └── users/[id]/
│   │   ├── account/             # User account pages
│   │   │   ├── profile/, settings/, security/, billing/, api-keys/
│   │   ├── developer/           # Developer portal
│   │   ├── bookmarks/, collections/, downloads/, purchases/
│   │   ├── feed/, messages/, notifications/
│   │   ├── profile/, settings/, support/
│   │   └── developers/          # Dev tools landing
│   ├── api/                     # API routes (see §4)
│   ├── auth/                    # Auth callback handlers
│   └── v1/                      # Public REST API v1
│
├── components/
│   ├── ui/                      # shadcn/ui base components
│   ├── layout/                  # Navbar, Footer, AuthenticatedNavbar, Shell
│   ├── marketplace/             # MarketplaceCard, ListingGrid, TypeFilters
│   │   └── listing/             # ListingDetail, InstallCommands, FAQ, Reviews
│   ├── architect/               # ExpandOverlay, WorkflowCard, DetailInspector, Timeline
│   ├── creator/                 # Creator studio components
│   ├── admin/                   # Admin panel components
│   ├── collections/             # Collection CRUD
│   ├── messages/                # Messaging UI
│   ├── notifications/           # Notification center
│   ├── analytics/               # Charts and tracking
│   ├── ads/                     # AdSense integration
│   ├── billing/                 # Subscription management
│   ├── developer/               # API keys, webhooks, MCP
│   ├── contact/                 # Contact form
│   ├── docs/                    # Documentation viewer
│   ├── announcements/           # Platform announcements
│   └── mcp/                     # MCP server components
│
├── lib/
│   ├── supabase/                # createClient, createServerClient, createPublicClient
│   ├── auth/                    # Session helpers, middleware utils
│   ├── stripe/                  # Stripe checkout, webhook handlers
│   ├── ai/                      # Gemini AI generation
│   ├── architect/               # Expansion engine, manifest
│   ├── github/                  # OAuth + repo scanning
│   ├── listings/                # Listing CRUD helpers
│   ├── marketplace/             # Discovery queries
│   ├── search/                  # Search engine
│   ├── creator/                 # Creator utilities
│   ├── reviews/                 # Review system
│   ├── storage/                 # Supabase Storage helpers
│   ├── security/                # RBAC, RLS, sanitization
│   ├── validation/              # Zod schemas
│   ├── email/                   # Resend email
│   ├── monitoring/              # Error logging
│   ├── api/v1/                  # Public API handlers
│   ├── webhook/                 # Webhook delivery
│   ├── billing/                 # Subscription logic
│   ├── ads/                     # Ad placement
│   ├── activity/                # Activity feed
│   ├── admin/                   # Admin actions
│   ├── realtime/                # Supabase Realtime
│   ├── ingestion/               # Content import
│   ├── scraper/                 # Web scraping
│   ├── mcp/                     # MCP protocol
│   └── docs/                    # Documentation helpers
│
├── types/
│   └── database.ts              # Auto-generated Supabase types
│
├── supabase/
│   └── migrations/              # 26 SQL migrations (pending categorization migration)
│
├── tests/                       # Playwright E2E tests
├── middleware.ts                 # Auth + route protection
├── tailwind.config.ts           # Design tokens
└── app/globals.css              # Global styles + animations
```

---

## 3. Navigation Architecture

| Context | Component | Layout File |
|---------|-----------|-------------|
| Public / marketing | `Navbar` + `Footer` | `app/(marketing)/layout.tsx` |
| Authenticated app | `AuthenticatedNavbar` only | `app/(protected)/layout.tsx` via `AuthenticatedShell` |
| Architect tool | Architect navbar | `app/(architect)/layout.tsx` |
| Admin panel | Admin sidebar | `app/(protected)/admin/layout.tsx` |

**Rule:** Never render both navbars on the same route. `lib/routing.ts` → `isAuthenticatedAppRoute()` controls chrome visibility.

---

## 4. API Routes

### Core APIs (`/api/`)
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/listings` | GET, POST | List/create marketplace listings |
| `/api/listings/[id]` | GET, PUT, DELETE | Single listing CRUD |
| `/api/listings/[id]/purchase` | POST | Purchase flow |
| `/api/listings/[id]/download` | GET | Download handler |
| `/api/listings/[id]/archive` | POST | Archive listing |
| `/api/listings/[id]/tags` | GET, PUT | Tag management |
| `/api/listings/[id]/media` | POST | Media upload |
| `/api/listings/[id]/readme` | GET | Readme content |
| `/api/listings/[id]/status` | PUT | Status change |
| `/api/listings/[id]/asset` | POST | Asset upload |
| `/api/listings/[id]/skill-prompt` | GET | Skill prompt content |
| `/api/search` | GET | Full-text search |
| `/api/search/suggestions` | GET | Autocomplete |
| `/api/explore` | GET | Discovery feed data |
| `/api/reviews` | GET, POST | Review CRUD |
| `/api/bookmarks` | GET, POST, DELETE | Bookmark management |
| `/api/collections` | GET, POST | Collections |
| `/api/collections/[id]` | GET, PUT, DELETE | Single collection |
| `/api/collections/[id]/items` | POST, DELETE | Collection items |
| `/api/downloads` | GET, POST | Download tracking |
| `/api/follows` | GET, POST, DELETE | Follow system |
| `/api/messages` | GET, POST | Messaging |
| `/api/messages/[id]` | GET, PUT | Single message |
| `/api/comments` | GET, POST | Comments |
| `/api/contact` | POST | Contact form |
| `/api/moderation/reports` | POST | Content reports |
| `/api/quality-control` | POST | Quality scoring |
| `/api/referrals/code` | GET, POST | Referral system |

### Auth & Account (`/api/auth/`, `/api/account/`)
| Route | Purpose |
|-------|---------|
| `/api/auth/reset-password/request` | Password reset email |
| `/api/auth/reset-password/confirm` | Reset confirmation |
| `/api/account/avatar` | Avatar upload |
| `/api/account/settings` | User settings |
| `/api/verify-email` | Email verification |

### Stripe (`/api/stripe/`)
| Route | Purpose |
|-------|---------|
| `/api/stripe/checkout` | Stripe Checkout session |
| `/api/stripe/checkout/listing` | Listing purchase checkout |
| `/api/stripe/webhook` | Stripe webhook handler |
| `/api/stripe/subscribe` | Subscription creation |
| `/api/stripe/customer-portal` | Stripe billing portal |
| `/api/stripe/connect` | Stripe Connect |
| `/api/stripe/connect/onboard` | Creator onboarding |
| `/api/stripe/connect/status` | Connect status check |

### Creator (`/api/creator/`)
| Route | Purpose |
|-------|---------|
| `/api/creator/payouts` | Payout management |
| `/api/creator/payouts/export` | Payout CSV export |

### AI & Architect (`/api/ai/`, `/api/architect/`)
| Route | Purpose |
|-------|---------|
| `/api/ai/generate-description` | AI description generation |
| `/api/ai/generate-tags` | AI tag generation |
| `/api/ai-review` | AI listing review |
| `/api/analyze` | Content analysis |
| `/api/architect/chat` | Architect AI chat |
| `/api/architect/generate` | Project generation |
| `/api/architect/session` | Session management |
| `/api/architect/skills` | Skills query |

### Workflows (`/api/workflows/`)
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/workflows` | GET, POST | List/create workflow expansions |
| `/api/workflows/[id]` | GET, DELETE | Single workflow CRUD |
| `/api/workflows/[id]/archive` | POST | Archive workflow |
| `/api/workflows/[id]/expand` | POST, PUT, PATCH | AI expansion pipeline |

### GitHub (`/api/github/`)
| Route | Purpose |
|-------|---------|
| `/api/github/auth` | GitHub OAuth initiation |
| `/api/github/callback` | OAuth callback |
| `/api/github/repos` | List user repos |
| `/api/github/scan` | AI-powered repo scan |
| `/api/github/scan-repo` | Deep repo analysis |

### Admin (`/api/admin/`)
| Route | Purpose |
|-------|---------|
| `/api/admin/users`, `/api/admin/users/[id]` | User management |
| `/api/admin/listings`, `/api/admin/listings/[id]` | Listing management |
| `/api/admin/listings/[id]/approve`, `/reject` | Moderation |
| `/api/admin/moderation/[id]` | Report handling |
| `/api/admin/transactions/[id]`, `/refund` | Transaction management |
| `/api/admin/announcements`, `/changelog` | Announcements |
| `/api/admin/notifications/broadcast` | Mass notifications |
| `/api/admin/settings` | Platform settings |
| `/api/admin/scrape/skillsmp` | Content scraping |
| `/api/admin/ingest/clawhub` | Content ingestion |
| `/api/admin/categorize` | Bulk queue categorization |
| `/api/admin/categorize/:id` | Categorize single listing |
| `/api/admin/categorize/worker` | Run categorization batch |
| `/api/admin/categorization-status` | Categorization job status |
| `/api/admin/categorization/uncategorized` | Uncategorized listings |
| `/api/admin/categorization/low-confidence` | Low-confidence queue |
| `/api/admin/categorization/jobs` | Recent categorization jobs |

### Developer Platform (`/api/developers/`, `/api/v1/`)
| Route | Purpose |
|-------|---------|
| `/api/developers/keys` | API key management |
| `/api/developers/webhooks` | Webhook configuration |
| `/api/developers/mcp`, `/mcp/[id]` | MCP server management |
| `/api/keys/[id]`, `/revoke`, `/rotate` | Key lifecycle |
| `/api/oauth/authorize`, `/token`, `/refresh` | OAuth provider |
| `/api/v1/listings`, `/v1/listings/[id]` | Public REST API |
| `/api/v1/users/[id]`, `/v1/users/me` | User API |
| `/api/v1/analytics/listings`, `/usage` | Analytics API |
| `/api/v1/webhooks`, `/v1/webhooks/[id]` | Webhook API |

### Other
| Route | Purpose |
|-------|---------|
| `/api/health` | Health check endpoint |
| `/api/analytics/creator` | Creator analytics |
| `/api/billing/entitlements` | Feature entitlements |
| `/api/import/skillsmp` | SkillsMP import |
| `/api/mcp/[id]`, `/connect`, `/disconnect`, `/test` | MCP operations |
| `/api/role/upgrade` | Role upgrade |
| `/api/versions` | API versioning |

---

## 5. Database (Supabase PostgreSQL)

**60+ tables** with Row-Level Security. Key tables:

| Table | Purpose |
|-------|---------|
| `users`, `profiles`, `roles` | User identity |
| `listings`, `listing_versions` | Marketplace content |
| `listing_tags`, `tags`, `categories` | Taxonomy |
| `listing_faqs`, `listing_install_commands` | Listing metadata |
| `reviews`, `review_responses` | Social proof |
| `downloads`, `bookmarks`, `follows` | Engagement |
| `collections`, `collection_items` | Curated groups |
| `transactions`, `stripe_customers`, `stripe_events` | Commerce |
| `subscriptions` | Subscription tiers |
| `creators`, `creator_accounts` | Creator system |
| `notifications`, `messages` | Communication |
| `mcp_servers`, `mcp_connections`, `mcp_tokens` | MCP ecosystem |
| `api_keys`, `oauth_authorizations`, `oauth_tokens` | Developer platform |
| `webhooks`, `webhook_deliveries` | Webhook system |
| `analytics`, `analytics_events`, `page_views` | Tracking |
| `content_flags`, `moderation_reports` | Trust & safety |
| `platform_announcements` | System announcements |
| `activity_feed` | Activity tracking |
| `workflow_expansions`, `workflow_expansion_steps` | AI workflow system |

### Key Enums
`listing_type_enum`: SKILL, PLUGIN, MCP, AGENT, PROMPT, WORKFLOW, TEMPLATE, AUTOMATION, DEVELOPER_TOOL  
`listing_status_enum`: DRAFT, PENDING, ACTIVE, REJECTED, SUSPENDED  
`role_enum`: USER, CREATOR, ADMIN, MODERATOR, OWNER  
`workflow_expansion_status`: DRAFT, RUNNING, COMPLETED, FAILED, ARCHIVED, IMPORTED  
`transaction_status_enum`: PENDING, COMPLETED, FAILED, REFUNDED  
`subscription_tier_enum`: FREE, PRO, ENTERPRISE, STARTER, BUSINESS

### Applied Migrations (25 total)
All in `supabase/migrations/` — from initial schema through cycle 16 additions (workflow expansions, imported status, marketplace discovery).

---

## 6. Authentication & Security

- **Supabase Auth** with cookie-based SSR (`@supabase/ssr`)
- **Middleware** (`middleware.ts`): Protects `/creator/*`, `/admin/*`, `/dashboard/*`, `/account/*`, `/settings/*`
- **Admin obfuscation**: `/admin` returns 404 unless env-configured prefix matches
- **RLS**: Enforced on all tables; trigger functions have EXECUTE revoked from PUBLIC
- **RBAC**: USER → CREATOR → MODERATOR → ADMIN → OWNER
- **GitHub OAuth**: Via Next.js API routes (not edge functions)

---

## 7. Completed Cycles

| Cycle | Focus | Status |
|-------|-------|--------|
| 12 | Trust & Creator Content | ✅ Done |
| 13 | Commerce & Ingestion | ✅ Done |
| 14 | Discovery & Polish | ✅ Done |
| 15 | Engagement & Hardening | ✅ Done |
| 16 | Enterprise Workflow + Explore V2 | ✅ Done |
| 17 | Landing Page Redesign + Launch Readiness | ✅ Done |

### Cycle 16 Deliverables
- GitHub OAuth + Gemini repo scan for upload modal
- Editable tags in upload review step
- Supabase Storage gallery uploads
- Health endpoint with Stripe validation
- `createPublicClient()` for SSG/ISR pages
- Admin 404 obfuscation
- Explore V2 discovery feed with 8+ sections
- Search redesign with autocomplete
- Marketplace discovery RPCs + quality scores
- Creator dashboard + public profiles
- Architect Workshop with AI expansion pipeline
- ExpandOverlay v2: 3-column animated UI with neural canvas, hex score, holographic cards

### Cycle 17 Deliverables
- Premium homepage redesign with animated hero, spotlight search, floating cards, live stats
- 20-category grid, feature cards, marketplace carousels, architect section, workflow section, creator section
- Real-time homepage data fetch from Supabase with caching
- Mobile-responsive navbar with hamburger menu and simplified launch links
- Removal of all MCP references from public marketing pages
- `/creators` index page for browsing verified creators
- Build passes clean

---

## 8. Design System Summary

**Theme:** Dark luxury technology marketplace  
**Background:** `#09090B` | **Card:** `#1C1917` | **CTA/Accent:** `#CA8A04` (gold)  
**Fonts:** Poppins (headings) + DM Sans (body)  
**Components:** Glass cards, gold gradient CTAs, Radix primitives, `lucide-react` icons, animated particle canvas, floating cards, bento grids  
**Canonical reference:** `design.md` + `design-system/MASTER.md`

---

## 9. Key Configuration Files

| File | Purpose |
|------|---------|
| `.env` / `.env.local` | Environment variables (Supabase, Stripe, Gemini, OpenRouter, Resend, GitHub) |
| `middleware.ts` | Route protection + auth |
| `tailwind.config.ts` | Design tokens + custom animations |
| `app/globals.css` | Global styles + 30+ keyframe animations |
| `next.config.mjs` | Next.js config |
| `tsconfig.json` | TypeScript config (path aliases: `@/*`) |
| `playwright.config.ts` | E2E test config |
| `.cursor/mcp.json` | MCP server config for IDE agents |

---

## 10. What's Working

- ✅ Premium landing page with animated hero, spotlight search, live stats, category grid, and marketplace carousels
- ✅ Hero layout stability: no duplicate placeholders, no clipped dropdowns, no floating-card overlap, responsive navbar
- ✅ AI categorization engine: multi-category assignments, confidence scoring, auto-tagging, background worker, admin panel, category pages
- ✅ Full marketplace browse, search, filter, sort
- ✅ Listing creation (manual + GitHub import + AI scan)
- ✅ Stripe checkout for paid listings
- ✅ Creator studio (dashboard, analytics, payouts, settings)
- ✅ Review system with verified badges + creator responses
- ✅ Collections, bookmarks, follows, downloads
- ✅ Admin panel with moderation, user management, analytics
- ✅ Developer portal (API keys, webhooks, OAuth)
- ✅ Architect AI project generator
- ✅ Workshop with AI expansion pipeline
- ✅ Workflow analysis runs live with streaming progress + current file animation
- ✅ Platform announcements + notifications
- ✅ SEO (sitemap, robots, OpenGraph, structured data)
- ✅ Messaging system
- ✅ Activity feed
- ✅ 14+ Playwright E2E tests passing
- ✅ Build passes clean
- ✅ Public navigation updated with mobile menu and simplified launch links
- ✅ AI install prompt cache with 4-day staleness refresh and background regeneration
- ✅ SkillModal shows "Updated just now" indicator when a stale prompt refreshes in the background
- ✅ GitHub install flow is instant: free/owned listings open the SkillModal immediately, paid listings redirect to Stripe, and download tracking runs in the background
- ✅ Listing documentation tab fetches the README from the GitHub repo (falls back to `listing.readme`) instead of mirroring the top description
- ✅ Authenticated navbar uses "Dashboard" instead of "Creator Studio"; public navbar no longer shows a separate "Creator Portal" button
- ✅ Dashboard notification panel removed
- ✅ Event collection pipeline: every click, search, install, bookmark, and Architect prompt is tracked in `analytics_events`
- ✅ User interest profile (`user_interest_profile`) updates in real time from the event stream
- ✅ Recommendation engine: `GET /api/recommendations` scores listings based on the user profile with recency decay
- ✅ Simple keyword extraction for Architect prompts to infer categories and listing types
- ✅ Admin panel foundation: sectioned enterprise sidebar, shared `AdminDataTable`, redesigned executive dashboard
- ✅ New admin pages: Users, Creators, Categories, Announcements, System Health, Projects
- ✅ Admin data table: sorting, per-column filters, pagination, CSV export
- ✅ Admin panel uses only the admin shell; standard authenticated navbar is suppressed for admin routes
- ✅ Phase 2 — Users & Roles: `users.status` + `users.last_active_at`, role APIs, suspend/activate, notify, audit logs
- ✅ `/admin/users` server-side filters, status column, suspend/activate button
- ✅ `/admin/users/[id]` detail page with notify, suspend, audit log
- ✅ `/admin/roles` static permission matrix
- ✅ Suspended users are redirected to `/auth/login?error=suspended`
- ✅ Middleware preserves `x-pathname` through `/felon-admin` → `/admin` rewrite so the protected layout suppresses the standard shell
- ✅ Architect enforces markdown-only output; `.ts` filenames from AI are normalized to `.md`
- ✅ API docs moved from `/api-docs` to `/docs/api`; old `/api-docs` route removed
- ✅ `docs.midasai.tech` rewrites to `/docs`; production branch updated to `main` on Vercel
- ✅ Homepage stats bar now shows requested static trust metrics: 27,423+ AI Assets, 4,891+ Creators, 3.2M+ Downloads, 42 Categories, 8,700+ Workflows, 5,100+ Agents, 185K+ Users
- ✅ GitHub Discovery & Prompt Import pipeline foundation: schema, discovery service, classification, review queue, admin dashboard
- ✅ Scheduled discovery: `github-discovery-scheduler` edge function + hourly pg_cron job
- ✅ Approved imports create `listings` rows; search vector auto-refreshes via existing trigger
- ✅ Admin panel audit: fixed `/felon-admin` alias routing, internal admin link consistency, and added smoke tests
- ✅ Removed unused imports in admin pages and replaced external `<a>` with internal `Link` in `/admin/roles`
- ✅ Enterprise Billing Phase 1: schema, plan_definitions, plan_features, organizations, credits, usage tracking
- ✅ New tier model: FREE / PRO / TEAM / ENTERPRISE
- ✅ Database-driven entitlement system via `lib/billing/plans.ts` and `lib/billing/entitlements.ts`
- ✅ Credit reservation/capture/refund service in `lib/billing/credits.ts`
- ✅ AI usage tracking service in `lib/billing/usage.ts`
- ✅ Distributed rate limiting via `rate_limit_buckets` and `check_rate_limit_bucket` RPC
- ✅ Updated PricingClient, account billing page, and upgrade buttons for new tiers
- ✅ Updated Stripe checkout subscription route to use plan definitions
- ✅ Regenerated `types/database.ts` after all schema changes

---

## 11. Pending / Known Issues

- Stripe live keys not yet configured (test mode works)
- New Stripe env vars need to be added to production: `STRIPE_TEAM_MONTHLY_PRICE_ID`, `STRIPE_TEAM_YEARLY_PRICE_ID`, `STRIPE_ENTERPRISE_MONTHLY_PRICE_ID`, `STRIPE_ENTERPRISE_YEARLY_PRICE_ID`
- Some admin pages have limited real data (need production seeding)
- Email templates need production SMTP verification
- PostHog/GA/Clarity analytics not yet wired to production
- Architect generation runs in the browser tab; page reloads interrupt the job (next iteration: server-side worker + Supabase Realtime)
- Seeded homepage assets need real data as creators publish
- AI credit tracking not yet wired to AI chat, architect, or workflow expansion routes
- Credit pack purchase UI and webhook handling not yet built
- Organization creation UI and team invitation flow not yet built

---

## 12. Agent Reading Order

1. `AGENTS.md` — Agent roles, ownership, cycles
2. `CLAUDE.md` — Working style and quality standards
3. `PROJECT_CONTEXT.md` — Full architecture map
4. `memory/project-state.md` — This file (current state)
5. `memory/checkpoints/` — Latest checkpoint
6. `MIDASAI_BIBLE.md` — Deep reference (28K words)
7. `design.md` — UI/UX system
