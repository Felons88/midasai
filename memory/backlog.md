# MidasAI Backlog

## Last Updated
2026-06-19 — Agent 0 (Project Manager)

---

## Priority Legend
- **P0** — Blocking all other work. Must do first.
- **P1** — Core platform. Do immediately after P0.
- **P2** — Important features. Do after core is wired.
- **P3** — Polish, scale, monetize.

---

## P0 — Blockers (Do Now)

### BLOCKER-001: Architecture Contradiction
- **What**: CLAUDE.md says Prisma + NextAuth. Code uses Supabase.
- **Impact**: Any agent following CLAUDE.md will build the wrong thing.
- **Action**: Update CLAUDE.md to reflect Supabase stack. Remove Prisma/NextAuth references.
- **Assigned**: Next available agent
- **Status**: OPEN

### BLOCKER-002: No Supabase Connection
- **What**: No `.env` file. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` not set.
- **Impact**: App crashes on every route. Nothing works.
- **Action**: James to provide Supabase project credentials.
- **Assigned**: James (owner)
- **Status**: BLOCKED — waiting on owner

### BLOCKER-003: Database Schema Not Applied
- **What**: `supabase/schema.sql` exists but has never been run.
- **Impact**: No tables, no data, all pages show mock content.
- **Action**: Apply schema via Supabase SQL editor or CLI once project is provisioned.
- **Depends on**: BLOCKER-002
- **Status**: BLOCKED

### BLOCKER-004: Dependencies Not Installed
- **What**: `npm install` has never been run. No `node_modules/`.
- **Impact**: Cannot build or run the app.
- **Action**: Run `npm install && npm run build` to verify.
- **Status**: OPEN

### BLOCKER-005: No README.md
- **What**: No setup documentation exists.
- **Impact**: No agent or contributor can set up the project.
- **Action**: Create README.md with prerequisites, env vars, setup steps, and dev commands.
- **Status**: OPEN

---

## P0 — Design System Fix

### DESIGN-001: Wrong Color Scheme
- **What**: context.md specifies gold primary (#D4AF37) + black background (#050505). Code uses blue primary + navy background.
- **Impact**: Visual identity doesn't match the brand vision.
- **Action**: Update globals.css dark theme to gold/black scheme.
- **Status**: OPEN

---

## P1 — Data Layer

### DATA-001: TypeScript Types
- Generate types from Supabase schema (`supabase gen types typescript`)
- Create `lib/types/database.ts`

### DATA-002: Server Actions — Listings
- `getListings(filters)` — query with type/category/search/sort
- `getListing(id)` — single listing with creator + reviews
- `createListing(data)` — creator only
- `updateListing(id, data)` — creator only, own listings
- `deleteListing(id)` — creator only, own listings

### DATA-003: Server Actions — Reviews
- `getReviews(listingId)`
- `createReview(listingId, data)` — authenticated users
- `updateReview(id, data)` — own reviews only

### DATA-004: Server Actions — Bookmarks
- `getBookmarks()` — current user
- `toggleBookmark(listingId)` — add/remove

### DATA-005: Server Actions — User/Creator
- `getProfile()`, `updateProfile(data)`
- `getCreatorProfile(userId)` — public
- `getCreatorStats(userId)` — creator dashboard

### DATA-006: Server Actions — Admin
- `getAdminStats()` — platform metrics
- `getUsers(filters)`, `updateUserRole(userId, role)`
- `getPendingListings()`, `approveRejectListing(id, status)`

### DATA-007: Wire All Pages
- Replace every hardcoded mock array with a real DB query
- Priority: listing pages > dashboards > search > admin

---

## P1 — Admin Security

### ADMIN-001: Hidden Admin Route
- Create `ADMIN_ROUTE_PREFIX` env var
- Move `/admin/*` pages under `/[prefix]/*` dynamic route
- Update middleware to check role = ADMIN for admin routes
- Remove all references to `/admin` from navigation

---

## P2 — Marketplace Features

### MARKET-001: Tags System
- Add `tags` table to schema (id, name, slug)
- Add `listing_tags` junction table
- Create tag filtering in search
- Display tags on listing cards and detail pages

### MARKET-002: Collections
- Add `collections` table (id, user_id, name, description, is_public)
- Add `collection_items` junction table
- Allow users to create/manage collections
- Public collection pages

### MARKET-003: File Upload
- Configure Supabase Storage bucket for listing files
- Upload flow in creator upload page
- Secure download links for purchased items

### MARKET-004: Creator Profiles
- Public creator profile page (`/creators/[slug]`)
- Creator stats, listings, reviews
- Follow creator (needs `follows` table)

### MARKET-005: Downloads Tracking
- Add `downloads` table (user_id, listing_id, downloaded_at)
- Increment listing.downloads counter
- Show in user dashboard

---

## P2 — Search

### SEARCH-001: Full-Text Search
- Add `tsvector` column to listings
- Create GIN index
- Supabase `.textSearch()` in search server action

### SEARCH-002: Faceted Filters
- Type (skill, plugin, MCP, agent, prompt, workflow, template)
- Category
- Price range
- Rating threshold
- Platform

### SEARCH-003: Sort
- Relevance, newest, most downloaded, highest rated, price low-high/high-low

---

## P3 — SEO

### SEO-001: Dynamic Metadata
- `generateMetadata()` on every listing page
- Category pages with dynamic titles/descriptions

### SEO-002: OpenGraph + Twitter Cards
- Per-listing OG images
- Twitter Card meta tags

### SEO-003: Structured Data
- Schema.org Product markup on listings
- BreadcrumbList on category pages

### SEO-004: Sitemap + Robots
- Dynamic `sitemap.xml` from listings
- `robots.txt`

---

## P3 — Infrastructure

### INFRA-001: CI/CD
- GitHub Actions: lint, typecheck, build on PR
- Deploy to Vercel on merge to main

### INFRA-002: Testing
- Vitest for unit tests
- Playwright for E2E
- Test auth flow, CRUD operations, search

### INFRA-003: Performance
- Server Components optimization (most pages are already server components)
- Image optimization with next/image
- Lazy loading for below-fold content
- Target Lighthouse 95+

---

## P3 — Monetization

### MONEY-001: Stripe Integration
- Checkout flow for paid listings
- Creator payout system

### MONEY-002: Premium Memberships
- Subscription tiers
- Member-only content

### MONEY-003: Ad Revenue
- Google AdSense integration
- Featured/sponsored listing slots

---

## Icebox (Unscheduled)
- MCP Server metadata system (installation instructions, config format)
- AI Agent connectivity layer
- Image generation architecture
- Real-time notifications (Supabase Realtime)
- OAuth providers (GitHub, Google)
- Two-factor authentication
- Activity feed
- Creator analytics charts
- Email notifications
- Webhook system for integrations
