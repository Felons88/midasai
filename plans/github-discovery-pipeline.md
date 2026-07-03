# Blueprint: Enterprise GitHub Discovery & Prompt Import Pipeline

## Objective

Build a permanent, scalable ingestion pipeline that continuously discovers high-quality prompt and AI resource repositories on GitHub, extracts metadata, classifies them, and queues them for review before marketplace publication.

## Status

Phase 1 audit completed. Existing systems identified:

- `lib/ingestion/clawhub.ts` + `app/api/admin/ingest/clawhub` — external ClawHub ingestion
- `lib/scraper/skillsmp.ts` — SkillsMP scraping
- `lib/categorization/` — AI categorization service (`analyzer.ts`, `service.ts`, `extractor.ts`, `categories.ts`)
- `lib/search/listings.ts` — full-text search and ranking on `listings.search_vector`
- `lib/recommendations/` — user interest profiles and scoring
- `lib/github/scan.ts` — GitHub repo scanning for owned repos (manual upload flow)
- `lib/github/connection.ts` — GitHub OAuth + token fetch

## Known Gaps

- `categorization_jobs` table is referenced in code but does not exist in the database.
- No dedicated tables for discovery jobs, discovered repositories, or review queue.
- No GitHub search/discovery API integration.
- No scheduled background discovery.
- No admin UI for managing discovery queries or reviewing imports.

## Architecture

### Core Tables

1. `discovery_queries` — admin-managed search queries
2. `discovery_jobs` — per-run execution status
3. `discovered_repositories` — unique GitHub repo metadata
4. `repository_versions` — snapshot history per import
5. `repository_classifications` — AI classification results
6. `import_queue` — review queue linking discovered repos to listings
7. `discovery_analytics` — success/failure/rate-limit metrics

### Pipeline Flow

1. Admin creates `discovery_queries` (query, sort, order, schedule, enabled).
2. Scheduler triggers `discovery_jobs`.
3. GitHub Search API fetches repositories.
4. Deduplication against `discovered_repositories`.
5. Metadata extraction + README fetch.
6. AI classification via `lib/categorization/analyzer.ts` or new classifier.
7. Queue into `import_queue` with `PENDING` status.
8. Admin reviews and approves/rejects.
9. Approved repos create/update `listings` rows.
10. Search index refreshes via existing `search_vector` trigger.

### Integration Points

- Reuse `lib/github/connection.ts` for authenticated GitHub API calls.
- Reuse `lib/categorization/analyzer.ts` for classification.
- Reuse `lib/search/listings.ts` for search refresh.
- Reuse `lib/ingestion/clawhub.ts` patterns for retry/backoff.
- Extend admin panel under `/felon-admin/ingestion/discovery`.

## Phases

- [ ] Phase 1: Audit (done)
- [ ] Phase 2: Database schema migration
- [ ] Phase 3: GitHub discovery service (search + metadata extraction)
- [ ] Phase 4: Duplicate detection and classification pipeline
- [ ] Phase 5: Import queue and review workflow
- [ ] Phase 6: Search index refresh integration
- [ ] Phase 7: Admin discovery dashboard
- [ ] Phase 8: Scheduled background jobs
- [ ] Phase 9: Validation and documentation

## Agent Assignment

- **AGENT 2 (Database):** Schema migration, RLS, indexes
- **AGENT 5 (Edge Functions):** Background scheduler, GitHub API rate-limit handling
- **AGENT 4 (AI Systems):** Classification and embedding integration
- **AGENT 8 (Marketplace Data):** Import pipeline, deduplication, listing creation
- **AGENT 1 (Frontend):** Admin discovery dashboard
- **AGENT 3 (Search):** Search index refresh and filters
- **AGENT 13 (Documentation):** Blueprint, API docs, runbooks

## TODO

See TODO.md for subsystem-level tasks.
