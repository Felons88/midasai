# Enterprise Billing, Credit Engine & Subscription Platform — Implementation Blueprint

> **Owner:** AGENT 0 (PM) + AGENT 9 (Monetization) + AGENT 2 (Database) + AGENT 1 (Frontend) + AGENT 7 (QA) + AGENT 12 (Security) + AGENT 13 (Docs)
> **Cycle:** 18 — Enterprise Billing Platform
> **Date:** 2026-07-03

---

## 0. Objective

Build the financial foundation of MidasAI:

- Unified plans: **FREE / PRO / TEAM / ENTERPRISE**
- Transaction-based AI **credit engine** with reserve → capture → refund lifecycle.
- Centralized **entitlement service** driven by database plan definitions.
- **Embedded billing** (Stripe Elements) for subscriptions, upgrades, credit packs.
- **Usage tracking** for every AI operation.
- **Distributed rate limiting** per feature and per plan.
- Automated **Playwright tests** for the full billing lifecycle.

---

## 1. Dependency Graph

```
Step 1 ─┬─ Step 2 ─┬─ Step 3 ─┬─ Step 4 ─┬─ Step 5 ─┬─ Step 6
        │            │            │            │            │
        │            │            │            │            └─ Step 7
        │            │            │            └─ Step 8
        │            │            └─ Step 9
        │            └─ Step 10
        └─ Step 11
```

- **Step 1** (schema) is required by everything.
- **Step 2** (plan config) is required by entitlement, credit, and rate-limit steps.
- **Step 3** (credit service) is required by usage tracking and AI routes.
- **Step 4** (entitlement service) is required by UI/API enforcement.
- **Step 5** (embedded billing backend) is required by billing UI.
- **Step 6** (billing UI) is required by tests.
- **Step 7** (tests) depends on Steps 1-6.
- **Step 8** (rate limit) is independent of UI but needs plan config.
- **Step 9** (AI route integration) depends on credit service + entitlement service.
- **Step 10** (docs/memory) depends on all prior steps.
- **Step 11** (security/RLS review) depends on schema.

---

## 2. Step-by-Step Plan

### Step 1 — Database Schema (AGENT 2)

**Context brief:** Create the unified billing foundation in Supabase. This is the first step; every other step depends on it.

**Tasks:**
1. Create migration `supabase/migrations/20260703_enterprise_billing_platform.sql`.
2. Update `subscription_tier_enum` to `FREE | PRO | TEAM | ENTERPRISE`.
3. Add tables:
   - `plan_definitions` (plan_id, name, price_monthly, price_yearly, limits JSONB)
   - `plan_features` (plan_id, feature_key, enabled, limit, metadata)
   - `credit_balances` (user_id, monthly_credits, purchased_credits, total_used, reset_at)
   - `credit_transactions` (id, user_id, type, amount, status, reference_id, metadata)
   - `credit_reservations` (id, user_id, operation_id, amount, status, expires_at)
   - `usage_events` (id, user_id, org_id, feature, model, provider, credits_reserved, credits_charged, credits_refunded, duration_ms, status)
   - `organizations` (id, name, owner_id, plan_id, billing_email)
   - `organization_members` (org_id, user_id, role)
   - `organization_credits` (org_id, balance, monthly_credits, reset_at)
   - `billing_invoices` (id, user_id, org_id, stripe_invoice_id, status, amount, period_start, period_end)
   - `credit_adjustments` (id, user_id/org_id, amount, reason, admin_id)
4. Update `feature_entitlements` table to reference `plan_definitions`.
5. Add RLS policies to all new tables.
6. Add indexes on `user_id`, `org_id`, `created_at`, `operation_id`, `status`.
7. Add trigger to reset monthly credits on first of month.
8. Regenerate `types/database.ts`.

**Verification:**
- `npx supabase migration up` (or apply via MCP)
- `npm run build` after type regen

**Exit criteria:**
- Migration applies cleanly.
- Generated types include all new tables.
- Supabase advisors show no security warnings.

---

### Step 2 — Plan Configuration System (AGENT 2 + AGENT 9)

**Context brief:** Move plan limits from hardcoded TypeScript to database-driven configuration. Existing `lib/subscriptions.ts` and `lib/monetization.ts` will be deprecated and replaced by `lib/billing/plans.ts`.

**Tasks:**
1. Create `lib/billing/plans.ts`:
   - `PlanTier` enum: `FREE | PRO | TEAM | ENTERPRISE`
   - `getPlanDefinitions()` — fetch from `plan_definitions` + `plan_features`
   - `getPlanLimits(tier)` — returns resolved limits
   - `seedPlanDefinitions()` — idempotent seed for default plans
2. Create `app/api/admin/billing/plans/route.ts` — CRUD for admin plan management.
3. Create `app/api/billing/plans/route.ts` — public plan listing.
4. Update `.env.example` with new Stripe price IDs for TEAM.

