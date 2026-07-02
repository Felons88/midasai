# MidasAI - Complete Platform Documentation

## Overview

MidasAI is a production-ready marketplace and discovery platform for AI resources including:
- Claude Skills
- Claude Code Skills
- Cursor Rules
- Windsurf Workflows
- GitHub Copilot Resources
- MCP Servers
- AI Agents
- Prompt Packs
- Templates
- Automations

**Tech Stack:**
- Next.js 15 (App Router)
- TypeScript
- Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- Stripe (Payments, Connect)
- TailwindCSS
- shadcn/ui

---

## Architecture

### Frontend Structure
```
app/
├── (marketing)/          # Public pages
│   ├── page.tsx          # Homepage
│   ├── search/           # Advanced search with filters
│   ├── explore/          # Trending content
│   ├── pricing/          # Pricing page
│   ├── categories/       # Category listings
│   └── creators/[id]/    # Creator profile pages
├── (protected)/          # Authenticated pages
│   ├── dashboard/        # User dashboard
│   ├── creator/          # Creator tools
│   ├── developer/        # Developer platform
│   ├── admin/            # Admin panel
│   ├── notifications/    # Notification center
│   └── profile/          # User profile
└── api/                  # API routes
```

### Database Schema

#### Core Tables
- `users` - User accounts and profiles
- `profiles` - Extended user profiles
- `creators` - Creator accounts
- `categories` - Resource categories
- `tags` - Resource tags
- `listings` - Marketplace listings
- `listing_tags` - Many-to-many listing-tag relationships
- `collections` - User collections
- `collection_items` - Collection contents

#### Social & Engagement
- `follows` - User follow relationships
- `comments` - Listing comments with nested replies
- `reviews` - Listing reviews with ratings
- `bookmarks` - User bookmarks/wishlist
- `notifications` - User notifications

#### Commerce & Payments
- `transactions` - Purchase transactions
- `subscriptions` - User subscriptions
- `feature_entitlements` - Feature access by plan
- `stripe_customers` - Stripe customer records
- `stripe_events` - Stripe webhook events
- `billing_events` - Billing event logs
- `creator_accounts` - Stripe Connect accounts
- `payouts` - Creator payouts

#### Developer Platform
- `api_keys` - API key management
- `api_usage` - API usage tracking
- `api_logs` - API request logs
- `webhooks` - Webhook configurations
- `webhook_deliveries` - Webhook delivery logs
- `applications` - OAuth applications
- `oauth_tokens` - OAuth token storage
- `oauth_authorizations` - OAuth authorizations
- `mcp_servers` - MCP server definitions
- `mcp_tokens` - MCP authentication tokens
- `mcp_connections` - MCP connection records
- `mcp_usage` - MCP usage tracking

#### Content Management
- `downloads` - Download records
- `listing_versions` - Listing version history
- `assets` - Asset storage metadata

#### Security & Moderation
- `csrf_tokens` - CSRF protection
- `email_verifications` - Email verification tokens
- `password_resets` - Password reset tokens
- `moderation_reports` - User-reported content
- `content_flags` - Auto-flagged content

#### Analytics & Monitoring
- `analytics` - Platform analytics
- `page_views` - Page view tracking
- `analytics_events` - Custom analytics events
- `error_logs` - Error tracking
- `rate_limits` - Rate limit tracking
- `rate_limit_alerts` - Rate limit alerts

#### Referral & Affiliate
- `referral_codes` - User referral codes
- `referrals` - Referral relationships
- `affiliate_payouts` - Affiliate earnings

#### Email
- `email_logs` - Email delivery tracking

---

## AI Categorization Engine

The platform includes an AI-powered categorization engine that analyzes every marketplace listing and assigns relevant categories, tags, and topics.

### How it works

1. **Content extraction**: Reads the listing title, description, README, tags, topics, file names, folder structure, dependencies, and AI assistant hints.
2. **AI analysis**: Sends a structured prompt to Gemini (with OpenRouter/Cloudflare fallback) along with the official category list.
3. **Category assignment**: Returns 1–8 categories with confidence scores, reasons, and primary/secondary flags.
4. **Auto-tagging**: Generates searchable lowercase tags and topics.
5. **Database update**: Writes categories to `listing_categories`, tags to `tags`/`listing_tags`, and updates the listing's `search_vector`.

