# Enterprise Billing, Credit Engine & Subscription Platform — Phase 1 Audit

> **Date:** 2026-07-03
> **Auditor:** AGENT 0 / AGENT 9 (Monetization)
> **Scope:** Existing billing, subscription, entitlement, AI usage, rate-limit, checkout, and auth systems.

---

## 1. Executive Summary

MidasAI has a working **Stripe test-mode integration** for one-time marketplace purchases and basic subscription checkout, but it does **not** have an enterprise-grade billing foundation. The current implementation has:

- **Tier inconsistency** across the codebase (FREE/PRO/ENTERPRISE vs FREE/STARTER/PRO/BUSINESS).
- **No credit engine** for AI features.
- **No transaction-based billing** for AI operations.
- **No centralized usage tracking** for AI calls.
- **No embedded billing UI** (only hosted Stripe Checkout).
- **No organization/team support**.
- **No database-driven plan configuration**.
- **In-memory rate limiting** with a bug in the middleware layer.

This audit is the foundation for the enterprise billing platform described in the CEO directive.

---

## 2. Existing Systems

### 2.1 Authentication

- **Supabase Auth** with `@supabase/ssr` cookie transport.
- Server helpers: `lib/supabase/server` → `createClient()`, `createServiceClient()`.
- Middleware protects `(protected)` routes.
- User identity stored in `users` table; profile in `profiles` table.
- No organization or team membership model.

### 2.2 Stripe Integration

| File | Purpose | Status |
|------|---------|--------|
| `lib/stripe.ts` | Stripe client singleton, fee computation | ✅ Works in test mode |
| `lib/stripe/config.ts` | Price IDs for STARTER/PRO/BUSINESS | ⚠️ Legacy env fallbacks, no TEAM price |
| `app/api/stripe/checkout/route.ts` | Subscription checkout session | ✅ Works, but no embedded form |
| `app/api/stripe/checkout/listing/route.ts` | One-time listing purchase | ✅ Works |
| `app/api/stripe/subscribe/route.ts` | Subscription checkout (PRO/ENTERPRISE) | ⚠️ Out of sync with pricing page |
| `app/api/stripe/webhook/route.ts` | Webhook handler for subscriptions/refunds | ⚠️ Missing tax, proration, retry logic |
| `app/api/stripe/customer-portal/route.ts` | Stripe Billing Portal redirect | ✅ Exists |
| `app/api/stripe/connect/*` | Creator onboarding | ✅ Exists |

### 2.3 Subscription & Entitlement

| File | Tier Model | Notes |
|------|-----------|-------|
| `lib/monetization.ts` | FREE / PRO / ENTERPRISE | Used by `UpgradeButton`, billing page |
| `lib/subscriptions.ts` | FREE / STARTER / PRO / BUSINESS | Used by pricing page, `PLAN_LIMITS` |
| `lib/billing/entitlements.ts` | FREE / PRO / ENTERPRISE | Central entitlement check, DB-backed overrides |
| `lib/billing/stripe-subscription.ts` | FREE / PRO / ENTERPRISE | Syncs Stripe → `subscriptions` + `feature_entitlements` |
| `app/(protected)/account/billing/page.tsx` | FREE / PRO / ENTERPRISE | UI only shows Pro upgrade |
| `app/(marketing)/pricing/PricingClient.tsx` | FREE / STARTER / PRO / BUSINESS | CTA calls `/api/stripe/checkout` |

**Critical gap:** There is no single source of truth for tiers. The desired model is **FREE / PRO / TEAM / ENTERPRISE**.

### 2.4 Database Schema

**Existing relevant tables:**

- `users` — identity, role.
- `profiles` — public profile.
- `subscriptions` — tier, status, Stripe IDs, period dates.
- `feature_entitlements` — per-user overrides (created by trigger, not in schema.sql).
- `transactions` — purchase/payout/refund ledger.
- `stripe_customers` — Stripe customer mapping.
- `stripe_events` — incoming Stripe webhook events.
- `api_keys` — developer API keys with `rate_limit`.
- `api_usage` — per-API-key usage logging.
- `audit_logs` — action audit trail.
- `workflow_expansions` — AI workflow state.

**Missing tables:**

- `credits` / `credit_transactions` — AI credit ledger.
- `credit_reservations` — reserve/capture/refund lifecycle.
- `usage_events` — AI operation usage tracking.
- `organizations` / `organization_members` — team/enterprise support.
- `organization_credits` — shared credit pools.
- `plan_definitions` — database-driven plan limits.
- `plan_features` — feature entitlement matrix.
- `billing_invoices` / `billing_payment_methods` — embedded billing records.
- `credit_packs` / `credit_adjustments` — purchased/admin credits.