**Verification:**
- `npm run build`
- Seed function runs without errors

**Exit criteria:**
- `getPlanLimits('PRO')` returns real data from DB.
- All four tiers are seeded.

---

### Step 3 — Credit Service (AGENT 9)

**Context brief:** Build the transaction-based credit engine. No page or API should implement credit logic directly.

**Tasks:**
1. Create `lib/billing/credits.ts` with:
   - `reserveCredits(userId, operationId, amount, ttlMs)` → returns reservationId
   - `captureCredits(reservationId, actualAmount)`
   - `releaseCredits(reservationId)` — full refund
   - `refundCredits(reservationId, amount)` — partial refund
   - `getCreditBalance(userId)`
   - `allocateMonthlyCredits(userId, tier)` — called on subscription update/renewal
   - `addPurchasedCredits(userId, amount, referenceId)`
   - `addOrganizationCredits(orgId, amount, referenceId)`
2. Create `lib/billing/credits.test.ts` (unit tests) for reservation lifecycle.
3. Ensure all credit changes are immutable rows in `credit_transactions`.

**Verification:**
- `npm run build`
- Unit tests pass

**Exit criteria:**
- Reserve/capture/refund flow works with real Supabase queries.
- Balance is consistent after partial refund.

---

### Step 4 — Entitlement Service (AGENT 9)

**Context brief:** Centralize all feature checks. Refactor `lib/billing/entitlements.ts` to use `plan_definitions` and `plan_features`.

**Tasks:**
1. Refactor `lib/billing/entitlements.ts`:
   - `resolveUserTier(supabase, userId)` — use `subscriptions` + `feature_entitlements`
   - `getEntitlement(supabase, userId, featureKey)` — returns `{ allowed, limit, used, remaining }`
   - `checkFeature(supabase, userId, featureKey)` — throws or returns denial reason
   - `getOrganizationEntitlement(supabase, orgId, featureKey)`
2. Add helper `canUseFeature(userId, featureKey)` for server components.
3. Update `app/api/billing/entitlements/route.ts` to return resolved features.

**Verification:**
- `npm run build`

**Exit criteria:**
- No hardcoded plan checks outside this service.
- `checkFeature` respects plan overrides and admin adjustments.

---

### Step 5 — Embedded Billing Backend (AGENT 9 + AGENT 2)

**Context brief:** Replace hosted checkout with embedded Stripe experiences. Keep `/api/stripe/checkout` for backward compatibility but add new endpoints.

**Tasks:**
1. Create `lib/billing/embedded.ts`:
   - `createSetupIntent(userId)` — for saving payment methods
   - `getPaymentMethods(userId)` — list Stripe payment methods
   - `createSubscriptionIntent(userId, tier, interval)` — returns client_secret
   - `updateSubscription(userId, newTier)` — upgrade/downgrade with proration
   - `cancelSubscription(userId)` — cancel at period end
   - `resumeSubscription(userId)` — undo cancellation
   - `getInvoiceHistory(userId)`
2. Create `app/api/billing/*` routes:
   - `setup-intent` — POST
   - `payment-methods` — GET/DELETE
   - `subscribe-embedded` — POST
   - `subscription` — GET/PUT/DELETE
   - `invoices` — GET
   - `credit-packs` — GET/POST (purchase credits)
3. Update `app/api/stripe/webhook/route.ts` to handle:
   - `invoice.paid` / `invoice.payment_failed`
   - `customer.subscription.updated` / `.deleted`
   - `payment_intent.succeeded` for credit packs
   - Idempotency via `stripe_events` table

**Verification:**
- `npm run build`

**Exit criteria:**
- All new billing APIs return typed responses.
- Webhook handler updates subscription status and credits.

---

### Step 6 — Embedded Billing UI (AGENT 1 + AGENT 9)

**Context brief:** Build a premium dark billing dashboard inside `/account/billing` using Stripe Elements and the design system.

**Tasks:**
1. Create components:
   - `components/billing/BillingDashboard.tsx` — shell
   - `components/billing/PlanCard.tsx` — current plan with usage
   - `components/billing/CreditBalance.tsx` — credit balance + history
   - `components/billing/UsageChart.tsx` — usage over time
   - `components/billing/PaymentMethodForm.tsx` — Stripe Elements setup
   - `components/billing/InvoiceList.tsx`
   - `components/billing/CreditPackSelector.tsx`
2. Refactor `app/(protected)/account/billing/page.tsx` to use the new dashboard.
3. Update `app/(marketing)/pricing/PricingClient.tsx` to use embedded checkout flow (redirect to billing page after login for paid tiers).
4. Add loading, empty, and error states.

**Verification:**
- `npm run build`

