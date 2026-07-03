# Enterprise Growth, Monetization & Upgrade Experience Platform

## Executive Summary

Build a complete user-lifecycle and monetization system that guides MidasAI users from Free → Pro → Team → Enterprise through excellent product design, not intrusive popups.

The system integrates with:
- Existing billing/credit schema (Phase 1 complete)
- Subscription conversion flow
- AI Credit Engine
- Recommendation Engine
- Analytics Platform
- Notification Center
- Dashboard / Sidebar / AI Studio / Architect

---

## Phase 1 — Repository Audit (Complete)

Audited systems:

| System | Status | Placement Notes |
|--------|--------|-----------------|
| Auth / session | ✅ | Supabase SSR, `AuthenticatedShell` wraps all protected routes |
| Dashboard | ✅ | Server page loads plan, usage, stats; `DashboardClient` renders cards + priorities |
| Navigation | ✅ | `AppSidebar` (240px) + `TopBar` (notifications, profile); credit widget belongs in sidebar + top bar |
| AI Credit Engine | ✅ | `lib/billing/credits.ts`, `lib/billing/usage.ts`, `credit_balances` table |
| Subscription / Billing | ✅ | `plan_definitions`, `plan_features`, `subscriptions`, `/account/billing`, `/pricing` |
| Analytics | ✅ | `lib/analytics.ts` + `/api/analytics/event` |
| Recommendation Engine | ✅ | `lib/recommendations/` exists |
| Notifications | ✅ | `NotificationProvider`, `NotificationBell`, `NotificationToastStack`, `notifications` table |
| Frontend Layout | ✅ | Dark luxury design, `design.md` canonical, CTA `#CA8A04` |
| Backend Services | ✅ | Supabase + Next.js API routes, Stripe webhooks |

Natural placement rules:
- **Credit widget**: `AppSidebar` footer (persistent) + `TopBar` pill (quick glance) + AI tool pages (contextual)
- **Upgrade triggers**: dashboard priority cards, usage bars at 75/90/100%, locked feature overlays, billing page
- **Upgrade presentations**: toast at natural stopping points, sidebar recommendation card, dashboard priority card, drawer/modal for plan comparison
- **Dismissal persistence**: `dismissed_prompts` table (new)
- **Analytics**: reuse existing `trackEvent` + new events for upgrade/credit lifecycle
- **Notifications**: use existing notification system for billing/credit alerts

---

## Phase 2 — Agent Assignment

| Agent | Scope | Deliverables |
|-------|-------|--------------|
| AGENT 2 (Database) | Schema extensions | `dismissed_prompts`, `upgrade_events`, `reward_history`, `organization_wallets`, `usage_predictions`, `analytics_events` table, indexes |
| AGENT 2 (Backend) | Credit/refund/forecast service | `lib/billing/forecast.ts`, `lib/billing/rewards.ts`, `lib/billing/recommendations.ts`, `lib/billing/wallet.ts` |
| AGENT 1 (Frontend) | Credit widget + shell integration | `components/billing/CreditWidget.tsx`, sidebar + top bar integration, real-time updates |
| AGENT 1 (Frontend) | Upgrade experiences | `components/billing/UpgradeCard.tsx`, `PlanComparisonDrawer`, `FeatureLockOverlay`, `UsageBanner`, `DismissalProvider` |
| AGENT 5 (Edge) | Reward scheduler | Edge function for daily login streaks, monthly credit reset, reward distribution |
| AGENT 6 (User/Creator) | Wallet + organization pages | `app/(protected)/account/wallet/page.tsx`, `app/(protected)/account/team/page.tsx` |
| AGENT 9 (Monetization) | Checkout + credit packs | `/api/stripe/credits/checkout`, webhook credit pack fulfillment, credit pack UI |
| AGENT 10 (Analytics) | Event tracking | Extend `lib/analytics.ts` with upgrade/credit events, create `/api/analytics/events` batch endpoint |
| AGENT 12 (Security) | RLS + rate limits | Review new RLS policies, ensure `usage_events` and `credit_transactions` are insert-only for users |
| AGENT 13 (Docs) | Documentation | Update `design.md`, `memory/project-state.md`, checkpoint, `TODO.md` |

---

## Phase 3 — AI Credit Awareness System

### Credit Widget

Display:
- Current Credits
- Monthly Allocation
- Credits Reserved
- Credits Refunded
- Credits Purchased
- Credits Remaining
- Reset Date
- Estimated Days Remaining
- Current Plan

**Placement**:
1. `AppSidebar` footer — persistent, collapsed-friendly
2. `TopBar` credit pill — quick glance
3. AI tool pages (`/architect`, `/ai/*`) — contextual header widget
4. Dashboard — usage card

**Real-time updates**: Supabase Realtime on `credit_balances` + `credit_reservations` (or polling fallback). Start with a `CreditWidget` that fetches on mount and uses a lightweight 30s polling hook.

### API

