# MidasAI Project State

## Project Overview
MidasAI is a marketplace for AI tools including Claude Skills, Cursor Rules, Windsurf Workflows, MCP Servers, AI Agents, and more.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI (Radix UI primitives)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **ORM**: None (direct Supabase client)

## Design System
- **Theme**: Dark Luxury Tech (forced dark mode)
- **Primary Color**: Blue (#3B82F6)
- **Background**: Dark (#0F172A)
- **Card Background**: Dark (#1E293B)
- **Typography**: Poppins (headings), Open Sans (body)
- **Style**: Glassmorphism

## Database Schema
- users (with roles: USER, CREATOR, ADMIN)
- categories
- listings (types: SKILL, PLUGIN, MCP, AGENT, PROMPT, WORKFLOW, TEMPLATE)
- reviews
- bookmarks
- notifications
- site_settings

**Status**: Schema alignment COMPLETE. Missing developer-platform tables (api_keys, api_usage, api_logs, webhooks, webhook_deliveries, applications, oauth_tokens, mcp_servers, mcp_tokens, mcp_connections, mcp_usage) plus payouts and usage_records have been created in the live database with indexes, RLS policies, and updated_at triggers. TypeScript types regenerated.

## Route Summary
- **Public Routes (18)**: Home, Search, Skills, Plugins, MCP, Agents, Prompts, Workflows, Templates, Collections, Categories, Trending, Featured, Pricing, Blog, Docs, About, Contact
- **Authentication Routes (4)**: Login, Register, Forgot Password, Reset Password
- **Protected User Routes (5)**: Dashboard, Profile, Settings, Notifications, Bookmarks
- **Protected Creator Routes (4)**: Dashboard, Upload, Listings, Analytics
- **Protected Admin Routes (4)**: Dashboard, Users, Listings, Settings
- **Marketplace Routes (1)**: Listing detail page

## Current Status
**Date**: 2026-06-20
**Phase**: Phase 1 — Database Alignment Complete
**Production Readiness Score**: 15/100 (schema blocker removed)

### Latest Update — 2026-06-22
- Listing detail pages now restore public creator display through safe server-side creator/user lookups, avoiding the public `users` RLS policy that hides creator names from anonymous visitors.
- Uploaded GitHub README content is rendered on listing detail pages as Overview, Installation, Usage, and Features sections with empty states for listings that do not include those sections.
- Public and authenticated marketplace navigation now collapse into mobile menus; protected app pages use an off-canvas sidebar on phones instead of a permanent desktop sidebar margin.
- Homepage, search, creator upload, and upload modal received mobile breakpoint/spacing fixes; global CSS now prevents accidental horizontal overflow.
- Verification: `NODE_ENV=production npm run build` passes. Plain `npm run build` fails in this Cloud Agent shell only when `NODE_ENV` is set to a non-standard value. `npx tsc --noEmit` remains blocked by pre-existing Next 15 route-handler param typing and Supabase Edge Function/Deno import errors.

**Completed Foundation:**
- Next.js 15 project structure with TypeScript
- Supabase integration (auth, client, server, middleware)
- Database schema defined with RLS policies
- Basic UI components (shadcn/ui)
- Authentication flow (login/register) - WORKING
- Route structure (37 routes)
- Navbar and Footer components
- Middleware for route protection
- Dark luxury theme implemented

**Critical Issues Identified:**
1. Database schema alignment COMPLETE (developer-platform tables, RLS, indexes, triggers applied)
2. All pages use mock data (100% of pages)
3. Zero real database queries in codebase
4. No API routes or server actions
5. No edge functions
6. Search is placeholder only
7. Admin route uses `/admin` (security violation)
8. No SEO implementation
9. No analytics implementation
10. No file upload system
11. No payment processing
12. No reviews/ratings system
13. No bookmarks functionality
14. No downloads tracking
15. No creator profile system
16. No MCP Server integration
17. No AI Agent connectivity

**Audit Documents Created:**
- memory/architecture-map.md
- memory/current-state-analysis.md
- memory/missing-systems-analysis.md
- memory/mock-data-audit.md
- memory/functional-audit.md

## Immediate Priorities (Phase 1: Foundation Audit)

### Critical (Week 1-2)
1. Apply database schema to Supabase
2. Implement real database queries for all pages
3. Add error handling throughout
4. Add loading states throughout
5. Add empty states throughout
6. Fix admin route security (use environment-based route)

### High Priority (Week 3-4)
7. Implement search functionality
8. Implement file upload system
9. Implement reviews & ratings
10. Implement bookmarks functionality
11. Implement downloads tracking

## Next Steps
- Proceed to configure missing external integrations (GitHub, Gemini, Stripe) now that backing tables exist.
- Fix `/creator/payouts` page — it now has the required `payouts` table.
- Fix `/support` route or remove the sidebar link.
- Fix admin route security (move from `/admin` to env-based hidden route).
- Seed marketplace data so the marketplace is not empty.
- Add real analytics event tracking beyond the empty table.