### Tables

- `listing_categories` — many-to-many relationship with confidence, reason, and AI/manual flags.
- `categorization_jobs` — background queue with retry, error tracking, and resume support.
- `listing_category_analysis` — snapshot of AI-generated tags/topics.

### API routes

- `POST /api/admin/categorize` — bulk queue listings.
- `POST /api/admin/categorize/:id` — categorize a single listing.
- `POST /api/admin/categorize/worker` — run a batch of pending jobs (admin auth or `x-admin-key`).
- `GET /api/admin/categorization-status` — job status.
- `GET /api/admin/categorization/uncategorized` — uncategorized listings.
- `GET /api/admin/categorization/low-confidence` — low-confidence assignments.

### Background worker

Run the worker locally:

```bash
node scripts/run-categorization-worker.mjs
```

Required env:

- `NEXT_PUBLIC_APP_URL`
- `ADMIN_SECRET_KEY`

### Admin UI

Visit `/admin/categorization` (obfuscated admin route) to view status, queue bulk jobs, run the worker, review uncategorized listings, and fix low-confidence categories.

### Category pages

Public category pages are generated at `/category/:slug` with sort tabs for Featured, Newest, Highest Rated, Most Installed, and Recently Updated.

---

## Features Implemented

### ✅ Phase 5: Security & Audit (Completed)
- Auto-redirect for authenticated users from marketing pages
- Fixed 7 function security vulnerabilities (mutable search_path)
- Comprehensive database audit (50+ tables verified)
- API routes audit (all endpoints secured)
- Auth routes audit (login, register, logout, password reset, email verification)
- RLS policies audit across all tables

### ✅ Phase 6: Core Features (Completed)

#### 6.1 Stripe Products & Price IDs
- **Status:** Pending (Manual step in Stripe Dashboard)
- **Required:** Create products and price IDs in Stripe Dashboard

#### 6.2 Stripe Connect for Creator Payouts
- Dynamic Stripe Express account creation per creator
- Onboarding flow with account links
- Status checking and verification tracking
- Creator account management

#### 6.3 Supabase Realtime for Live Updates
- Realtime subscription utilities
- Notification system with live updates
- Plan change instant propagation

#### 6.4 Feature Gate Audit
- Plan-based feature gating across all protected features
- `checkFeatureAccess` utility function
- `canCreateResource` for resource limits
- API key rate limit enforcement
- AI feature gating (description/tag generation)

#### 6.5 Real-time Notifications System
- Notification bell component with unread count
- Real-time subscription to notifications table
- Mark as read functionality
- Notification dropdown UI
- Integrated into AuthenticatedNavbar

#### 6.6 Analytics Dashboard for Creators
- Total views, sales, conversion rate
- Average rating, top listings
- Recent transactions
- Revenue tracking

#### 6.7 Advanced Search with Filters and Sorting
- Price range filters (min/max)
- Minimum rating filter
- Sorting options: Newest, Highest Rated, Most Reviews
- Enhanced search query with title and description

#### 6.8 Social Features
- Follow/unfollow creators
- Listing comments with nested replies
- Comment edit/delete
- Follower/following counts

#### 6.9 Review System with Rating Aggregation
- Purchase-verified reviews only
- One review per listing per user
- Automatic rating aggregation
- Average rating calculation
- Review count tracking

#### 6.10 Wishlist/Bookmarks
- Add/remove bookmarks
- User bookmark listing
- Duplicate prevention

#### 6.11 Download Management & Version History
- Download recording per purchase
- Version history for listings
- Version creation (creators only)
- Version deletion (creators only)
- File metadata tracking

#### 6.12 Creator Profile Pages
- Public creator profiles at `/creators/[id]`
- Portfolio display
- Creator stats (followers, downloads, ratings, listings)
- Follow button
- Website link