- `GET /api/billing/credits` — current balance, reservations, reset date
- `GET /api/billing/credits/forecast` — days remaining, recommended plan

---

## Phase 4 — Intelligent Upgrade System

Triggers stored in `upgrade_events` table:

| Trigger | Threshold | Presentation | Dismissal |
|---------|-----------|--------------|-----------|
| 75% usage | any usage metric ≥ 75% | subtle sidebar card | 7 days |
| 90% usage | any usage metric ≥ 90% | top-of-page banner | 3 days |
| 95% usage | any usage metric ≥ 95% | prominent banner + toast after workflow | 1 day |
| 100% usage | any usage metric ≥ 100% | feature lock overlay | never dismiss without upgrade |
| Feature locked | `checkFeature` returns false | feature lock overlay | per feature |
| Subscription expiring | ≤ 7 days left | sidebar card + notification | once per period |
| Payment failed | Stripe webhook | notification + banner | persistent until fixed |
| Low credits | credits ≤ 20% of monthly | top bar pulse + sidebar | 1 day |
| Heavy AI usage | > 50% monthly credits in 7 days | dashboard insight card | 7 days |
| Frequent workflows | > 10 expansions in 7 days | Pro upsell | 7 days |
| Large project creation | > 50 files | Team upsell | 7 days |
| GitHub import usage | > 5 imports | Pro upsell | 7 days |
| Repository analysis | > 3 analyses | Pro upsell | 7 days |
| Architect usage | > 10 prompts | Pro upsell | 7 days |

**Rules**:
- Never interrupt active workflows
- Only show at natural stopping points (after operation completes, on dashboard, on navigation pause)
- Track dismissals in `dismissed_prompts` (user_id, prompt_key, dismissed_at, expires_at)
- Cap total daily prompts per user (max 2)

---

## Phase 5 — Upgrade Experiences

Components to build:

1. `UpgradeToast` — small, auto-dismiss, appears after credit refund or usage milestone
2. `UpgradeSidebarCard` — persistent recommendation in `AppSidebar`
3. `DashboardUpgradeCard` — priority card on `/dashboard`
4. `UsageBanner` — top-of-page banner at 90/95/100% usage
5. `BottomDrawer` — plan comparison on mobile
6. `PlanComparisonModal` — premium plan comparison triggered from CTA
7. `FeatureLockOverlay` — replaces disabled buttons with benefits + CTA
8. `SettingsReminder` — billing/settings reminder badges

---

## Phase 6 — Feature Lock Experience

`FeatureLockOverlay` content:
- Feature name + description
- 3 bullet benefits
- Productivity improvement estimate
- Plan comparison mini-table
- "Upgrade" CTA
- "Maybe Later" / "Learn More"

Used in:
- AI upload (`can_use_ai_upload`)
- Custom domain (`can_use_custom_domain`)
- Creator verification (`can_verify_creator`)
- Featured listings (`featured_listings` limit)
- Team members (`team_members`)

---

## Phase 7 — Usage Forecast

Build `lib/billing/forecast.ts`:

- `estimateDaysRemaining(balance, dailyUsage)`
- `recommendedPlan(dailyUsage, featuresUsed)`
- `expectedMonthlyUsage(history)`
- `potentialSavings(currentPlan, recommendedPlan)`

Display on:
- Dashboard usage card
- `/account/billing`
- `/account/wallet`
- `/architect` header
- AI Studio sidebar

---

## Phase 8 — Credit Refund Experience

When `usage.trackAI` completes, show refund summary:
- Credits Reserved
- Credits Used
- Credits Refunded
- Reason
- Status (Full Success / Partial / Full Refund)

Use a `CreditRefundToast` component shown after the operation finishes.

---

## Phase 9 — Usage Wallet

Page: `/account/wallet`

Sections:
- Balance summary (monthly, purchased, bonus, refunded, used, reserved)
- Pending operations
- Transaction history (search, filter by type)
- Feature usage chart
- Project usage
- Daily/Monthly usage
- Top AI features
- Most expensive operations
- Average AI cost
- Estimated monthly usage

---

## Phase 10 — Plan Comparison

Page: `/pricing` (enhanced) + drawer/modal

Compare Free/Pro/Team/Enterprise across:
- Credits
- Features
- Limits
- Performance
- Priority queue
- Projects, AI Studio, Architect, Marketplace, GitHub Import, Recommendations, Project Intelligence, IDE integrations, Deployment, Analytics, Organizations

---

## Phase 11 — Dashboard Integration

Dashboard additions:
- Credit widget card
- Usage forecast card
- Upgrade recommendation card
- Recent AI usage summary
- Plan comparison teaser

Sidebar additions:
- Credit widget footer
- Upgrade recommendation card

AI Studio / Architect:
- Contextual credit widget in header
- Post-operation refund toast

---

## Phase 12 — Analytics

