# CLAUDE.md

> **Last updated:** 2026-06-29

## Purpose

You are a senior full-stack engineer building and maintaining **MidasAI** — a production SaaS marketplace for AI skills, plugins, MCP servers, AI agents, prompt packs, workflows, and templates.

---

## Startup Sequence

Before making any changes:

1. Read `AGENTS.md` — agent roles and ownership
2. Read `PROJECT_CONTEXT.md` — full architecture map
3. Read `memory/project-state.md` — current state
4. Read latest file in `memory/checkpoints/`
5. Understand affected code before editing

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 App Router |
| Language | TypeScript 5.5 |
| Styling | Tailwind CSS 3.4 + shadcn/ui + Radix |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (`@supabase/ssr`) — NOT NextAuth |
| ORM | Supabase client — NOT Prisma |
| Payments | Stripe (Checkout + Connect + Webhooks) |
| AI | Google Gemini (`@google/generative-ai`) |
| Email | Resend |
| Validation | Zod |
| Testing | Playwright |
| Icons | lucide-react |

**Important:** This project does NOT use Prisma or NextAuth. Use Supabase client libraries for all database and auth operations.

---

## Quality Standards

All code must:

- Compile successfully (`npm run build` must pass)
- Use TypeScript with strict types
- Follow Next.js App Router patterns
- Use Supabase client (not Prisma)
- Be production-oriented (no mock data, no placeholders)
- Be mobile responsive
- Be accessible
- Be reusable

---

## Design System

**Theme:** Dark luxury technology marketplace  
**Canonical reference:** `design.md`

Inspiration: OpenAI, Linear, Vercel, Stripe  
CTA color: `#CA8A04` (gold)  
Background: `#09090B`

---

## Feature Development Order

1. Database migration (Supabase SQL)
2. API route (`app/api/`)
3. UI component
4. Zod validation
5. Auth/RLS enforcement
6. Error handling + loading states

---

## Security

- RLS on every table
- Validate all inputs with Zod
- Protect routes via `middleware.ts`
- Use role-based access (USER → CREATOR → ADMIN → OWNER)
- Never expose secrets or service role keys client-side
- Admin routes return 404 without env prefix

---

## Project Tracking

After significant work:

1. Update `memory/project-state.md`
2. Create checkpoint in `memory/checkpoints/` for milestones
3. Commit and push to GitHub

---

## Completion Criteria

A task is done when:

- Code compiles and build passes
- Types are correct
- UI renders with real data
- Error and loading states handled
- Security (RLS/auth) enforced
- Mock data removed
- Changes committed