#### 6.13 Marketplace Analytics for Admin
- 8 metrics dashboard:
  - Total users
  - Total revenue
  - Revenue this month
  - Active listings
  - Total creators
  - Total downloads
  - Active subscriptions
  - Pending reviews
- Recent registrations
- Pending listings queue
- Platform alerts

#### 6.14 SEO Optimization
- Comprehensive metadata in `app/layout.tsx`
- Dynamic sitemap generation
- robots.txt configuration
- Structured data (JSON-LD) for WebSite schema
- Open Graph and Twitter card metadata

#### 6.15 Email Notifications System
- Edge Function: `email-notifications`
- Resend API integration
- Email logging table
- CORS support
- Graceful degradation when API key not configured

#### 6.16 Performance Monitoring and Error Tracking
- Centralized monitoring in `lib/monitoring/index.ts`
- Error logging (console in dev, Supabase in prod)
- Page view tracking
- Custom event tracking
- Performance monitoring class
- Database tables: error_logs, page_views, analytics_events

#### 6.17 A/B Testing Framework
- **Status:** Pending (Low priority)

#### 6.18 Multi-language Support (i18n)
- **Status:** Pending (Low priority)

#### 6.19 Referral/Affiliate Program
- Unique referral code generation (8-character codes)
- Referral code application during signup
- Self-referral prevention
- Duplicate referral prevention
- Referral stats tracking
- Commission tracking
- Affiliate payout management
- Tables: referral_codes, referrals, affiliate_payouts

#### 6.20 Content Moderation System
- User reporting for listings and comments
- Admin review workflow
- Content flagging system
- Auto-flag support
- Status tracking (pending, approved, rejected)
- Action taken logging
- Tables: moderation_reports, content_flags

---

## API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/confirm-reset` - Confirm password reset
- `POST /api/auth/verify-email` - Verify email

### Listings
- `GET /api/listings` - List all listings
- `POST /api/listings` - Create listing
- `GET /api/listings/[id]` - Get listing details
- `PATCH /api/listings/[id]` - Update listing
- `DELETE /api/listings/[id]` - Delete listing

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews` - Get reviews for listing

### Comments
- `POST /api/comments` - Create comment
- `GET /api/comments` - Get comments for listing
- `PATCH /api/comments` - Update comment
- `DELETE /api/comments` - Delete comment

### Bookmarks
- `POST /api/bookmarks` - Add bookmark
- `GET /api/bookmarks` - Get user bookmarks
- `DELETE /api/bookmarks` - Remove bookmark

### Follows
- `POST /api/follows` - Follow user
- `DELETE /api/follows` - Unfollow user
- `GET /api/follows` - Get follow status and counts

### Downloads
- `POST /api/downloads` - Record download
- `GET /api/downloads` - Get download history

### Versions
- `POST /api/versions` - Create listing version
- `GET /api/versions` - Get listing versions
- `DELETE /api/versions` - Delete version

### Stripe
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/customer-portal` - Open billing portal
- `POST /api/stripe/webhook` - Stripe webhook handler
- `POST /api/stripe/connect/onboard` - Creator onboarding
- `GET /api/stripe/connect/status` - Check account status

### Referrals
- `POST /api/referrals/code` - Generate referral code
- `GET /api/referrals/code` - Get referral code
- `POST /api/referrals/apply` - Apply referral code
- `GET /api/referrals/stats` - Get referral stats

### Moderation
- `POST /api/moderation/reports` - Create moderation report
- `GET /api/moderation/reports` - Get reports (admin)
- `PATCH /api/moderation/reports` - Update report (admin)

### Developer Platform
- `GET /api/keys` - List API keys
- `POST /api/keys` - Create API key
- `GET /api/keys/[id]` - Get API key
- `PATCH /api/keys/[id]` - Update API key
- `DELETE /api/keys/[id]` - Delete API key
- `GET /api/mcp` - List MCP servers
- `POST /api/mcp` - Create MCP server
- `GET /api/mcp/[id]` - Get MCP server
- `PATCH /api/mcp/[id]` - Update MCP server
- `DELETE /api/mcp/[id]` - Delete MCP server

