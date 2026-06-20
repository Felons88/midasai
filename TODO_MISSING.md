# MidasAI — What's Missing & Needs to Be Done

> **Last Updated:** June 20, 2026  
> Prioritized list of gaps, broken things, and features still needed.

---

## 🔴 CRITICAL (Blocks Production Launch)

### 1. Database Schema Not Fully Applied
- [ ] Verify all 20 tables exist in Supabase
- [ ] Verify all indexes are created
- [ ] Verify all RLS policies are active
- [ ] Seed categories table with default categories
- [ ] Seed tags table with common tags

### 2. Pages Still Using Mock/Static Data
- [ ] Homepage — uses hardcoded featured listings, stats, categories
- [ ] `/skills` — no real Supabase query
- [ ] `/plugins` — no real Supabase query
- [ ] `/mcp` — no real Supabase query
- [ ] `/prompts` — no real Supabase query
- [ ] `/workflows` — no real Supabase query
- [ ] `/templates` — no real Supabase query
- [ ] `/collections` — no real Supabase query
- [ ] `/categories` — no real Supabase query
- [ ] `/trending` — no real Supabase query
- [ ] `/featured` — no real Supabase query
- [ ] `/dashboard` — user dashboard needs real data
- [ ] `/profile` — needs real profile data
- [ ] `/settings` — needs real user settings
- [ ] `/notifications` — needs real notifications
- [ ] `/bookmarks` — needs real bookmarks
- [ ] `/listing/[id]` — needs real listing detail with reviews
- [ ] `/pricing` — static but should pull from monetization config
- [ ] `/blog` — placeholder content
- [ ] `/docs` — placeholder content

### 3. Payment Processing (Stripe)
- [ ] Stripe integration setup
- [ ] Checkout flow for purchasing listings
- [ ] Stripe Connect for creator payouts
- [ ] Webhook handlers for payment events
- [ ] Refund processing
- [ ] Subscription billing (PRO/ENTERPRISE tiers)
- [ ] Invoice generation

### 4. Admin Security Violation
- [ ] Admin route currently uses `/admin` — predictable and insecure
- [ ] Implement environment-based admin route or role-gated middleware
- [ ] Add proper RBAC checks on all admin pages
- [ ] Add audit logging for admin actions

---

## 🟠 HIGH PRIORITY (Core Marketplace Features)

### 5. Reviews & Ratings System
- [ ] Submit review form on listing page
- [ ] Display reviews on listing page
- [ ] Calculate and display average ratings
- [ ] Prevent duplicate reviews (DB constraint exists but no UI)
- [ ] Creator reply to reviews
- [ ] Review moderation (admin)

### 6. Bookmarks / Favorites
- [ ] Add/remove bookmark button on listing cards
- [ ] Bookmarks page with real data from Supabase
- [ ] Bookmark count display

### 7. Downloads Tracking
- [ ] Track downloads in `downloads` table
- [ ] Download button with auth check
- [ ] Download count display on listings
- [ ] Download history on user dashboard
- [ ] Rate limiting for downloads

### 8. File Upload & Storage
- [ ] Supabase Storage bucket setup
- [ ] Listing file upload (the actual asset being sold)
- [ ] Image upload for thumbnails/gallery
- [ ] Avatar upload for users/creators
- [ ] File size validation
- [ ] File type validation
- [ ] CDN/optimization for images

### 9. Real Search UI
- [ ] Search page UI connected to `/api/search`
- [ ] Search input in Navbar (live search)
- [ ] Filter sidebar (type, category, price range, rating)
- [ ] Sort controls
- [ ] Pagination UI
- [ ] Search suggestions/autocomplete
- [ ] Empty state for no results

### 10. Creator Profile System
- [ ] Public creator profile page (`/creator/[slug]`)
- [ ] Creator onboarding flow (upgrade from USER to CREATOR)
- [ ] Creator verification process
- [ ] Creator banner/avatar upload
- [ ] Creator social links
- [ ] Creator listing grid on profile

### 11. User Profile System
- [ ] Profile edit form with real data save
- [ ] Avatar upload
- [ ] Password change
- [ ] Email change
- [ ] Account deletion
- [ ] Connected accounts (GitHub, etc.)

### 12. Notifications System
- [ ] Real-time notifications
- [ ] Notification preferences (email/in-app)
- [ ] Mark as read functionality
- [ ] Notification types (review, purchase, download, system)
- [ ] Email notification delivery

---

## 🟡 MEDIUM PRIORITY (Quality & Growth)

### 13. SEO Implementation
- [ ] Apply `generateMetadata` to all pages (currently only utility exists)
- [ ] Dynamic `sitemap.xml` generation
- [ ] `robots.txt` file
- [ ] Open Graph images per listing
- [ ] Canonical URLs
- [ ] Breadcrumb structured data
- [ ] Organization structured data

### 14. Performance Optimization
- [ ] Server Components optimization (minimize client components)
- [ ] Image optimization with `next/image`
- [ ] Lazy loading for below-fold content
- [ ] Pagination instead of loading all items
- [ ] Database query optimization (select only needed fields)
- [ ] Edge caching strategy
- [ ] Bundle size analysis
- [ ] Target Lighthouse 95+

