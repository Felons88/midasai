# AI Credit Reservation Engine — Phase 1 Implementation

**Date:** 2026-07-03
**Agent:** AGENT 9 (Monetization) + AGENT 1 (Frontend) + AGENT 2 (Database)
**Status:** Core engine complete; key endpoints wired; remaining endpoints tracked

---

## What Was Done

### Database

- Added migration `supabase/migrations/20260703_100006_ai_tool_pricing.sql`
  - `ai_tool_pricing` table with `feature_key`, `reserve_credits`, `unit_label`, `is_active`, `metadata`
  - Seeded all 16 AI tool prices from the executive objective
  - RLS policy for public read of active pricing

### Backend Services

- `lib/billing/pricing.ts`
  - `getActivePricing`, `getPricingByFeatureKey`, `getReserveCredits`, `formatCreditCost`
  - Falls back to seeded defaults if DB lookup fails
- `lib/billing/usage.ts`
  - Extended `UsageFeatureKey` to include all new AI tool keys
  - Updated `trackAI` to:
    - Look up pricing automatically when `estimatedCredits` is omitted
    - Accept `units` for operations priced per-unit (e.g., per file, per round)
    - Accept `completionPct` or `captureAmount` callbacks for partial capture
    - Record `partial` status and completion ratio in `usage_events`
    - Refund unused credits via `CreditService.captureCredits`
- `lib/billing/ai-reservation.ts`
  - `runWithAIReservation` helper for API routes
  - `checkAICredits` for pre-flight entitlement checks
  - Returns credit breakdown in every response

### API Routes Wired

- `/api/ai/generate-description` — wraps `generateListingDescription`, returns cost breakdown
- `/api/ai/generate-tags` — wraps `generateTags`, returns cost breakdown
- `/api/architect/chat` — added auth, wraps chat model fallback loop with `ai_chat` pricing
- `/api/architect/generate` — added auth, reserves `architect_generation` credits per file, streams generation, captures proportionally based on successful files, sends `{ type: "credits" }` event
- `/api/billing/pricing` — new endpoint for frontend to fetch cost for a feature key + units

### Frontend

- `components/billing/CreditCostBadge.tsx` — displays credit cost for a feature key before user clicks generate
- Integrated badge into Architect chat send area (`app/(architect)/architect/ArchitectClient.tsx`)

### Build

- `npm run build` passes
- Regenerated `types/database.ts`

---

## Files Changed

- `supabase/migrations/20260703_100006_ai_tool_pricing.sql`
- `lib/billing/pricing.ts`
- `lib/billing/usage.ts`
- `lib/billing/ai-reservation.ts`
- `app/api/ai/generate-description/route.ts`
- `app/api/ai/generate-tags/route.ts`
- `app/api/architect/chat/route.ts`
- `app/api/architect/generate/route.ts`
- `app/api/billing/pricing/route.ts`
- `components/billing/CreditCostBadge.tsx`
- `app/(architect)/architect/ArchitectClient.tsx`
- `types/database.ts`
- `TODO.md`

---

## Remaining Work

- Wire workflow expansion (`/api/workflows/[id]/expand`) to reservation engine
- Wire AI search, marketplace AI summary, prompt analysis/categorization endpoints
- Wire project intelligence, GitHub repo analysis, code review, optimization, debugging, deployment assistant
- Add `CreditCostBadge` to all AI generate buttons in the UI
- Add post-operation credit breakdown toast/modal
- Real-time balance update after AI operations
- Add E2E + unit tests for reservation, capture, refund, insufficient credits, concurrency

---

## Notes

- Architect `/api/architect/chat` previously had no authentication; auth was added as part of this work.
- All AI operations now require a successful credit reservation before execution.
- Unused credits are automatically refunded based on completion/success ratio.
