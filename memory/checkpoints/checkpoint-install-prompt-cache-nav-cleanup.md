# Checkpoint: Install Prompt Cache + Nav/Dashboard Cleanup

**Date:** 2026-07-02
**Status:** Build passes, 19/20 smoke tests passing

---

## Completed Work

### AI Install Prompt Caching
- Added 4-day staleness refresh to `app/api/listings/[id]/skill-prompt/route.ts`.
  - Fresh cached prompts return immediately.
  - Stale prompts are returned instantly, then regenerated in the background.
  - New SSE events: `refreshed`, `refresh_error`.
- Updated `components/marketplace/SkillModal.tsx` to listen for `refreshed` events and show an "Updated just now" indicator.

### GitHub Install Flow Performance
- Optimized `components/marketplace/ListingActions.tsx`:
  - Paid GitHub listings redirect to Stripe checkout immediately.
  - Free/owned GitHub listings open the SkillModal instantly.
  - Download tracking now runs in the background.
  - Free file deliveries fire purchase/download calls in parallel.

### Listing Documentation Tab
- Added `lib/github/readme.ts` with `fetchGitHubReadme()`.
- Updated `app/(marketing)/listing/[id]/page.tsx` to fetch the GitHub README for the Documentation tab.
- The tab now shows the repo README instead of duplicating the top description.
- Fixed a missing `Star` import and a loose type in `lib/listings/normalize.ts` that were causing IDE/TS errors.

### Navigation & Dashboard Cleanup
- `components/layout/AuthenticatedNavbar.tsx`: replaced the "Creator Studio" dropdown link with "Dashboard" (`/dashboard`).
- `components/layout/NavbarSessionActions.tsx`: removed the redundant "Creator Portal" button for logged-in users.
- `app/(protected)/dashboard/DashboardClient.tsx` and `page.tsx`: removed the Notifications metric card, the notification-based priority, and the Notification Center panel. Stopped fetching notifications.

## Files Changed

- `app/api/listings/[id]/skill-prompt/route.ts`
- `components/marketplace/SkillModal.tsx`
- `components/marketplace/ListingActions.tsx`
- `lib/github/readme.ts` (new)
- `app/(marketing)/listing/[id]/page.tsx`
- `lib/listings/normalize.ts`
- `components/layout/AuthenticatedNavbar.tsx`
- `components/layout/NavbarSessionActions.tsx`
- `app/(protected)/dashboard/DashboardClient.tsx`
- `app/(protected)/dashboard/page.tsx`
- `memory/project-state.md`

## Validation

- `npm run build` passes.
- `npx playwright test tests/e2e/smoke.spec.ts` — 19 passed, 1 failed.
  - The failing test is the admin-route obfuscation test, which returns 403 instead of 404 in the local dev environment due to middleware behavior; it is not related to these changes.

## Next Tasks

- Review and merge the remaining E2E test failure for the admin-route obfuscation test if it becomes a production concern.
- Continue launch-readiness polish for Cycle 17.
- Push changes to GitHub.
