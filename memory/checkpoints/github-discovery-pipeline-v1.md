# Checkpoint: GitHub Discovery & Prompt Import Pipeline v1

## Date

2026-07-03

## Status

Foundation complete and deployed. Remaining: live end-to-end testing against the GitHub API and the review workflow.

## What was built

- **Schema** — `supabase/migrations/20260703113200_github_discovery_pipeline.sql`
  - `discovery_queries` (admin-managed search queries)
  - `discovery_jobs` (per-run execution status + counters)
  - `discovered_repositories` (unique repo metadata + full-text search vector)
  - `repository_versions` (historical snapshots)
  - `repository_classifications` (AI classification results)
  - `import_queue` (review queue linking repos to listings)
  - `discovery_analytics` (event log for success/fail/skip/duplicate/rate-limit)
  - Added missing `categorization_jobs` table referenced by existing code.

- **Discovery service** — `lib/discovery/github.ts`
  - GitHub Search API integration
  - Rate-limit handling + exponential backoff
  - README, tags, releases extraction
  - Deduplication by `github_id`
  - Automatic `import_queue` insertion for new repos

- **Classification** — `lib/discovery/classify.ts`
  - Gemini-based classification for primary/secondary categories, tags, models, IDEs, languages, frameworks, industries, use cases, quality, confidence, marketplace relevance
  - Fallback heuristic when AI is unavailable

- **Import** — `lib/discovery/import.ts`
  - Converts an approved discovered repository into a `listings` row
  - Resolves `category_id` from classification
  - Reuses system creator resolver from `lib/ingestion/clawhub.ts`
  - Creates README, tags, and source metadata

- **API routes**
  - `POST /api/admin/discovery/queries` — CRUD
  - `GET /api/admin/discovery/queries`
  - `POST /api/admin/discovery/jobs` — run a discovery job
  - `GET /api/admin/discovery/jobs`
  - `GET /api/admin/discovery/repositories`
  - `GET /api/admin/discovery/classify` — batch classify unclassified
  - `POST /api/admin/discovery/classify`
  - `GET /api/admin/discovery/queue`
  - `POST /api/admin/discovery/queue` — approve/reject/archive + create listing on approve

- **Admin UI** — `app/(protected)/admin/discovery/page.tsx`
  - Tabs: queries, jobs, repositories, import queue
  - Create query form, run query, classify pending, approve/reject/archive queue
  - Added Discovery link to `lib/admin/nav.ts`

- **Scheduled background job**
  - `supabase/functions/github-discovery-scheduler/index.ts` deployed
  - `pg_cron` job calls it every hour

- **Type safety** — regenerated `types/database.ts`

## Files modified / created

- `plans/github-discovery-pipeline.md`
- `supabase/migrations/20260703113200_github_discovery_pipeline.sql`
- `supabase/functions/github-discovery-scheduler/index.ts`
- `lib/discovery/github.ts`
- `lib/discovery/classify.ts`
- `lib/discovery/import.ts`
- `lib/ingestion/clawhub.ts` (exported `resolveSystemCreatorId`)
- `lib/admin/nav.ts`
- `app/api/admin/discovery/queries/route.ts`
- `app/api/admin/discovery/jobs/route.ts`
- `app/api/admin/discovery/repositories/route.ts`
- `app/api/admin/discovery/classify/route.ts`
- `app/api/admin/discovery/queue/route.ts`
- `app/(protected)/admin/discovery/page.tsx`
- `types/database.ts`
- `TODO.md`
- `memory/project-state.md`

## Validation

- `npm run build` passes.
- Database migration applied successfully.
- Edge function deployed and active.
- pg_cron job installed.

## Known limitations / next steps

- No live end-to-end test against GitHub API yet (requires `GITHUB_TOKEN` in production).
- Review workflow does not send notifications or update analytics events on approval.
- No public search filters for discovery-specific fields (source, star count, etc.) yet.
- The scheduler runs every hour regardless of individual `schedule_cron` values.

## Agent ownership

- AGENT 2 — schema + migration
- AGENT 5 — edge function + cron
- AGENT 8 — discovery service + import pipeline
- AGENT 4 — classification
- AGENT 1 — admin UI
- AGENT 13 — this checkpoint