### 2.5 AI Usage & Credit Tracking

- **No credit concept exists.**
- `lib/ai/client.ts` and `lib/ai/gemini.ts` call AI providers without logging.
- `app/api/architect/chat/route.ts` and `app/api/workflows/[id]/expand/route.ts` make AI calls without reservation, capture, or usage storage.
- No per-feature cost mapping.
- No token/model/price tracking.
- No monthly allocation reset.

### 2.6 Rate Limiting

- `lib/api/rate-limit.ts` — simple in-memory token bucket.
- `lib/rate-limit-middleware.ts` — consumes the result but expects `result.success` / `result.reset` while `checkRateLimit` returns `allowed` / `resetAt`. **This is a runtime bug.**
- Limits are hardcoded per tier in `lib/subscriptions.ts`.
- No Redis/distributed store; will not work across Vercel instances.
- No per-feature rate limits.

### 2.7 Checkout Flow

- Public pricing page redirects to Stripe Checkout for paid tiers.
- Account billing page uses `UpgradeButton` → `/api/stripe/subscribe`.
- No saved payment methods, no upgrade/downgrade/cancel/resume, no invoice history.
- No embedded payment form.
- No proration or tax handling.

### 2.8 Feature Flags

- No feature flag system exists.
- Entitlements are hardcoded in TypeScript.

---

## 3. Gaps vs. Requirements

| Requirement | Status | Gap |
|-------------|--------|-----|
| Transaction-based credit billing | ❌ | No credit system |
| Reserve → execute → capture/refund | ❌ | No reservation lifecycle |
| Monthly credit allocation | ❌ | No credits table |
| Purchased credit packs | ❌ | Not implemented |
| Organization credit pools | ❌ | No org model |
| Usage history | ⚠️ | Only `api_usage`, no AI usage |
| Admin adjustments | ❌ | No admin credit UI |
| Fraud detection hooks | ❌ | Not implemented |
| Centralized entitlements | ⚠️ | Partial via `lib/billing/entitlements.ts` |
| Plans: Free / Pro / Team / Enterprise | ❌ | Tiers are inconsistent |
| Embedded billing | ❌ | Hosted checkout only |
| Subscription management | ❌ | Only Stripe portal link |
| Usage tracking per AI op | ❌ | Not implemented |
| Configurable limits | ❌ | Hardcoded in TS |
| Automated billing tests | ❌ | No Playwright billing tests |

---

## 4. Recommendations

1. **Unify tier model** to `FREE | PRO | TEAM | ENTERPRISE` across all files, DB enums, and Stripe metadata.
2. **Add database-driven plan definitions** so limits can be changed without code deploys.
3. **Build a `CreditService`** that handles reservation, capture, refund, and monthly reset.
4. **Add `usage_events` table** for every AI operation with model, provider, duration, status, credits.
5. **Add `organizations` and `organization_members`** for Team/Enterprise shared credits.
6. **Replace hosted checkout with embedded Stripe Elements** for subscriptions and credit packs.
7. **Fix rate-limit middleware** and migrate to Redis/Supabase-backed distributed limits.
8. **Add Playwright tests** for subscription lifecycle, credit reservation/refund, and entitlement enforcement.
9. **Keep existing one-time marketplace purchase flow** intact; extend it with the new billing primitives.

---

## 5. Files to Modify / Create

### Database
- `supabase/migrations/20260703_enterprise_billing_platform.sql`
- `types/database.ts` (regenerate)

### Backend
- `lib/billing/credits.ts` — CreditService
- `lib/billing/usage.ts` — usage tracking helpers
- `lib/billing/plans.ts` — unified plan definitions
- `lib/billing/subscriptions.ts` — subscription lifecycle
- `lib/billing/embedded.ts` — Stripe Elements helpers
- `lib/billing/entitlements.ts` — refactor to use plan definitions
- `lib/rate-limit.ts` — distributed rate limit
- `lib/rate-limit-middleware.ts` — fix interface
- `app/api/billing/*` — embedded billing APIs
- `app/api/usage/track/route.ts` — usage ingestion

### Frontend
- `app/(protected)/account/billing/page.tsx` — embedded billing dashboard
- `components/billing/BillingDashboard.tsx`
- `components/billing/CreditBalance.tsx`
- `components/billing/PlanCard.tsx`
- `components/billing/UsageChart.tsx`

### Tests
- `tests/e2e/billing.spec.ts`
- `tests/e2e/credits.spec.ts`

### Docs
- `memory/checkpoints/enterprise-billing-platform.md`
- `docs/billing.md`
- `TODO.md` updates

---

## 6. Next Step

Proceed to Phase 2: create the detailed construction blueprint and begin database schema implementation.
