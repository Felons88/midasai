# Implementation Roadmap - MidasAI

## Phase 1: Core Platform Stability (Current Sprint)
- [x] Fix all mock data pages (listing detail, bookmarks, notifications, profile, settings)
- [x] Auth registration creates profiles + user_settings
- [x] Auth-aware Navbar with marketplace dropdown and user menu
- [x] Functional upload flow with real Supabase insertion
- [x] Bookmark toggle API
- [x] Notification mark-read API
- [x] Add missing database tables (followers, listing_versions, notification_preferences, dashboard_preferences)
- [ ] Fix search API column references

## Phase 2: Sidebar & Navigation
- [ ] Global persistent sidebar component (collapsible, animated)
- [ ] Role-aware sidebar items (user, creator, admin)
- [ ] Quick actions in sidebar
- [ ] Mobile-responsive sidebar (drawer on mobile)

## Phase 3: Stripe Integration
- [ ] Install @stripe/stripe-js and stripe packages
- [ ] Embedded checkout component
- [ ] One-time purchase flow
- [ ] Subscription management
- [ ] Creator Stripe Connect onboarding
- [ ] Payout system
- [ ] Webhook handler (/api/webhooks/stripe)
- [ ] Revenue tracking and reporting

## Phase 4: Enhanced Upload & AI
- [ ] Real AI repository analysis (OpenAI/Anthropic integration)
- [ ] ZIP file upload handling
- [ ] Local file upload handling
- [ ] Repository metadata extraction
- [ ] Quality scoring engine
- [ ] Duplicate detection
- [ ] SEO metadata generation
- [ ] Multi-step upload wizard with validation

## Phase 5: Search & Discovery
- [ ] Autocomplete search
- [ ] Semantic search with embeddings
- [ ] Tag-based search (fix listing_tags join)
- [ ] Creator search
- [ ] Trending algorithm
- [ ] Recommendation engine
- [ ] Search analytics

## Phase 6: Creator Platform
- [ ] Creator onboarding flow
- [ ] Creator profile pages (public)
- [ ] Analytics dashboard with real data
- [ ] Listing version management
- [ ] Changelog publishing
- [ ] Follower management
- [ ] Revenue analytics

## Phase 7: Admin & Moderation
- [ ] Listing approval/rejection workflow
- [ ] User management (ban, suspend, role change)
- [ ] Content moderation queue
- [ ] Report handling
- [ ] System health dashboard
- [ ] Audit log viewer

## Phase 8: UX & Polish
- [ ] Global app loader with Midas logo
- [ ] Page-level skeleton loaders
- [ ] Error boundary components
- [ ] Custom 404/500 pages
- [ ] SEO metadata for all pages
- [ ] Open Graph images
- [ ] Sitemap and robots.txt
- [ ] Accessibility audit
- [ ] Performance optimization

## Phase 9: Testing & QA
- [ ] Unit tests (Jest + React Testing Library)
- [ ] API route tests
- [ ] E2E tests (Playwright)
- [ ] Performance benchmarks
- [ ] Security audit
