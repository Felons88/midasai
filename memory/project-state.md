# MidasAI Project State

## Last Updated
2026-06-19 — Agent 0 (Project Manager) full audit

## Project Overview
MidasAI is a marketplace for AI tools: Claude Skills, Cursor Rules, Windsurf Workflows, MCP Servers, AI Agents, Prompt Packs, Templates, and Automations.

## Tech Stack (Actual — as deployed in code)
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI (Button, Card, Input, Label, DropdownMenu)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (via `@supabase/ssr`)
- **Schema**: `supabase/schema.sql` (not yet applied)

## Architecture Contradiction (MUST RESOLVE)
- `CLAUDE.md` prescribes Prisma + NextAuth
- Actual codebase uses Supabase Auth + Supabase client (no Prisma, no NextAuth)
- Decision needed: update CLAUDE.md to reflect Supabase stack, or migrate code to Prisma/NextAuth
- **Recommendation**: Keep Supabase (already wired), update CLAUDE.md

## Design System
- **Intended (context.md)**: Gold primary `#D4AF37`, background `#050505` — dark luxury
- **Actual (globals.css)**: Blue primary (HSL 217/221), dark navy background
- **Mismatch**: The gold dark luxury theme was never implemented
- **Typography**: Poppins (headings), Open Sans (body)
- **Style**: Glassmorphism utility classes defined but barely used

## Repository Structure
```
midasai/
├── .agents/skills/          # Supabase + Postgres best practices skills
├── .windsurf/skills/        # ui-ux-pro-max skill
├── app/
│   ├── about/page.tsx
│   ├── admin/{dashboard,listings,settings,users}/page.tsx
│   ├── agents/page.tsx
│   ├── auth/{login,logout,register}/page.tsx
│   ├── blog/page.tsx
│   ├── bookmarks/page.tsx
│   ├── categories/page.tsx
│   ├── collections/page.tsx
│   ├── contact/page.tsx
│   ├── creator/{analytics,dashboard,listings,upload}/page.tsx
│   ├── dashboard/page.tsx
│   ├── docs/page.tsx
│   ├── featured/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── listing/[id]/page.tsx
│   ├── mcp/page.tsx
│   ├── notifications/page.tsx
│   ├── page.tsx              # Home page
│   ├── plugins/page.tsx
│   ├── pricing/page.tsx
│   ├── profile/page.tsx
│   ├── prompts/page.tsx
│   ├── search/page.tsx
│   ├── settings/page.tsx
│   ├── skills/page.tsx
│   ├── templates/page.tsx
│   ├── trending/page.tsx
│   └── workflows/page.tsx
├── components/
│   ├── layout/{Navbar,Footer}.tsx
│   └── ui/{button,card,dropdown-menu,input,label}.tsx
├── lib/
│   ├── supabase/{client,server,middleware}.ts
│   └── utils.ts
├── memory/
│   ├── project-state.md
│   └── checkpoints/
├── supabase/schema.sql
├── middleware.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## What Is Built (Real vs Placeholder)

### Real / Functional
- Supabase client/server/middleware wiring
- Auth flow: login, register, logout (Supabase Auth)
- Middleware: protects /dashboard, /creator, /admin (redirects to /login)
- Layout: Navbar + Footer + dark mode class
- 5 Shadcn UI components
- Database schema SQL file with RLS policies

### Placeholder Only (Static Mock Data, No DB)
- ALL 37 route pages render hardcoded mock data
- Search page — static HTML, no query logic
- Skills/Plugins/MCP/Agents/Prompts/Workflows/Templates — static card grids
- Admin dashboard — fake stats (2,456 users, $48,290 revenue)
- Creator dashboard — fake stats
- User dashboard — fake stats
- Listing detail page — hardcoded single listing
- Bookmarks, Notifications, Settings, Profile — static
- Collections, Categories, Trending, Featured — static

### Does Not Exist
- No API routes or server actions
- No TypeScript types for DB entities
- No Supabase migrations applied
- No .env / environment variables configured
- No README.md
- No CI/CD pipeline
- No tests
- No image/file upload
- No payment system
- No real search
- No SEO (beyond basic metadata)
- No error boundaries or loading states
- No tags system
- No downloads tracking
- No reviews/ratings logic
- No creator or public profiles

## Blocked Work
1. **Everything is blocked on Supabase project setup** — no env vars, no DB connection
2. **Dependencies not installed** — npm install has never been run in production
3. **Architecture decision** — CLAUDE.md vs actual code (Prisma/NextAuth vs Supabase)
4. **Admin route security** — uses `/admin` (context.md forbids this; must use env-based hidden routes)

## Duplicated / Contradictory Work
1. project-state.md (previous version) described Prisma/NextAuth structure that doesn't exist
2. checkpoint-01-foundation.md describes Prisma schema that was replaced by Supabase
3. Design system docs contradict CSS (gold vs blue primary)

## Current Sprint
No active sprint. Phase 2 was planned but never started beyond schema.sql creation.

## Git History
- 2 commits total, both "Initial commit" from 2026-06-19
- Single branch: main
- No PRs, no branches, no tags
