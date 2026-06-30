# AGENTS.md

# MidasAI Agent Organization

All agents MUST read this file before beginning work.

---

# Mission

Build MidasAI into the world's best marketplace and discovery platform for:

* Claude Skills
* Claude Code Skills
* Cursor Rules
* Windsurf Workflows
* GitHub Copilot Resources
* MCP Servers
* AI Agents
* Prompt Packs
* Templates
* Automations

This is a production SaaS platform.

Not a demo.

Not a prototype.

Not a mockup.

Every contribution should move the platform toward production readiness.

---

# Required Startup Sequence

Before any work begins:

1. Pull latest GitHub changes.
2. Read CLAUDE.md.
3. Read PROJECT_CONTEXT.md.
4. Read AGENT_HANDOFF.md.
5. Read memory/project-state.md.
6. Read latest checkpoint files.
7. Review recent commits.
8. Review open TODOs.

Do not begin implementation until repository state is understood.

---

# Global Rules

All agents must:

* Avoid duplicate implementations.
* Avoid duplicate components.
* Avoid duplicate database structures.
* Reuse existing systems whenever possible.
* Prefer extension over replacement.
* Use TypeScript.
* Follow existing architecture.
* Keep code production-ready.

Never:

* Leave mock data.
* Leave placeholder functionality.
* Leave broken pages.
* Introduce fake APIs.
* Introduce fake integrations.

---

# Git Workflow

Before coding:

```bash
git pull
```

After significant work:

```bash
git add .
git commit -m "[AGENT-X] Description"
git push origin <branch>
```

Requirements:

* Push frequently.
* Keep commits focused.
* Ensure code builds.
* Ensure type checks pass.

GitHub is the source of truth.

---

# Memory Requirements

Every agent must update:

memory/project-state.md

After major milestones create:

memory/checkpoints/checkpoint-<name>.md

Include:

* work completed
* files modified
* blockers
* next tasks
* recommendations

---

# Agent Ownership

## AGENT 0 — PROJECT MANAGER / ORCHESTRATOR

Purpose:

**Single decision-maker.** Coordinates all agents, owns cycle plans, resolves conflicts, and ships toward 100% production readiness with minimal human input.

Responsibilities:

* Read all commits and checkpoints
* Update `memory/project-state.md` after every cycle
* Detect duplicate work and merge conflicts
* Assign cycle priorities to subagents
* Run test + review loop after each phase
* Maintain `design.md` as UI source of truth
* Decide when to escalate blockers (MCP auth, secrets, Stripe keys)

Does not build major features unless blocking — delegates to owned agents.

**DDL policy:** Prefer Supabase MCP → fallback `npx supabase db query --linked` → fallback PAT in `.cursor/mcp.json`.

---

## AGENT 1 — FRONTEND / UI / UX

Ownership:

* Homepage
* Landing pages
* Marketplace UI
* Navigation
* Design System
* Mobile Experience
* Animations
* Components

Requirements:

* Use ui-ux-pro-max when available.
* Premium dark luxury design.
* No generic SaaS templates.
* No placeholder layouts.

Responsible for:

* Visual consistency
* Responsive design
* Accessibility

---

## AGENT 2 — DATABASE & BACKEND

Ownership:

* Supabase
* PostgreSQL
* Schema
* Migrations
* Auth
* RBAC
* RLS
* API Architecture

Responsibilities:

* Unified listing architecture
* Creator architecture
* Reviews
* Ratings
* Downloads
* Collections
* Transactions
* Subscriptions

Do not build UI.

---

## AGENT 3 — SEARCH & SEO

Ownership:

* Search
* Discovery
* SEO

Responsibilities:

* Search indexing
* Ranking
* Filters
* Categories
* Tags
* Metadata
* OpenGraph
* Structured Data
* Sitemap

Search is a first-class feature.

---

## AGENT 4 — MCP & AI SYSTEMS

Ownership:

* MCP ecosystem
* AI agent ecosystem

Responsibilities:

* MCP metadata
* Agent metadata
* Compatibility systems
* Resource relationships
* Future AI integrations

Coordinate with Agent 2.

---

## AGENT 5 — EDGE FUNCTIONS

Ownership:

* Supabase Edge Functions
* Background jobs
* Automation

Responsibilities:

* Notifications
* Search indexing
* Analytics events
* Moderation jobs
* Scheduled tasks

Coordinate with Agents 2 and 3.

---

## AGENT 6 — USER & CREATOR SYSTEMS

Ownership:

* User Profiles
* Creator Profiles
* Settings
* Notifications
* Collections
* Saved Content

Responsibilities:

* Creator dashboard
* Creator analytics
* Profile management
* Preferences

Coordinate with Agent 2.

---

## AGENT 7 — QA & PRODUCTION HARDENING

Ownership:

* Testing
* Performance
* Accessibility
* Production readiness

Responsibilities:

* Lighthouse audits
* Error handling
* Mobile testing
* Security reviews
* Build validation

Must continuously identify unfinished functionality.

---

## AGENT 8 — MARKETPLACE DATA FRAMEWORK

Ownership:

* Import architecture
* Data normalization
* Content ingestion

Responsibilities:

