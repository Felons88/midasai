# Technical Debt - MidasAI

## Critical Issues

### 1. No Stripe Integration
- **Impact**: Cannot process payments, subscriptions, or creator payouts
- **Fix**: Install Stripe SDK, implement embedded checkout, webhooks, Stripe Connect
- **Priority**: HIGH

### 2. AI Analysis is Heuristic-Based
- `/api/analyze` returns structured-but-fake analysis
- `/api/ai-review` scores based on field length heuristics
- **Fix**: Integrate with OpenAI/Anthropic API for real analysis
- **Priority**: MEDIUM

### 3. Missing Sidebar Navigation
- User requirements specify persistent, animated, collapsible sidebar
- Current UI only has top navbar
- **Priority**: HIGH

### 4. No Loading/Skeleton States
- Most pages lack loading indicators
- Only `app/loading.tsx` and `app/dashboard/loading.tsx` exist
- **Priority**: MEDIUM

### 5. Search API References Non-Existent Columns
- `app/api/search/route.ts` queries `listings.tags` (doesn't exist; tags are in `listing_tags`)
- References `creator.name` without proper join
- **Fix**: Update search query to join through `listing_tags` and `users`
- **Priority**: MEDIUM

## Code Quality Issues

### Type Safety
- Several pages use `any` type annotations
- Database types exist but aren't used consistently
- **Fix**: Replace `any` with proper types from `types/database.ts`

### Missing Error Boundaries
- No error boundary components
- Server errors show default Next.js error page
- **Fix**: Add `error.tsx` files for graceful error handling

### Missing Not-Found Pages
- No custom `not-found.tsx` pages
- 404 shows default Next.js page
- **Fix**: Add branded not-found pages

## Architecture Improvements Needed

### Authentication
- Middleware should check user roles for admin routes
- Currently only checks if user exists, not role

### Image Handling
- No image upload/storage integration
- Listings reference `images` array but no upload mechanism
- **Fix**: Integrate Supabase Storage or external CDN

### SEO
- Pages lack proper metadata/title tags
- No sitemap.xml or robots.txt
- No Open Graph / Twitter card meta tags
- **Fix**: Add `generateMetadata()` to all pages

### Testing
- Zero test files in the project
- No unit, integration, or e2e tests
- **Fix**: Add Jest + React Testing Library + Playwright

### Environment Variables
- `.env.local.example` should be provided
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_ROUTE`
- Missing: Stripe keys, AI API keys
