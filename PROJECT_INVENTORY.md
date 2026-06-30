# MidasAI — Complete Project Inventory

> **Last Updated:** June 20, 2026  
> Everything that exists in the project today.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Shadcn UI (Radix UI primitives) |
| Database | PostgreSQL via Supabase |
| Authentication | Supabase Auth + SSR |
| Icons | Lucide React |
| Validation | Zod |
| Fonts | Poppins (headings), Open Sans (body) |

---

## Design System

- **Theme:** Dark Luxury Tech (forced dark mode via `<html class="dark">`)
- **Style:** Glassmorphism with premium aesthetic
- **Primary Color:** Blue (#3B82F6 / #1E40AF)
- **Background:** #0F172A
- **Card Background:** #1E293B
- **Effects:** `ambient-glow`, `noise-overlay`, `shadow-glow`, `glass`, `transition-smooth`, `animate-fade-in-up`

---

## Database Schema (`supabase/schema.sql`)

### Tables (20 total)

| Table | Purpose |
|-------|---------|
| `users` | User accounts with roles (USER, CREATOR, ADMIN, MODERATOR, OWNER) |
| `categories` | Marketplace categories |
| `listings` | Core marketplace items (SKILL, PLUGIN, MCP, AGENT, PROMPT, WORKFLOW, TEMPLATE, AUTOMATION, DEVELOPER_TOOL) |
| `reviews` | User reviews with 1-5 ratings |
| `bookmarks` | User saved items |
| `notifications` | In-app notifications |
| `site_settings` | Platform configuration |
| `profiles` | Extended user profile data (bio, socials) |
| `creators` | Creator-specific data (display name, slug, verified, revenue) |
| `tags` | Marketplace tags |
| `listing_tags` | Many-to-many listings↔tags |
| `collections` | User-curated collections |
| `collection_items` | Items in collections |
| `downloads` | Download tracking with IP/user-agent |
| `messages` | User-to-user messaging |
| `analytics` | Event tracking (JSONB metadata) |
| `transactions` | Payment records (PURCHASE, PAYOUT, REFUND, COMMISSION) |
| `subscriptions` | User subscription management (FREE, PRO, ENTERPRISE) |
| `assets` | File/image storage metadata |
| `user_settings` | User preferences |
| `audit_logs` | Admin audit trail |

### Enums

- `role_enum`, `listing_type_enum`, `listing_status_enum`, `asset_type_enum`, `notification_type_enum`, `subscription_tier_enum`, `subscription_status_enum`, `transaction_type_enum`, `transaction_status_enum`

### Indexes

- 17 indexes on foreign keys and common query patterns

### RLS Policies

- Full Row Level Security enabled on all 20 tables
- ~40 policies covering read/write/delete for each role

### Migration Applied

- `fix_users_rls_insert_policy` — Added INSERT policies to users table for registration

---

## Authentication

| File | Purpose |
|------|---------|
| `lib/supabase/client.ts` | Browser-side Supabase client |
| `lib/supabase/server.ts` | Server-side Supabase client (cookie-based) |
| `lib/supabase/middleware.ts` | Session refresh middleware |
| `middleware.ts` | Root middleware (calls `updateSession`) |

### Auth Routes

- `/auth/login` — Login page
- `/auth/register` — Registration page
- `/auth/logout` — Logout handler

---

## Routes (31+ pages)

### Public Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage (14KB, full implementation) |
| `/skills` | Skills directory |
| `/plugins` | Plugins directory |
| `/mcp` | MCP Servers directory |
| `/agents` | AI Agents directory (real Supabase queries) |
| `/prompts` | Prompts directory |
| `/workflows` | Workflows directory |
| `/templates` | Templates directory |
| `/collections` | Collections browse |
| `/categories` | Categories browse |
| `/trending` | Trending listings |
| `/featured` | Featured listings |
| `/search` | Search page |
| `/pricing` | Pricing page |
| `/blog` | Blog page |
| `/docs` | Documentation |
| `/about` | About page |
| `/contact` | Contact page |
| `/listing/[id]` | Listing detail page |

### Protected User Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | User dashboard (with loading state) |
| `/profile` | User profile |
| `/settings` | User settings |
| `/notifications` | User notifications |
| `/bookmarks` | User bookmarks |

### Creator Pages (Real Supabase Data)

| Route | Description |
|-------|-------------|
| `/creator/dashboard` | Creator dashboard — revenue, downloads, views, conversion rate, sales, refunds, trending assets, recent activity, notifications, AI insights |
| `/creator/analytics` | Analytics dashboard — views, sales, conversion rate, ratings, top listings |
| `/creator/payouts` | Revenue and payouts — gross revenue, platform fees, net revenue, refunds, pending/completed payouts |
| `/creator/listings` | Listing management — edit, pricing, reviews, archive, delete actions |
| `/creator/upload` | Listing creation — GitHub URL, ZIP upload, local file upload |

### Admin Pages

| Route | Description |
|-------|-------------|
| `/admin/dashboard` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/listings` | Listing management |
| `/admin/settings` | Platform settings |

---

## API Routes (6)

| Route | Purpose |
|-------|---------|
| `/api/search` | Full-text search with filtering, sorting, pagination |
| `/api/analyze` | AI asset analyzer (title, description, classification, category, auto-tags) |
| `/api/quality-control` | Documentation, structure, code quality, AI quality scoring |
| `/api/reject` | Rejection with actionable feedback |
| `/api/test-sandbox` | Testing sandbox with PASS/FAIL reports |
| `/api/ai-review` | AI review assistant (quality, SEO, marketplace, revenue scoring) |

---

## Utility Libraries

| File | Purpose |
|------|---------|
| `lib/seo.ts` | SEO metadata generation (Open Graph, Twitter Cards, Schema.org structured data, listing/category/creator SEO) |
| `lib/monetization.ts` | Subscription tiers (FREE/PRO/ENTERPRISE), platform fee calculation, access control, pricing models |
| `lib/trust.ts` | Trust badges, creator verification scoring, asset quality scoring, badge criteria |
| `lib/utils.ts` | General utilities (cn helper) |

---

## UI Components

| Component | Location |
|-----------|----------|
| Button | `components/ui/button.tsx` |
| Card (+ CardHeader, CardContent, CardTitle, CardDescription) | `components/ui/card.tsx` |
| DropdownMenu | `components/ui/dropdown-menu.tsx` |
| Input | `components/ui/input.tsx` |
| Label | `components/ui/label.tsx` |

### Layout Components

| Component | Location |
|-----------|----------|
| Navbar | `components/layout/Navbar.tsx` |
| Footer | `components/layout/Footer.tsx` |

---

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `tailwind.config.ts` | Tailwind theme + custom utilities |
| `postcss.config.mjs` | PostCSS config |
| `next.config.mjs` | Next.js config |
| `middleware.ts` | Auth session middleware |
| `.gitignore` | Git ignore rules |

---

## Types

| File | Purpose |
|------|---------|
| `types/database.ts` | Database TypeScript types |

---

## Memory & Documentation

| File | Purpose |
|------|---------|
| `AGENTS.md` | Multi-agent organization and rules |
| `CLAUDE.md` | Claude-specific context |
| `AGENT_HANDOFF.md` | Agent handoff protocol |
| `context.md` | Project context |
| `design-system/MASTER.md` | Design system reference |
| `memory/project-state.md` | Current project state |
| `memory/architecture-map.md` | Architecture overview |
| `memory/current-state-analysis.md` | State analysis |
| `memory/missing-systems-analysis.md` | Gap analysis |
| `memory/functional-audit.md` | Functional audit |
| `memory/checkpoints/*.md` | Session checkpoints (5 files) |

---

## What Works Today

1. **Authentication** — Login, register, logout with Supabase Auth + cookie sessions
2. **Route protection** — Middleware validates sessions on protected routes
3. **Creator dashboard** — Real Supabase queries for revenue, sales, downloads, views
4. **Creator analytics** — Real data from Supabase
5. **Creator payouts** — Revenue breakdown with platform fees
6. **Creator listings management** — CRUD with real data
7. **Listing upload** — Multi-method upload (GitHub, ZIP, local)
8. **Search API** — Full-text search, filters, sorting, pagination against real DB
9. **Agents page** — Real Supabase query for AGENT type listings
10. **SEO utility** — Generates metadata, Open Graph, structured data
11. **Monetization utility** — Subscription tiers, fee calculation, access control
12. **Trust utility** — Badge system, creator/asset scoring
13. **AI API routes** — Analyze, quality control, reject, test sandbox, AI review (placeholder logic ready for real AI service)
14. **Dark luxury theme** — Glassmorphism, ambient glow, noise overlay, animations
15. **Database schema** — Comprehensive 20-table schema with RLS
