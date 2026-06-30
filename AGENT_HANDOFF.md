# AGENT_HANDOFF.md

> **Last updated:** 2026-06-29

## Before Starting Work

```bash
git pull origin main
```

Then read these files in order:

1. `AGENTS.md` — Agent roles, ownership, cycle plans
2. `CLAUDE.md` — Working style, tech stack, quality standards
3. `PROJECT_CONTEXT.md` — Full architecture map (routes, DB, APIs)
4. `memory/project-state.md` — Current project state + all API routes
5. `memory/checkpoints/checkpoint-cycle-16-final.md` — Latest milestone
6. `MIDASAI_BIBLE.md` — Deep reference (only if needed)
7. `design.md` — UI/UX design system (only if doing UI work)

## Rules

- Do NOT repeat completed work — check project-state first
- Do NOT audit the repo unless explicitly asked
- Do NOT use Prisma or NextAuth — this project uses Supabase
- Continue from the current cycle / sprint
- `npm run build` must pass before committing

## When Finishing Work

1. Update `memory/project-state.md` with what changed
2. Create checkpoint in `memory/checkpoints/` if milestone reached
3. Commit with descriptive message: `[AGENT-N] Description`
4. Push to GitHub

## Source of Truth

GitHub is the source of truth. Never assume local workspace state is current.
