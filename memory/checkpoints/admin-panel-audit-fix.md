# Admin Panel Audit Fix - 2026-07-01

## Objective
Ensure all pages, functions, and tiny details in the admin panel are working, with special attention to the `felon-admin` alias and internal admin links.

## Root Causes Found
1. **Redundant/broken middleware rewrite:** I had previously added a duplicate admin alias rewrite in `middleware.ts` that conflicted with the existing `updateSession` handler in `lib/supabase/middleware.ts`. This caused the alias redirect/block logic to short-circuit and the admin panel was accessible without the expected protection.
2. **Internal admin link used a plain `<a>`:** `/admin/roles` linked to the Users page with an `<a>` tag, causing a full page reload instead of client-side navigation.
3. **Unused admin prefix variables:** `/admin/creators` and `/admin/categories` imported `getAdminRoutePrefix` but never used it, leaving dead code.
4. **TypeScript noise from Deno Edge Functions:** The main `tsconfig.json` included `supabase/functions`, which is a Deno project. This caused `tsc --noEmit` to fail on Deno imports, even though the Next.js build passed.

## Fixes Applied
1. **Reverted the duplicate middleware logic** in `middleware.ts` so the existing `updateSession` (which already handles `/felon-admin` → `/admin` rewrite, default `/admin` blocking, and unauthenticated redirects) remains the single source of truth.
2. **Replaced `<a>` with Next.js `<Link>`** in `/admin/roles` for the "Users" page link.
3. **Removed unused `getAdminRoutePrefix` imports** from `/admin/creators` and `/admin/categories`.
4. **Excluded `supabase/functions`** and build artifacts from the main `tsconfig.json` so TypeScript type checks only the Next.js application.
5. **Updated Playwright smoke tests** to use the resolved `getAdminRoutePrefix()` helper instead of the raw `NEXT_PUBLIC_ADMIN_ROUTE_PREFIX` env var, ensuring the admin alias is validated correctly in all environments.

## Verification
- `npm run build` passes with no errors.
- `npx playwright test tests/e2e/smoke.spec.ts` passes (22 passed, 1 skipped).
- New admin alias tests verify:
  - `/admin/dashboard` returns 404 when an alias is configured.
  - `{alias}/dashboard` redirects to `/auth/login` when unauthenticated.

## Files Modified
- `middleware.ts` (reverted duplicate admin rewrite logic)
- `app/(protected)/admin/roles/page.tsx` (internal Link)
- `app/(protected)/admin/creators/page.tsx` (removed unused import)
- `app/(protected)/admin/categories/page.tsx` (removed unused import)
- `tsconfig.json` (excluded Deno Edge Functions)
- `tests/e2e/smoke.spec.ts` (admin alias smoke tests)
- `memory/project-state.md` (updated status)

## Next Steps
- Monitor production access logs to confirm `/admin` is blocked and `/felon-admin` resolves.
- Add authenticated admin E2E tests once a test admin credential is available.