* Source registry
* Import framework
* Deduplication
* Content validation
* Moderation queue

Build infrastructure.

Do not scrape content without approval.

---

## AGENT 9 — MONETIZATION

Ownership:

* Revenue systems

Responsibilities:

* AdSense architecture
* Featured listings
* Sponsored listings
* Premium memberships
* Creator subscriptions
* Marketplace commissions

Revenue should never harm UX.

---

## AGENT 10 — ANALYTICS & GROWTH

Ownership:

* Analytics
* Growth systems

Responsibilities:

* Event tracking
* Conversion funnels
* Creator analytics
* Marketplace analytics
* Trending algorithms

Support:

* PostHog
* Google Analytics
* Microsoft Clarity

---

## AGENT 11 — MEDIA SYSTEM

Ownership:

* Images
* Assets
* Storage

Responsibilities:

* Listing thumbnails
* Creator avatars
* Banners
* Image optimization
* CDN architecture

Use Supabase Storage.

---

## AGENT 12 — SECURITY

Ownership:

* Security
* Compliance

Responsibilities:

* RLS reviews
* Permission reviews
* Admin security
* API security
* Secret management

Security is not optional.

---

## AGENT 13 — DOCUMENTATION

Ownership:

* Documentation
* Architecture docs

Responsibilities:

Create and maintain:

* Setup guides
* Deployment guides
* API docs
* Database docs
* Architecture docs

Documentation must remain synchronized with implementation.

---

# Orchestration Layer (Cycle-Based Delivery)

AGENT 0 runs **cycles** (2-week sprints). Each cycle ends with: checkpoint → test report → review subagent → next build plans.

## Cycle 12 — Trust & Creator Content ✅

| Agent | Deliverable | Status |
|-------|-------------|--------|
| AGENT 2 | DDL: review_responses, listing_faqs, listing_install_commands | Done |
| AGENT 1 | Creator UIs + public listing sections | Done |
| AGENT 1 | Verified review badges | Done |
| AGENT 1 | Navbar overlap fix | Done |
| AGENT 13 | design.md, checkpoint, project-state | Done |

## Cycle 13 — Commerce & Ingestion ✅

| Agent | Deliverable | Status |
|-------|-------------|--------|
| AGENT 8 | GitHub upload → install command seeding | Done |
| AGENT 9 | Purchase/download APIs, ListingActions | Done |
| AGENT 1 | Auth pages, creator edit/pricing, developer nav | Done |
| AGENT 12 | Open redirect fix, middleware alignment | Done |

## Cycle 14 — Discovery & Polish ✅

| Agent | Deliverable | Status |
|-------|-------------|--------|
| AGENT 9 | Stripe checkout + webhook → `transactions` | Done |
| AGENT 1 | Details redirect, marketplace filters, contact form | Done |
| AGENT 6 | Review submit, archive/delete, public creator profile | Done |
| AGENT 3 | `search_vector`, sitemap, robots, listing SEO metadata | Done |
| AGENT 12 | Revoke PUBLIC EXECUTE on trigger functions | Done |
| AGENT 0 | Build validation, checkpoint, project-state | Done |

## Cycle 15 — Engagement & Hardening (ACTIVE)

| Agent | Build plan | Done when |
|-------|------------|-----------|
| AGENT 0 | Build validation, types regen | Done |
| AGENT 6 | Collections + messages | Done |
| AGENT 9 | Payouts fix + Stripe Connect | Done |
| AGENT 10 | PostHog + analytics events | Done |
| AGENT 2 | Regenerate `types/database.ts` | Done |
| **AGENT 7** | Playwright E2E smoke suite | Done (8/8) |
| **AGENT 12** | RPC EXECUTE revoke migration | Done |

## Subagent invocation template

```
Owner: AGENT <N>
Cycle: <number>
Read first: design.md, memory/project-state.md, latest checkpoint
Scope: <files only>
Done when: <testable criteria>
Do not: <out of scope>
Report: what works, what's broken, files changed
```

## New / clarified agent scopes

| Agent | Added focus |
|-------|-------------|
| AGENT 1 | Navigation shell rules — never double navbar |
| AGENT 9 | `PurchaseFlow`, `transactions`, Stripe webhooks |
| AGENT 12 | Supabase advisors after every DDL change |
| AGENT 0 | Cloud agent MCP fallback documentation |

---

# Collaboration Rules

Agents work together.

Agents do not compete.

Agents do not overwrite each other's work.

Before changing shared systems:

* Review ownership.
* Review recent commits.
* Coordinate through project-state.md.

Always prefer extending existing systems over rebuilding them.

---

# Definition Of Done

A task is only complete when:

* Functionality works.
* Mock data removed.
* Real data connected.
* Errors handled.
* Loading states added.
* Empty states added.
* Type checks pass.
* Build passes.
* Documentation updated.
* Memory updated.
* Changes committed.
* Changes pushed to GitHub.

A page existing is NOT completion.

Working functionality is completion.

---

# Final Objective

Build the highest quality AI marketplace on the internet.

Every decision should optimize for:

* User experience
* Discoverability
* Performance
* Scalability
* Security
* Maintainability
* Revenue
* Long-term growth
