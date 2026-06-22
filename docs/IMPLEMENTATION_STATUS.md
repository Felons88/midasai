# MidasAI — Implementation Status

Living status log for the autonomous execution cycles. Updated after each cycle.

- **Branch:** `cursor/execution-cycles-audit-f6e8`
- **Last updated:** 2026-06-22

---

## Cycle log

### Cycle 1 — Audit & design baseline ✅
- Mapped routes (71 pages / 49 API), probed all public routes (all 200), inspected DB schema + row counts.
- Authored `docs/GAP_ANALYSIS.md`, `docs/DESIGN.md`, this file.

### Cycle 6 — Stripe subscription checkout (F4 / Phase 10) ✅ (verified up to payment)
- **Bug fixed:** checkout returned 500 `No valid payment method types for this Checkout Session`. The session didn't specify `payment_method_types`; the live account had no automatic payment methods configured. Now explicitly requests `card` (`app/api/stripe/checkout/route.ts`).
- **Verified end-to-end** (user authorized using live keys): `/pricing` → "Upgrade to STARTER" → redirect to a real `checkout.stripe.com` session (`cs_live_…`) showing "Subscribe to Starter — $9.99/month" with the card form and pre-filled email. **Stopped before payment** (no charge, no completed subscription). Video reviewed.
- **Open config issues (data, not code):** pricing UI shows STARTER $19/mo but the Stripe price is $9.99/mo (`PLAN_LIMITS.priceMonthly` vs Stripe product mismatch); `*_YEARLY_PRICE_ID`s still point at monthly prices; `STRIPE_CONNECT_ACCOUNT_ID` is a `we_…` not `acct_…`. Webhook → subscription persistence not yet verified (needs a completed payment or Stripe CLI event).
- Side effect: a live Stripe Customer + `stripe_customers` row was created for the test user during verification.

### Cycle 5 — API key creation via enforced server route (F9, Phase 10) ✅
- **F9 (BROKEN→FIXED):** the `/developer/keys/new` page inserted directly into `api_keys` with a non-existent `hashed_key` column (creation failed), generated keys insecurely client-side, and bypassed plan-limit enforcement.
- Refactored it to call `POST /api/keys`, which enforces the plan limit (`enforceLimit`), hashes the key server-side (SHA-256), and returns the raw key once. Added a limit-reached upgrade prompt.
- **Verified end-to-end** as a FREE-tier user: 1st key created (DB row has 64-char `key_hash`, `midas_live_` prefix); 2nd attempt blocked with "Plan limit reached: 1/1 — upgrade to STARTER". No errors.
- Note: the broader billing **checkout** flow is intentionally NOT exercised — only LIVE Stripe keys were provided, so running it would create real customers/subscriptions. Awaiting test-mode keys.

### Cycle 4 — Follow system + creator profile access + security (F6/F7) ✅
- **F6 (BROKEN→FIXED):** the creator-profile Follow control was a server `<form method="DELETE">` posting form-encoded data to a JSON API — follow 500'd and unfollow silently no-op'd. Replaced with a client `components/creator/follow-button.tsx` using `fetch` (correct POST/DELETE + JSON), optimistic UI, and `router.refresh()` to sync the follower count.
- **F7 (BROKEN→FIXED):** middleware `protectedPaths` used `startsWith('/creator')`, which also matched the public `/creators/[id]` pages (redirect to login). Switched to segment-boundary matching so only `/creator` and `/creator/*` are protected.
- **Security:** reverted an over-permissive `Public can view all users` RLS policy (SELECT, qual=true) and now fetch creator profiles via the service client selecting only `id/name/avatar_url/created_at` — public profiles work without exposing `email`/`role`.
- **Verified:** browser follow/unfollow (count 0→1→0, no errors); anon profile renders name with no email/role in HTML; `/creator/*` + `/dashboard` still protected.

### Cycle 3 — Listing not-found hardening (F3, partial) ✅/⚠️
- Added a UUID-format guard in the listing route so malformed ids stop hitting Postgres (removes `Error fetching listing` log noise) while still rendering the not-found UI. **Verified** via `curl` + dev log.
- Attempted to fix the not-found **HTTP status** (returns 200 instead of 404) via `generateMetadata`+`notFound()`; it did **not** change the dev status (root `loading.tsx` streams a 200 first), so that part was reverted. F3 status-code remains OPEN — see `GAP_ANALYSIS.md`.

### Cycle 2 — Manual listing upload (F2) ✅
- Implemented `/creator/upload/manual` form wired to the existing `POST /api/listings/create`.
- Enabled the previously "Coming Soon" Manual Upload action on `/creator/upload`.
- Verified end-to-end in the browser as a CREATOR: filled the form → "Publish Listing" → redirected to `/creator/listings` with the new "Hello World Skill" card visible; confirmed in DB (`status=PENDING`, `type=SKILL`, `price=0`, `tags=[demo,hello-world,test]`). No errors.
- Note: `/creator/*` is gated behind the CREATOR role (redirects to `/dashboard?upgrade=creator` otherwise) — expected behavior, not a bug.

---

## Status snapshot

### Completed
- Dev environment runs against hosted Supabase; auth/login + protected dashboard verified.
- F1 Registration duplicate-key bug fixed (PR #7).
- F2 Manual listing upload page implemented and tested.
- Audit + design documentation baseline.

### Partial
- F3 Listing detail returns HTTP 200 for not-found (renders 404 UI). Needs root-cause + status fix.
- F4 Stripe / Resend / Gemini / OpenRouter / GitHub OAuth — code present but env-gated; need secrets to verify end-to-end.
- F5 Marketplace seed data sparse (1 listing, 0 creators/reviews).

### Broken
- None currently known (F1 resolved).

### Missing
- None currently known after F2 (deeper per-feature audit still pending for reviews write path, follow system, collections, admin moderation actions, edge-function parity).

---

## Current task
Cycle 2 complete and verified.

## Next task
Cycle 3 (highest unresolved priority): F3 — fix listing-detail not-found HTTP status (P2), pending root-cause confirmation; or F4 billing wiring once Stripe secrets are provided.

## Blockers
- F4 billing/AI/email/GitHub verification requires credentials (human action via Secrets): `STRIPE_SECRET_KEY` + price IDs + `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `GITHUB_CLIENT_ID/SECRET`.