New events in `lib/analytics.ts`:
- `upgrade_viewed`
- `upgrade_dismissed`
- `upgrade_accepted`
- `credits_depleted`
- `credits_refunded`
- `feature_locked`
- `usage_milestone_reached`
- `plan_changed`
- `payment_failed`
- `payment_recovered`
- `subscription_renewed`
- `referral_completed`
- `daily_login_reward_claimed`

Create `/api/analytics/events` batch endpoint for reliability.

---

## Phase 13 — Reward Systems

Programs:
- Daily login credits (1 pack day 1, increasing to 7)
- Weekly streak bonus
- Monthly streak bonus
- Referral credits (referrer + referee)
- Creator credits (first listing, 100 downloads, 5-star review)
- Community rewards (featured contribution)
- Achievement credits (early adopter, power user)
- Bonus promotions (campaigns)
- Admin grants

All flow through `createCreditService().addBonusCredits()`.

---

## Phase 14 — Credit Packs

Packs:
- Small (500 credits)
- Medium (2,500 credits)
- Large (10,000 credits)
- Enterprise (50,000 credits)

Stripe price IDs stored in `credit_packs.stripe_price_id`.
Purchase flow: `/api/stripe/credits/checkout` → Stripe Checkout → webhook fulfills `credit_transactions` + `credit_balances`.

---

## Phase 15 — Team Credit Pools

Organization table `organization_credits` already exists.

Build:
- Organization wallet page
- Member usage breakdown
- Project usage breakdown
- Department usage (via metadata)
- Admin adjustments
- Alerts when org balance < 20%
- Approval workflows (future)

---

## Phase 16 — Recommendation Engine

Build `lib/billing/recommendations.ts`:
- Score usage patterns (feature usage, project size, AI consumption, search frequency, workflows, architect, marketplace, team collaboration)
- Return ranked plan recommendation
- Trigger upgrade prompt when score > threshold

---

## Phase 17 — Frontend Polish

Follow `design.md`:
- Dark luxury, gold CTA
- Premium animations via `framer-motion` (if available) or CSS transitions
- Responsive (sidebar collapses, mobile drawer)
- Accessible focus rings, ARIA labels
- Loading skeletons, empty states, error states

---

## Phase 18 — Backend Platform

Services:
- `CreditService` ✅
- `UsageService` ✅
- `EntitlementService` ✅
- `RateLimiter` ✅
- `RecommendationService` (new)
- `NotificationService` (use existing)
- `BillingService` (extend existing)
- `AnalyticsService` (extend existing)
- `PromotionService` (new)
- `RewardService` (new)
- `ReferralService` (new)
- `WalletService` (new)
- `TransactionService` (new)
- `AuditService` (new)

---

## Phase 19 — Database

New tables:
- `dismissed_prompts` (user_id, prompt_key, dismissed_at, expires_at, metadata)
- `upgrade_events` (user_id, event_type, trigger, plan_recommended, shown, dismissed, converted)
- `reward_history` (user_id, reward_program_id, amount, reason)
- `reward_programs` (key, name, rules, is_active)
- `usage_predictions` (user_id, prediction_type, value, generated_at)
- `plan_recommendations` (user_id, recommended_plan, score, reasons, generated_at)
- `organization_wallets` (organization_id, total_credits, metadata)
- `referral_rewards` (referrer_id, referee_id, status, amount, source)
- `analytics_events` (session_id, user_id, event, properties, created_at)
- `credit_refunds` (reservation_id, user_id, amount, reason, status)
- `promotion_campaigns` (code, name, credits, valid_from, valid_to, max_uses)
- `feature_usage_summary` (user_id, feature_key, period, count, credits, updated_at)

---

## Phase 20 — Testing

Tests:
- Unit: credit reservation/capture/refund, entitlement calculation, usage forecast
- API: subscription checkout, credit pack checkout, webhook fulfillment
- E2E: upgrade flow, feature lock overlay, credit widget update, dismissal persistence
- A11y: keyboard navigation, focus traps, screen reader labels
- Performance: bundle size, API latency
- Security: RLS, credit mutation authorization

---

## Implementation Order

1. **Foundation** (this session)
   - Schema: `dismissed_prompts`, `upgrade_events`, `feature_usage_summary`
   - Services: `forecast`, `recommendations`, `rewards`, `wallet`
   - Component: `CreditWidget`, `DismissalProvider`
   - Integration: sidebar + top bar + dashboard
2. **Upgrade triggers** (next session)
   - `UsageBanner`, `UpgradeSidebarCard`, `UpgradeToast`
   - Trigger detection backend + API
3. **Feature lock + plan comparison**
4. **Wallet page + refund UX**
5. **Credit packs + reward system**
6. **Team/organization wallet**
7. **Analytics + testing**

---

## Exit Criteria

- User always knows credit status without searching
- Upgrade prompts only appear at natural stopping points
- Dismissed prompts stay dismissed for configured period
- Feature lock explains value and provides clear CTA
- Wallet gives full transaction history
- Analytics capture every conversion event
- Build passes, E2E smoke passes, RLS policies secure
