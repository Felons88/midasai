# MidasAI — Gap Analysis

Evidence-based audit produced by inspecting the live codebase, probing every public route against a running dev server, and querying the linked Supabase project (`skillsfb` / `rqermggomchlipmuigan`).

- **Method:** filesystem route map (71 page routes, 49 API routes), HTTP probing of all public routes, DB schema + row-count inspection via Supabase MCP, and source review of auth, listing, upload, and Stripe code paths.
- **Date:** 2026-06-22
- **Branch:** `cursor/execution-cycles-audit-f6e8`

> Classification key: **COMPLETE** (works end-to-end), **PARTIAL** (works but has a defect or is env/data-gated), **BROKEN** (defect with user-visible failure), **MISSING** (referenced but not implemented).

---

## 1. System map (high level)

| Layer | Implementation |
|-------|----------------|
| App | Next.js 15 App Router, route groups `(marketing)`, `(protected)`, `auth` |
| Pages | 71 `page.tsx` files |
| API | 49 `route.ts` handlers under `app/api` |
| Auth | Supabase Auth (`@supabase/ssr`) + middleware-protected paths; GitHub OAuth |
| DB | Hosted Postgres (Supabase), 62 public tables, RLS enabled on all |
| Edge fns | `supabase/functions/*` (mcp, usage, ai-notifications) |
| Integrations | Stripe, Resend, Google Gemini, OpenRouter, GitHub — all env-gated |

---

## 2. Route health (probed against running server)

All 28 probed public marketing routes returned **200** (`/`, `/about`, `/agents`, `/api-docs/*`, `/workflows`, `/categories`, `/explore`, `/templates`, `/docs`, `/docs/api`, `/faq`, `/pricing`, `/featured`, `/prompts`, `/skills`, `/contact`, `/mcp`, `/plugins`, `/trending`, `/search`, `/blog`). Protected routes correctly `307` to `/auth/login` when unauthenticated.

---

## 3. Findings

