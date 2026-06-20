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

## AGENT 0 — PROJECT MANAGER

Purpose:

Coordinate the entire project.

Responsibilities:

* Read all commits.
* Read all checkpoints.
* Update project-state.md.
* Detect duplicate work.
* Detect conflicts.
* Assign priorities.
* Track blockers.
* Track technical debt.

Does not build major features unless required.

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
