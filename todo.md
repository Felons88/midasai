# Enterprise Billing, Credit Engine & Subscription Platform

## Phase 1: Database Schema
- [x] Add TEAM tier to subscription_tier_enum
- [x] Create plan_definitions, plan_features tables
- [x] Create organizations, organization_members tables
- [x] Create credit_balances, credit_transactions, credit_reservations tables
- [x] Create organization_credits table
- [x] Create usage_events table
- [x] Create billing_invoices, credit_packs, credit_adjustments tables
- [x] Seed default plans and credit packs
- [x] Add RLS policies
- [x] Regenerate types/database.ts

## Phase 2: Plan & Entitlement Services
- [x] Build lib/billing/plans.ts
- [x] Build lib/billing/credits.ts
- [x] Refactor lib/billing/entitlements.ts to use plan_definitions
- [x] Update lib/subscriptions.ts to new tier model
- [x] Update lib/billing/stripe-subscription.ts to sync plan features and credits

## Phase 3: UI & Checkout
- [x] Update PricingClient to new tier model
- [x] Update account billing page to new tier model
- [x] Update UpgradeButton to accept TEAM
- [x] Update /api/stripe/subscribe to use plan definitions
- [ ] Update /api/stripe/checkout to use plan definitions
- [ ] Build embedded billing components (Stripe Elements)
- [ ] Build credit purchase UI
- [ ] Add organization creation UI

## Phase 4: AI Credit Integration
- [x] Build lib/billing/usage.ts
- [ ] Wrap AI chat with credit tracking
- [ ] Wrap architect chat with credit tracking
- [ ] Wrap workflow expansion with credit tracking
- [ ] Charge credits based on model/token usage

## Phase 5: Distributed Rate Limiting
- [x] Create rate_limit_buckets table
- [x] Create check_rate_limit_bucket RPC
- [x] Rewrite lib/rate-limit.ts for distributed rate limiting
- [x] Update middleware to use correct rate limiter

## Phase 6: Webhook & Invoice Sync
- [ ] Update webhook handler to handle credit pack purchases
- [ ] Create invoice mirror on payment succeeded
- [ ] Handle subscription cancellations/downgrades
- [ ] Create organization subscription sync

## Phase 7: Admin & Reporting
- [ ] Admin credit adjustment UI
- [ ] Admin plan feature editor
- [ ] Usage analytics dashboard
- [ ] Organization admin panel

# MidasAI Workflow Inspection Fixes - Step-by-Step Plan

## Phase 1: Enable Workflow Inspector Access
- [x] Update WorkshopClient.tsx to allow clicks on PROCESSING_AI workflows
- [x] Add expand button always visible for active workflows
- [x] Add hover/touch indicators for better UX
- [x] Update toast/error handling for blocked clicks
- [ ] Add expand button accessibility via keyboard

## Phase 2: API Layer Repair
- [ ] Fix backend API route authentication and error handling
- [ ] Resolve syntax errors in expand route
- [ ] Ensure proper status transitions for PROCESSING_AI
- [ ] Add missing analyze endpoint if needed
- [ ] Add robust error logging

## Phase 3: Conversation Memory Integration
- [ ] Implement database schema for conversation persistence
- [ ] Update API routes to read/write conversation history
- [ ] Add loading logic in ExpandOverlay for existing history
- [ ] Save user messages to backend
- [ ] Restore conversation history on re-opening overlay

## Phase 4: ExpandOverlay Enhancements
- [ ] Allow user to input guidance messages
- [ ] Improve loading state management
- [ ] Add visual feedback for analysis progress
- [ ] Enhance error display with retry options
- [ ] Optimize performance for large conversations

## Phase 5: Full Integration Testing
- [ ] Test end-to-end workflow:
  - Click PROCESSING_AI workflow
  - Open inspector
  - View conversation history
  - Send guidance message
  - Continue with suggestions
  - Generate final files
- [ ] Validate authentication flows
- [ ] Check mobile responsiveness
- [ ] Verify performance metrics

---

# GitHub Discovery & Prompt Import Pipeline

## Phase 1: Audit
- [x] Read AGENTS.md, project-state, architecture docs
- [x] Audit existing ingestion (ClawHub, SkillsMP), categorization, search, GitHub scan
- [x] Audit database schema and identify missing tables

## Phase 2: Blueprint
- [x] Create architecture blueprint at `plans/github-discovery-pipeline.md`
- [x] Assign agent ownership for each subsystem

## Phase 3: Database Schema
- [x] Create migration with discovery queries, jobs, repositories, versions, classifications, import queue, analytics
- [x] Add missing `categorization_jobs` table
- [x] Add indexes, triggers, RLS policies
- [x] Regenerate `types/database.ts`

## Phase 4: GitHub Discovery Service
- [x] Build `lib/discovery/github.ts` with GitHub Search API, metadata extraction, README fetch
- [x] Implement rate-limit handling and retries
- [x] Create API routes: `/api/admin/discovery/queries`, `/api/admin/discovery/jobs`

## Phase 5: Classification & Import Pipeline
- [x] Build `lib/discovery/classify.ts` using Gemini
- [x] Create `/api/admin/discovery/classify` route
- [x] Queue newly discovered repos into `import_queue`

## Phase 6: Review Queue
- [x] Create `/api/admin/discovery/queue` route
- [x] Support approve/reject/archive actions

## Phase 7: Search Index
- [x] Auto-refresh `listings.search_vector` after approved imports (existing trigger handles it)
- [ ] Add discovery search filters to public search (future enhancement)

## Phase 8: Admin Frontend
- [x] Add Discovery to admin nav
- [x] Create `/felon-admin/discovery` dashboard with queries, jobs, repos, queue

## Phase 9: Scheduler
- [x] Edge function for scheduled discovery
- [x] pg_cron job running every hour
- [x] Track API rate limits and analytics in `discovery_analytics`

## Phase 10: Validation
- [x] `npm run build` passes
- [ ] Test discovery run against real GitHub API
- [ ] Test classification and review workflow
- [x] Update documentation and project memory