### AI Features
- `POST /api/ai/generate-description` - Generate listing description
- `POST /api/ai/generate-tags` - Generate listing tags

---

## Environment Variables

### Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Stripe
```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_MONTHLY_PRICE_ID=
STRIPE_STARTER_YEARLY_PRICE_ID=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_YEARLY_PRICE_ID=
STRIPE_BUSINESS_MONTHLY_PRICE_ID=
STRIPE_BUSINESS_YEARLY_PRICE_ID=
```

### Optional
```
ADMIN_SECRET_ROUTE=  # For admin route protection
RESEND_API_KEY=      # For email notifications
```

---

## Plan Tiers

### FREE
- 0 API keys
- 0 listings
- 100MB storage
- Basic features

### STARTER ($9/mo or $90/yr)
- 5 API keys
- 10 listings
- 1GB storage
- AI features enabled

### PRO ($29/mo or $290/yr)
- 25 API keys
- 50 listings
- 5GB storage
- AI features enabled
- Priority support

### BUSINESS ($99/mo or $990/yr)
- Unlimited API keys
- Unlimited listings
- 50GB storage
- AI features enabled
- Priority support
- Custom integrations

---

## Security Features

### Authentication
- Supabase Auth integration
- Email verification
- Password reset flow
- Session management

### Authorization
- Row Level Security (RLS) on all tables
- Role-based access control (ADMIN, CREATOR, USER)
- API key authentication
- JWT verification

### CSRF Protection
- CSRF token generation
- Token validation on mutations

### Rate Limiting
- Per-endpoint rate limits
- Plan-based rate limits
- Rate limit alerts

### Input Validation
- Zod schema validation
- SQL injection prevention
- XSS protection

### Function Security
- SECURITY DEFINER on database functions
- Fixed search_path vulnerabilities
- Secure execution context

---

## Database Migrations

All migrations have been applied successfully:
- `phase2_subscriptions_billing_tables` - Billing tables
- `phase2_rls_policies` - RLS policies
- `20240620_add_stripe_columns_to_subscriptions` - Stripe columns
- `20240620_github_connections` - GitHub integration
- `20240621_schema_alignment_developer_platform` - Developer platform
- `20240621_schema_alignment_triggers` - Update triggers
- `20240621_fix_function_security` - Security fixes
- `add_monitoring_tables` - Monitoring tables
- `add_social_features_tables` - Social features
- `add_download_versions_table` - Version history
- `add_email_logs_table` - Email tracking
- `add_moderation_tables` - Content moderation
- `add_referral_affiliate_tables` - Referral system

---

## Components

### Layout
- `Navbar` - Public navigation
- `AuthenticatedNavbar` - Authenticated navigation with notification bell
- `AppSidebar` - Application sidebar
- `Footer` - Site footer

### UI Components (shadcn/ui)
- Button, Card, Input, Label
- DropdownMenu, Dialog, Sheet
- Form, Select, Switch
- Badge, Avatar, Skeleton
- And more...

### Custom Components
- `NotificationBell` - Real-time notification component
- `PricingClient` - Pricing page with toggle
- `BillingClient` - Billing management
- `ApiKeysClient` - API key management
- Creator dashboard components
- Admin dashboard components

---

## Pages

### Marketing Pages
- `/` - Homepage
- `/search` - Advanced search
- `/explore` - Trending content
- `/pricing` - Pricing page
- `/categories` - Category listings
- `/creators/[id]` - Creator profiles
- `/listing/[id]` - Listing details
- `/api-docs` - API documentation
- `/faq` - FAQ page
- `/about` - About page
- `/contact` - Contact page

### Protected Pages
- `/dashboard` - User dashboard
- `/creator/dashboard` - Creator dashboard
- `/creator/analytics` - Creator analytics
- `/creator/listings` - Creator listings
- `/creator/settings` - Creator settings
- `/developer/keys` - API keys
- `/developer/mcp` - MCP servers
- `/developer/billing` - Billing management
- `/admin/dashboard` - Admin dashboard
- `/admin/listings` - Admin listings
- `/admin/users` - Admin users
- `/admin/settings` - Admin settings
- `/notifications` - Notification center
- `/profile` - User profile

