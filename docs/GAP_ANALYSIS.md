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
- **Suggested fix (own cycle):** determine existence before streaming — e.g. call `notFound()` from a `generateMetadata` for the listing route (runs pre-stream), de-duplicating the query with React `cache()`; and validate the id is a UUID before querying to avoid the logged error. Avoid removing the global `loading.tsx` (broad UX impact).
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

Areas still needing deeper per-feature verification (not yet exhaustively audited): notifications realtime delivery, reviews write path, follow system, collections, admin moderation actions, and edge-function deployment parity with the Next API routes.