**Exit criteria:**
- Billing page renders with real data.
- Stripe Elements form loads without errors.
- Plan selection CTA works.

---

### Step 7 — Automated Billing Tests (AGENT 7)

**Context brief:** Validate the full billing lifecycle end-to-end.

**Tasks:**
1. Create `tests/e2e/billing.spec.ts`:
   - New subscription
   - Upgrade
   - Downgrade
   - Cancellation
   - Renewal simulation
   - Failed payment
   - Webhook verification
   - Credit allocation
   - Partial refund
   - Full refund
   - Entitlement enforcement
   - Usage enforcement
   - Monthly reset
2. Use Stripe test clock for time-sensitive tests.
3. Add webhook signature helper for local tests.

**Verification:**
- `npx playwright test tests/e2e/billing.spec.ts`

**Exit criteria:**
- All billing tests pass.

---

### Step 8 — Distributed Rate Limiting (AGENT 12 + AGENT 2)

**Context brief:** Fix the current rate-limit bug and make it production-ready.

**Tasks:**
1. Fix `lib/rate-limit-middleware.ts` to match `lib/api/rate-limit.ts` interface.
2. Create `lib/rate-limit-distributed.ts` using Supabase as fallback (or Redis if configured):
   - Per-feature buckets: `auth`, `search`, `ai_chat`, `architect`, `workflow`, `import`, `upload`, `checkout`, `billing`, `admin`
   - Limits configurable per plan in `plan_features`.
3. Create `app/api/rate-limit/check/route.ts` for client-side limit checks.
4. Apply rate limits to key API routes.

**Verification:**
- `npm run build`

**Exit criteria:**
- Rate limit middleware returns correct headers.
- Limits are configurable by plan.

---

### Step 9 — AI Route Credit Integration (AGENT 4 + AGENT 9)

**Context brief:** Every AI feature must consume credits through the centralized service.

**Tasks:**
1. Update `lib/ai/client.ts` to accept `operationId` and `featureKey`.
2. Create `lib/ai/with-credits.ts` wrapper:
   - Reserve credits before AI call
   - Track duration, provider, model
   - Capture/refund based on success/failure
3. Update AI routes:
   - `app/api/architect/chat/route.ts`
   - `app/api/workflows/[id]/expand/route.ts`
   - `app/api/ai/generate-description/route.ts`
   - `app/api/ai/generate-tags/route.ts`
   - `app/api/github/scan/route.ts`
   - `lib/discovery/classify.ts`
4. Add `usage_events` insertion in each AI call.

**Verification:**
- `npm run build`

**Exit criteria:**
- Every AI operation creates a `usage_events` row.
- Credits are reserved before and captured/refunded after.

---

### Step 10 — Documentation & Memory (AGENT 13)

**Context brief:** Keep docs and memory synchronized with implementation.

**Tasks:**
1. Update `memory/project-state.md`:
   - New cycle 18
   - Billing platform status
   - New tables and APIs
2. Update `TODO.md` with billing tasks and mark completed phases.
3. Create `docs/billing.md` with architecture and API reference.
4. Create `memory/checkpoints/enterprise-billing-platform.md` final checkpoint.

**Verification:**
- Docs are consistent with code.

**Exit criteria:**
- `docs/billing.md` covers credit flow, subscription lifecycle, and API surface.

---

### Step 11 — Security & RLS Review (AGENT 12)

**Context brief:** Ensure the billing system is secure by default.

**Tasks:**
1. Review RLS policies for all new tables.
2. Ensure service-role keys are never exposed client-side.
3. Verify webhook signature verification.
4. Add idempotency checks for Stripe events.
5. Run `mcp3_get_advisors` for security notices.

**Verification:**
- Supabase security advisors pass.

**Exit criteria:**
- No high-severity security warnings.

---

## 3. Rollback Strategy

- Each step is committed independently.
- If a step fails, revert its migration via `npx supabase migration repair` or down-file.
- Keep legacy `lib/subscriptions.ts` and `lib/monetization.ts` until Step 4 is complete, then deprecate.
- Stripe test mode remains default; live keys are only configured after tests pass.

---

## 4. Definition of Done

- [ ] Schema applied and types regenerated.
- [ ] All four tiers (`FREE/PRO/TEAM/ENTERPRISE`) consistent across code.
- [ ] Credit reserve/capture/refund tested and working.
- [ ] Entitlement checks centralized.
- [ ] Embedded billing UI functional.
- [ ] Subscription lifecycle (upgrade/downgrade/cancel/resume) works.
- [ ] Usage tracking records every AI operation.
- [ ] Rate limits configurable per plan.
- [ ] Playwright billing tests pass.
- [ ] Build passes, docs updated, memory updated.

---

## 5. Current Status

- Phase 1 audit complete.
- Ready to begin Step 1.
