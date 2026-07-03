# Checkpoint: User Learning Recommendation Engine

**Date:** 2026-07-02
**Status:** Build passes, 19/22 smoke tests passing

---

## Completed Work

### Phase 1 — Event Collection Pipeline
- Created `POST /api/analytics/event` to ingest client events.
- Updated `lib/analytics.ts` `trackEvent` to actually send events to the API.
- Added `trackEvent` calls:
  - `listing_clicked` on `MarketplaceCard`
  - `listing_unbookmarked` on `BookmarkFlow`
  - `category_clicked` on `CategoryCard`
  - `architect_prompt_sent` on `ArchitectClient`
- Server-side authoritative tracking:
  - `search_performed` on search page
  - `listing_viewed` already existed
  - `trackServerEvent` now writes to `analytics_events` and updates the profile.
- Added RLS policy so anonymous and authenticated users can insert events.
- Added E2E smoke tests for the analytics event and recommendations APIs.

### Phase 2 — User Interest Profile
- Created `user_interest_profile` table via migration.
- Created `lib/recommendations/profile.ts`:
  - Extracts dimensions from events (category, tag, type, creator, language).
  - Handles listing events, search, category clicks, tag clicks, creator follows, and Architect prompts.
  - Upserts weighted rows into `user_interest_profile`.
  - Includes `applyRecencyDecay` for half-life scoring.
- Wired profile updates into `POST /api/analytics/event` and `trackServerEvent`.

### Phase 3 — Recommendation Engine (MVP)
- Created `lib/recommendations/scoring.ts`:
  - Loads the user interest profile.
  - Queries candidate listings matching the top categories/types/creators.
  - Scores by profile overlap + popularity + rating + recency decay.
- Created `GET /api/recommendations` route.
- Verified the endpoint returns results for anonymous users.

### Security
- Dropped the overly broad `Service role can manage profiles` policy on `user_interest_profile`.
- Service role writes via `createServiceClient` bypass RLS.
- Users can only read their own profile rows.

## Files Changed

- `app/api/analytics/event/route.ts` (new)
- `app/api/recommendations/route.ts` (new)
- `lib/analytics.ts`
- `lib/analytics-server.ts`
- `lib/recommendations/profile.ts` (new)
- `lib/recommendations/scoring.ts` (new)
- `components/marketplace/MarketplaceCard.tsx`
- `components/marketplace/BookmarkFlow.tsx`
- `components/homepage/CategoryCard.tsx`
- `app/(architect)/architect/ArchitectClient.tsx`
- `app/(marketing)/search/page.tsx`
- `tests/e2e/smoke.spec.ts`
- `types/database.ts`
- `memory/project-state.md`
- `plans/user-learning-recommendation-engine.md`

## Migrations Applied

- `create_user_interest_profile`
- `analytics_events_insert_policy`
- `fix_user_interest_profile_rls`

## Validation

- `npm run build` passes.
- `npx playwright test tests/e2e/smoke.spec.ts` — 19 passed, 3 failed.
  - Failures are pre-existing/env-specific: admin-route obfuscation, listing media auth, 404 page glitch class.
  - New analytics and recommendation tests pass.
- Manual API test:
  - `POST /api/analytics/event` with `listing_clicked` returns 200.
  - `GET /api/recommendations` returns 200 with an array.

## Next Tasks

- Phase 3 UI: replace the static homepage spotlight with a personalized “Recommended for you” section.
- Phase 4: feedback loop (track `recommendation_served` and `recommendation_clicked`).
- Phase 5: use embeddings / LLM for richer Architect prompt intent extraction.
- Push to GitHub once a remote is configured.
