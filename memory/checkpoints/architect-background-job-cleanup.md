# Checkpoint: Architect Background Job Cleanup

**Date:** 2026-07-01  
**Cycle:** 16 — Enterprise Workflow + Explore V2  
**Agent:** AGENT 0 / Orchestrator cleanup pass

## Summary

Cleaned up the broken background-job/WebSocket implementation left by a previous session, replaced it with a client-safe `ArchitectJobStore` that persists generation state across navigation, and re-applied the `architect_background_jobs` table migration with the security advisory fix. Build now passes clean.

## What was broken

- `app/api/architect/background-job/route.ts` had duplicate declarations and failed to compile.
- `app/api/ws/architect-progress/route.ts` and `lib/architect/websocket-broadcaster.ts` exported non-async functions in a Server Actions context and failed to compile.
- `ArchitectClient.tsx` imported `ArchitectJobStore` from `@/lib/architect/job-store`, but the file exported server-side DB helpers instead of the store.
- Multiple redundant hooks (`useArchitectJob`, `useArchitectProgress`, etc.) and hung-job scripts were created and never used.
- `.env.example` had `{{...}}` placeholders instead of the project's normal empty-value template.
- `ws` and `@types/ws` were added as dependencies but are not supported by Next.js App Router.
- `architect_background_jobs` table migration had not been applied to the production database.

## What was done

### Deleted
- `app/api/architect/background-job/route.ts` and directory
- `app/api/architect/webhook/route.ts` and directory
- `app/api/ws/architect-job/route.ts` and directory
- `app/api/ws/architect-progress/route.ts` and directory
- `app/api/architect/jobs/route.ts` and directory
- `lib/architect/background-job-manager.ts`
- `lib/architect/websocket-broadcaster.ts`
- `hooks/` directory (redundant unused hooks)
- `scripts/check-hung-jobs.ts`
- `scripts/check-hung-jobs-fixed.ts`
- `scripts/check-hung-jobs-standalone.ts`
- `scripts/check-hung-jobs-cron.ts`
- `scripts/apply-migration.ts`
- `scripts/apply-migration.js`
- `scripts/init-db.sql`
- `memory/checkpoints/background-job-implementation-checkpoint.md` (inaccurate)
- `dist/` build output

### Created / Rewritten
- `lib/architect/job-store.ts` — client-safe `ArchitectJobStore` with `subscribe`, `start`, `retryFiles`, `reset`. Uses `localStorage` to survive navigation, consumes the streaming `/api/architect/generate` endpoint, and updates subscribers as files arrive.
- `scripts/check-hung-jobs.mjs` — Node ES-module cron script that uses the service role key to mark `architect_background_jobs` rows stuck in `processing` for >2 hours as `failed`.
- `app/api/workflows/[id]/soft-delete/route.ts` — kept; provides soft-delete/restore/archive for workflow expansions.

### Modified
- `app/(architect)/architect/ArchitectClient.tsx` — updated subscribe callback to use the new store status values (`idle`, `running`, `done`, `error`) and removed the placeholder `userId` from the `start` call.
- `app/(architect)/architect/workshop/page.tsx` — kept title/description tweak.
- `app/api/workflows/[id]/analyze/route.ts` — kept progress/status polling response shape.
- `.env.example` — reverted to the project's standard empty/default template.
- `.gitignore` — added `/dist`.
- `package.json` / `package-lock.json` — removed `ws` and `@types/ws`.
- `supabase/migrations/20260701_architect_background_jobs.sql` — added `REVOKE ALL ON FUNCTION public.handle_architect_background_jobs_updated_at() FROM PUBLIC;` to satisfy the Supabase security advisor.
- `memory/project-state.md` — updated last-updated date, build command, and pending issues.

### Database
- Applied `20260701_architect_background_jobs` migration to Supabase project `rqermggomchlipmuigan`.
- Executed `REVOKE ALL ON FUNCTION public.handle_architect_background_jobs_updated_at() FROM PUBLIC;` on the live database.

## Verification

- `npm run build` passes cleanly.
- `npm install` completes with updated lockfile.
- Supabase migration applied successfully.

## Security notes

- The `.env.local` file was read during cleanup and contains real production secrets (Supabase service role key, OpenRouter key, GitHub token, Gemini key, PostHog key, SkillsMP key, Cloudflare credentials). These secrets were already exposed in the previous session transcript. The user must rotate all of these keys before the next deploy.
- `.env.example` no longer contains any real values.
- Hung job checker uses `SUPABASE_SERVICE_ROLE_KEY` and can update any stuck job row.

## Next steps

- Rotate exposed secrets in `.env.local`.
- Set up the hourly cron job for `scripts/check-hung-jobs.mjs`.
- Consider moving Architect generation to a server-side worker + Supabase Realtime if page reloads need to be supported.
- Run Playwright E2E smoke tests on the Architect flow.