---

## Styling

### Design System
- Glass morphism effects
- Ambient glow backgrounds
- Noise overlay texture
- Fade-in animations
- Premium dark luxury theme

### Color Palette
- Primary: Text colors (primary, secondary, tertiary)
- Accent: CTA color for call-to-actions
- Surface: Background surfaces
- Background: Main background

### Animation Classes
- `animate-fade-in-up` - Fade in with upward motion
- `transition-smooth` - Smooth transitions
- `shadow-glow` - Glowing shadow effect

---

## Monitoring & Analytics

### Error Tracking
- Centralized error logging
- Console logging in development
- Supabase logging in production
- Error metadata capture

### Performance Monitoring
- Operation timing
- Slow operation detection
- Performance metrics logging

### Analytics Events
- Page view tracking
- Custom event tracking
- User behavior analytics

---

## Deployment

### Requirements
- Node.js 18+
- Supabase project
- Stripe account
- Vercel (or compatible hosting)

### Setup Steps
1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Run database migrations
5. Deploy to Vercel

### Environment Configuration
- Set all required environment variables
- Configure Stripe webhooks
- Set up Supabase Auth
- Configure storage buckets

---

## TODO Status

### Completed (18/20)
- ✅ Task 5.1: Auto-redirect for authenticated users
- ✅ Task 5.2: Supabase deployment audit
- ✅ Task 5.3: API routes audit
- ✅ Task 5.4: Auth routes audit
- ✅ Task 5.5: Security measures audit
- ✅ Task 5.6: Database schema audit
- ✅ Task 5.7: Update memory and documentation
- ✅ Task 5.8: Build next phase TODO list
- ✅ Task 6.2: Stripe Connect for creator payouts
- ✅ Task 6.3: Supabase Realtime for live updates
- ✅ Task 6.4: Feature gate audit
- ✅ Task 6.5: Real-time notifications system
- ✅ Task 6.6: Analytics dashboard for creators
- ✅ Task 6.7: Advanced search with filters and sorting
- ✅ Task 6.8: Social features (follow, comments)
- ✅ Task 6.9: Review system with rating aggregation
- ✅ Task 6.10: Wishlist/bookmarks functionality
- ✅ Task 6.11: Download management and version history
- ✅ Task 6.12: Creator profile pages with portfolio
- ✅ Task 6.13: Marketplace analytics for admin
- ✅ Task 6.14: SEO optimization
- ✅ Task 6.15: Email notifications system
- ✅ Task 6.16: Performance monitoring and error tracking
- ✅ Task 6.19: Referral/affiliate program
- ✅ Task 6.20: Content moderation system

### Pending (2/20)
- ⏳ Task 6.1: Create Stripe Products and Price IDs (Manual in Stripe Dashboard)
- ⏳ Task 6.17: Implement A/B Testing Framework (Low priority)
- ⏳ Task 6.18: Add Multi-language Support (i18n) (Low priority)

---

## Production Readiness Checklist

### Security
- ✅ RLS policies on all tables
- ✅ Function security fixes applied
- ✅ CSRF protection implemented
- ✅ Rate limiting configured
- ⚠️ Enable leaked password protection in Supabase Auth

### Payments
- ✅ Stripe Checkout integration
- ✅ Stripe Connect for creators
- ✅ Webhook handlers
- ⚠️ Create Stripe products and price IDs

### Monitoring
- ✅ Error tracking
- ✅ Performance monitoring
- ✅ Analytics events
- ✅ Email logging

### SEO
- ✅ Meta tags
- ✅ Sitemap
- ✅ robots.txt
- ✅ Structured data

### Content
- ✅ Moderation system
- ✅ Reporting system
- ✅ Auto-flagging support

### Social
- ✅ Follow system
- ✅ Comments with replies
- ✅ Reviews with ratings
- ✅ Bookmarks

### Developer Platform
- ✅ API key management
- ✅ MCP server management
- ✅ OAuth support
- ✅ Webhook support

---

## License

Proprietary - All rights reserved

---

## Support

For support, contact the MidasAI team or open an issue in the repository.