### F1 — Registration duplicate-key error — **BROKEN → FIXED**
- **Symptom:** every new sign-up showed `duplicate key value violates unique constraint "users_pkey"`.
- **Root cause:** `app/auth/register/page.tsx` inserted into `public.users` even though the DB trigger `handle_new_auth_user()` (AFTER INSERT on `auth.users`) already creates that row.
- **Status:** Fixed on branch `cursor/fix-register-duplicate-user-f6e8` (PR #7) — removed the redundant insert.
- **Priority:** P0 · **Impact:** blocks/erodes trust in core onboarding · **Files:** `app/auth/register/page.tsx`.

### F2 — `/creator/upload/manual` route missing — **MISSING**
- **Symptom:** `app/(protected)/creator/upload/page.tsx` has a "Manual Upload" card (badge "Coming Soon") that routes to `/creator/upload/manual`, which has no page → 404 dead link.
- **Backend readiness:** the `POST /api/listings/create` endpoint is fully implemented and validated, so only the UI is missing.
- **Status:** Implemented in this branch (see Cycle 2 / `IMPLEMENTATION_STATUS.md`).
- **Priority:** P1 · **Impact:** creators have only the GitHub/AI path; no manual listing creation · **Files:** `app/(protected)/creator/upload/manual/page.tsx` (new), `app/(protected)/creator/upload/page.tsx` · **Deps:** `/api/listings/create`, `categories` table.

### F3 — Listing detail returns HTTP 200 for not-found — **PARTIAL**
- **Symptom:** `/listing/<missing-or-invalid-id>` renders the "404 Not Found" UI but the HTTP status is **200** (verified via `curl -i`).
- **Root cause (confirmed):** a root `app/loading.tsx` creates a root-level Suspense boundary, so dynamically-rendered routes **stream** — Next.js commits a `200` + loading shell before the page body runs. By the time `notFound()` is reached in `app/(marketing)/listing/[id]/page.tsx`, the status is already `200`, so the not-found UI renders under a 200. Invalid (non-UUID) ids additionally log a Postgres error (`Error fetching listing`).
- **Partially mitigated:** added a UUID-format guard in `getListing` so malformed ids short-circuit (no needless query, no `Error fetching listing` log noise) and still render the not-found UI. **Verified.**
- **Status-code part still OPEN:** attempted to force a real 404 by calling `notFound()` from `generateMetadata` (runs before the body), but in dev the response still returns **200** — the root `app/loading.tsx` Suspense boundary commits the streamed 200 first. That approach was reverted. A correct fix likely requires changing the root loading/streaming strategy for this segment (e.g. a route-group `loading.tsx` instead of a root one, or rendering the listing route non-streamed), which has broader UX implications and warrants its own reviewed change. Production (`next start`) behavior should also be confirmed separately.
- **Priority:** P2 · **Impact:** SEO (soft-404s indexed as 200), incorrect status semantics · **Files:** `app/(marketing)/listing/[id]/page.tsx`, `app/loading.tsx` (context) · **Complexity:** Medium.

### F4 — Monetization & external integrations env-gated — **PARTIAL (by design)**
- Stripe (`STRIPE_SECRET_KEY`, price IDs, `STRIPE_WEBHOOK_SECRET`), Resend (`RESEND_API_KEY`), Gemini (`GEMINI_API_KEY`), OpenRouter (`OPENROUTER_API_KEY`), and GitHub OAuth (`GITHUB_CLIENT_ID/SECRET`) routes each guard on their env var and return errors when unset.
- **Priority:** P1 for billing once keys are provided · **Impact:** checkout, payouts, AI generation, email, and GitHub import are inert without secrets · **Deps:** secrets (human action) · **Complexity:** Low-Med (config + end-to-end verification).

### F5 — Marketplace content is near-empty — **DATA GAP (not code)**
- Row counts: `listings` = 1, `creators` = 0, `reviews` = 0, `collections` = 0, `categories` = 12, `tags` = 50.
- **Impact:** discovery/search/creator pages render but look empty; hard to validate ranking/review/follow flows end-to-end without seed data.
- **Priority:** P2 · **Recommendation:** add a seed/import path (Agent 8 territory) for representative listings/creators.

---

## 4. Prioritized backlog

| ID | Item | Class | Priority | Complexity |
|----|------|-------|----------|------------|
| F1 | Registration duplicate-key | BROKEN→FIXED | P0 | Low (done) |
| F2 | Manual upload page | MISSING→IMPLEMENTED | P1 | Med (done) |
| F4 | Stripe/billing wiring | PARTIAL | P1 | Med (needs secrets) |
| F3 | Listing not-found HTTP status | PARTIAL | P2 | Med |
| F5 | Marketplace seed data | DATA | P2 | Med |

### F6 — Follow button non-functional — **BROKEN → FIXED**
- **Symptom:** following a creator did nothing / errored. The control was a server-rendered `<form method="DELETE" action="/api/follows?…">` — HTML forms can't issue DELETE (falls back to GET), and POSTed form-encoded data hit an endpoint that does `request.json()`.
- **Fix:** new client `components/creator/follow-button.tsx` calling `/api/follows` via `fetch` (POST/DELETE + JSON) with optimistic state and `router.refresh()` to update the follower count. **Verified** in-browser (0→1→0).
- **Priority:** P1 · **Files:** `components/creator/follow-button.tsx` (new), `app/(marketing)/creators/[id]/page.tsx`.

### F7 — Public creator profiles blocked by middleware prefix collision — **BROKEN → FIXED**
- **Symptom:** `/creators/[id]` redirected to login for everyone — `protectedPaths` includes `/creator`, matched via `startsWith`, so the plural public route was captured.
- **Fix:** segment-boundary matching (`pathname === path || pathname.startsWith(path + '/')`) in `lib/supabase/middleware.ts`. **Verified:** `/creators/[id]` → 200; `/creator/*` and `/dashboard` still 307.
- **Priority:** P1 · **Files:** `lib/supabase/middleware.ts`.

### F8 — `users` RLS exposure (operational) — **RESOLVED**
- During Cycle 4 an over-permissive `Public can view all users` policy (SELECT, `qual=true`) was found on `public.users` and **dropped**; creator profiles now read public-safe columns (`id,name,avatar_url,created_at`) via the service client instead. Sensitive columns (`email`, `role`) are no longer exposed to anon. **Verified** (no email/role in anon-rendered HTML).

### F9 — API key creation broken + bypassed enforcement — **BROKEN → FIXED**
- **Symptom:** `/developer/keys/new` inserted into `api_keys` with a non-existent `hashed_key` column (the table uses `key_hash`), so creation failed; it also generated the key client-side (weak) and never hit the plan-limit guard.
- **Fix:** the page now calls `POST /api/keys` (server-side SHA-256 hashing + `enforceLimit` plan gate + raw key returned once) and shows a limit-reached upgrade prompt. **Verified:** FREE user creates 1 key (DB `key_hash` is 64-char SHA-256) and the 2nd is blocked (`1/1 — upgrade to STARTER`).
- **Priority:** P1 · **Files:** `app/(protected)/developer/keys/new/page.tsx`.

### Billing (F4 / Phase 10) — **PARTIAL**
- Plan-limit **entitlement enforcement** exists server-side (`lib/subscription-guard.ts`) and is now actually used by the API-key flow (F9). Other guarded resources (`webhooks`, `mcp_servers`, `listings`, `applications`) share this guard.
- **Checkout (FIXED + verified up to payment):** fixed a 500 (`No valid payment method types`) by specifying `payment_method_types=card`. Verified `/pricing` → STARTER → live `checkout.stripe.com` session at $9.99/mo (stopped before paying, no charge).
- **Still open:**
  - **Webhook → subscription persistence** not yet verified (needs a completed payment or a Stripe CLI event hitting `/api/stripe/webhook`).
  - **Price display mismatch:** `PLAN_LIMITS.priceMonthly` (STARTER $19, PRO $49, BUSINESS $149) vs actual Stripe prices ($9.99 / $29.99 / $99.99). Pick one source of truth.
  - **Yearly prices:** `*_YEARLY_PRICE_ID`s point at the monthly prices (`interval=month`); create real annual prices.
  - **`STRIPE_CONNECT_ACCOUNT_ID`** is a `we_…` (webhook endpoint), not an `acct_…`.
  - Live keys are in use per explicit user authorization; **rotate after audit**.

### F10 — Listing detail conversion page — **REBUILT (Phase 4)**
- `/listing/[id]` rebuilt as a conversion page on real data: trust-signal hero, working Save/Share/Follow/Purchase action bar, `git clone` install + copy, README markdown docs, schema-backed version history + reviews, creator stats card, related content. Verified in-browser.
- **Schema/creator-input follow-ups (next cycles, deliberately not faked):**
  - Creator-defined **multi-platform install commands** (npm/npx/pip/docker/MCP config/Cursor/Claude setup) — needs a `listings.install` jsonb (or table) + creator UI.
  - Creator-managed **FAQ** — needs a `listing_faqs` table + UI.
  - **Compatibility matrix** + structured **version/release** authoring — needs columns/UI on top of existing `listing_versions`.
  - Media **video/GIF** gallery + carousel/zoom — needs media schema beyond `images[]`.
  - Reviews: **helpful votes**, **creator responses**, **verified-purchase** badges, sort/filter — needs review schema columns.
  - Creator **social links** (website/GitHub/Discord/LinkedIn/X) and **bio** — `users` has none; needs profile columns.
- **Data quality:** GitHub scan-repo stores a file-listing dump as `readme` instead of real README markdown → Documentation renders as plain text. Fix at ingestion (Agent 8).

Areas still needing deeper per-feature verification (not yet exhaustively audited): notifications realtime delivery, reviews write path, collections, admin moderation actions, and edge-function deployment parity with the Next API routes.