### 15. Error Handling & UX States
- [ ] Global error boundary (`error.tsx` in app root)
- [ ] Per-route error boundaries
- [ ] Loading states on all data-fetching pages (`loading.tsx`)
- [ ] Empty states (no listings, no reviews, etc.)
- [ ] Toast notifications for user actions
- [ ] Form validation feedback
- [ ] 404 page (`not-found.tsx`)

### 16. Collections Feature
- [ ] Create collection
- [ ] Add listing to collection
- [ ] Public/private collections
- [ ] Browse public collections
- [ ] Share collections

### 17. Tags System
- [ ] Tag input on listing creation
- [ ] Tag-based filtering
- [ ] Tag browse page
- [ ] Popular tags display
- [ ] Tag suggestions

### 18. Messaging System
- [ ] User-to-creator messaging
- [ ] Message inbox UI
- [ ] Unread message indicators
- [ ] Message notifications

---

## 🔵 LOWER PRIORITY (Growth & Polish)

### 19. Analytics & Tracking
- [ ] PostHog or Google Analytics integration
- [ ] Event tracking (views, clicks, downloads, purchases)
- [ ] Creator analytics with charts/graphs
- [ ] Platform-wide admin analytics
- [ ] Conversion funnels
- [ ] Trending algorithm

### 20. AI Service Integration
- [ ] Replace placeholder AI API routes with real AI service (OpenAI/Anthropic)
- [ ] AI-powered asset analysis on upload
- [ ] AI-generated listing descriptions
- [ ] AI content moderation
- [ ] Semantic search (pgvector)

### 21. MCP Server Integration
- [ ] MCP metadata schema (capabilities, transport, config)
- [ ] MCP installation instructions format
- [ ] MCP compatibility matrix
- [ ] MCP documentation viewer
- [ ] MCP test/validation system

### 22. Email System
- [ ] Transactional email setup (Resend, SendGrid, or similar)
- [ ] Welcome email on registration
- [ ] Purchase confirmation email
- [ ] Creator payout notification email
- [ ] Review notification email
- [ ] Password reset email (Supabase handles this but needs custom template)

### 23. Monetization Features
- [ ] Featured listing spots (paid promotion)
- [ ] Sponsored listings
- [ ] AdSense or ad system
- [ ] Creator subscription tiers
- [ ] Marketplace commission collection

### 24. Content & Community
- [ ] Blog CMS or markdown-based blog
- [ ] Documentation system
- [ ] Community forums or discussions
- [ ] Changelog/updates feed

### 25. Security Hardening
- [ ] Rate limiting on API routes
- [ ] Input sanitization
- [ ] CSRF protection verification
- [ ] Content Security Policy headers
- [ ] Dependency vulnerability scanning
- [ ] Secret management audit
- [ ] SQL injection prevention audit (Supabase handles most)

### 26. Testing
- [ ] Unit tests for utility functions
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows (auth, purchase, upload)
- [ ] Accessibility testing (axe-core)
- [ ] Visual regression tests

### 27. DevOps & Deployment
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Staging environment
- [ ] Environment variable management
- [ ] Database backup strategy
- [ ] Monitoring and alerting
- [ ] Error tracking (Sentry or similar)
- [ ] Vercel deployment configuration

---

## Missing UI Components Needed

- [ ] Modal/Dialog (for confirmations, forms)
- [ ] Toast/Notification component
- [ ] Select/Combobox
- [ ] Tabs (installed but not widely used)
- [ ] Avatar component
- [ ] Badge component
- [ ] Pagination component
- [ ] Star rating component
- [ ] File upload component
- [ ] Search input with suggestions
- [ ] Sidebar navigation
- [ ] Data table (admin)
- [ ] Charts (for analytics)
- [ ] Skeleton loaders

---

## Known Bugs & Issues

1. TypeScript lint errors on Supabase auth client methods (`getUser`, `signOut`) — non-blocking but should be fixed
2. Creator dashboard references `transactions.creator_id` — this column doesn't exist in schema (should be `transactions.user_id` joined through `listings.creator_id`)
3. Search API references `creators` table join but listings use `creator_id` → `users` not `creators`
4. No `creator_id` column on `transactions` table — revenue queries may break
5. `listing_tags` junction table exists but no UI to manage tags on listings
6. Collections exist in schema but zero UI implementation

---

## Recommended Implementation Order

1. **Verify & apply full database schema** → everything depends on this
2. **Connect all pages to real data** → remove all mock/hardcoded content
3. **File upload + Supabase Storage** → required for listing creation to work
4. **Stripe payment integration** → revenue depends on this
5. **Reviews & ratings** → core marketplace trust signal
6. **Search UI** → discovery is critical for marketplace
7. **Creator public profiles** → discoverability
8. **Admin security fix** → protect platform
9. **SEO implementation** → organic growth
10. **Notifications & email** → user engagement

---

## Quick Wins (< 1 hour each)

- [ ] Add `robots.txt` and `sitemap.xml`
- [ ] Add `not-found.tsx` (404 page)
- [ ] Add root `error.tsx` (error boundary)
- [ ] Add `loading.tsx` to all route segments
- [ ] Add empty state components to listing pages
- [ ] Connect `/pricing` page to `SUBSCRIPTION_TIERS` from monetization.ts
- [ ] Add meta descriptions to all pages using `generateMetadata`
