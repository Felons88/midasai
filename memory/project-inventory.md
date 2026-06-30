# MidasAI Project Inventory

**Date:** 2026-06-20
**Phase:** Phase 1 - Project Inventory

---

## Routes

### Public Routes (24)
- `/` - Homepage
- `/skills` - Skills marketplace
- `/plugins` - Plugins marketplace
- `/mcp` - MCP servers marketplace
- `/agents` - Agents marketplace
- `/prompts` - Prompts marketplace
- `/workflows` - Workflows marketplace
- `/templates` - Templates marketplace
- `/collections` - Collections
- `/categories` - Categories
- `/trending` - Trending items
- `/featured` - Featured items
- `/search` - Search page
- `/pricing` - Pricing page
- `/blog` - Blog
- `/docs` - Documentation
- `/api-docs` - API documentation
- `/about` - About page
- `/contact` - Contact page
- `/listing/[id]` - Listing detail page
- `/explore` - Explore page

### Authentication Routes (4)
- `/auth/login` - Login
- `/auth/register` - Register
- `/auth/logout` - Logout
- `/auth/layout` - Auth layout

### Protected User Routes (5)
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/settings` - User settings
- `/bookmarks` - Bookmarks
- `/notifications` - Notifications

### Protected Creator Routes (5)
- `/creator/dashboard` - Creator dashboard
- `/creator/listings` - Creator listings
- `/creator/upload` - Upload flow
- `/creator/analytics` - Creator analytics
- `/creator/payouts` - Creator payouts

### Protected Developer Routes (7)
- `/developer` - Developer portal
- `/developer/keys` - API keys
- `/developer/keys/new` - Create API key
- `/developer/webhooks` - Webhooks
- `/developer/webhooks/new` - Create webhook
- `/developer/applications` - OAuth applications
- `/developer/applications/new` - Create application
- `/developer/mcp` - MCP servers
- `/developer/mcp/new` - Connect MCP server
- `/developer/usage` - Usage analytics
- `/developer/billing` - Billing

### Protected Admin Routes (4)
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - User management
- `/admin/listings` - Listing management
- `/admin/settings` - Site settings

### Additional Protected Routes (5)
- `/downloads` - Downloads
- `/messages` - Messages
- `/collections` - Collections
- `/purchases` - Purchases
- `/account/*` - Account sub-routes

**Total Routes:** 54 page routes

---

## Components

### Layout Components (7)
- `Navbar` - Public navigation
- `Footer` - Public footer
- `Sidebar` - Protected sidebar
- `TopBar` - Protected top bar
- `AppSidebar` - Application sidebar
- `AuthenticatedNavbar` - Authenticated navigation
- `AuthenticatedShell` - Authenticated wrapper
- `DeveloperSidebar` - Developer-specific sidebar

### Marketplace Components (3)
- `PurchaseFlow` - Purchase flow component
- `DownloadFlow` - Download flow component
- `BookmarkFlow` - Bookmark flow component

### Creator Components (1)
- `CreatorOnboarding` - Creator onboarding

### Developer Components (1)
- `DeveloperOnboarding` - Developer onboarding

### UI Components (13 - shadcn/ui)
- `Button`
- `Card`
- `Input`
- `Label`
- `Select`
- `Badge`
- `DropdownMenu`
- `Separator`
- `Textarea`
- `AnimatedBackground`
- `UploadModal`

**Total Components:** 25+

---

## Database Tables

### Core Tables (7)
- `users` - User accounts
- `categories` - Marketplace categories
- `listings` - Marketplace listings
- `reviews` - Listing reviews
- `bookmarks` - User bookmarks
- `notifications` - User notifications
- `tags` - Listing tags

### User Management Tables (3)
- `profiles` - User profiles
- `creators` - Creator profiles
- `user_settings` - User settings

### Marketplace Tables (7)
- `listing_tags` - Listing-tag relationships
- `collections` - User collections
- `collection_items` - Collection items
- `downloads` - Download records
- `messages` - User messages
- `analytics` - Listing analytics
- `assets` - Listing assets

### Financial Tables (2)
- `transactions` - Financial transactions
- `subscriptions` - User subscriptions

### Developer Platform Tables (12)
- `api_keys` - API keys
- `api_usage` - API usage records
- `api_logs` - API logs
- `webhooks` - Webhooks
- `webhook_deliveries` - Webhook deliveries
- `applications` - OAuth applications
- `oauth_tokens` - OAuth tokens
- `mcp_servers` - MCP servers
- `mcp_tokens` - MCP tokens
- `mcp_connections` - MCP connections
- `mcp_usage` - MCP usage
- `payouts` - Creator payouts
- `usage_records` - General usage records

### Integration Tables (5)
- `github_connections` - GitHub OAuth connections
- `stripe_customers` - Stripe customers
- `stripe_events` - Stripe event log
- `billing_events` - Billing events
- `creator_accounts` - Stripe Connect accounts
- `feature_entitlements` - Subscription feature entitlements

### Additional Tables (2)
- `site_settings` - Site configuration
- `audit_logs` - Audit log

**Total Tables:** 39

---

## Edge Functions

### Deployed (3)
- `github-auth` - GitHub OAuth authentication
- `github-repos` - Fetch GitHub repositories
- `github-scan-repo` - Scan GitHub repository

### Not Deployed (9)
- `api-keys` - API key creation and management
- `api-keys/manage` - API key management
- `applications` - OAuth application management
- `applications/authorize` - OAuth authorization
- `webhooks` - Webhook management
- `webhooks/deliver` - Webhook delivery
- `mcp` - MCP server management
- `mcp/connect` - MCP server connection
- `mcp/usage` - MCP usage tracking
- `usage/track` - General usage tracking

**Total Edge Functions:** 12
**Deployed:** 3 (25%)
**Not Deployed:** 9 (75%)

---

## Environment Variables

### Configured (3)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `ADMIN_ROUTE` - Admin route path

### Missing/Empty (10)
- `GEMINI_API_KEY` - Gemini AI API key
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `STRIPE_STARTER_MONTHLY_PRICE_ID` - Stripe Starter monthly price
- `STRIPE_STARTER_YEARLY_PRICE_ID` - Stripe Starter yearly price
- `STRIPE_PRO_MONTHLY_PRICE_ID` - Stripe Pro monthly price
- `STRIPE_PRO_YEARLY_PRICE_ID` - Stripe Pro yearly price
- `STRIPE_BUSINESS_MONTHLY_PRICE_ID` - Stripe Business monthly price
- `STRIPE_BUSINESS_YEARLY_PRICE_ID` - Stripe Business yearly price

### Not in .env (1)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

**Total Environment Variables:** 14
**Configured:** 3 (21%)
**Missing/Empty:** 11 (79%)

---

## External Services

### Supabase
- **Database:** ✅ CONFIGURED
- **Auth:** ✅ CONFIGURED
- **Storage:** ❌ NOT CONFIGURED
- **Realtime:** ❌ NOT CONFIGURED
- **Edge Functions:** ⚠️ PARTIAL (3/12 deployed)

### Stripe
- **Payments:** ❌ NOT CONFIGURED
- **Subscriptions:** ⚠️ PARTIAL (code exists, credentials missing)
- **Webhooks:** ⚠️ PARTIAL (code exists, credentials missing)
- **Connect:** ❌ NOT CONFIGURED

### GitHub
- **OAuth:** ⚠️ PARTIAL (code exists, credentials missing)
- **API:** ⚠️ PARTIAL (code exists, credentials missing)
- **Webhooks:** ❌ NOT CONFIGURED

### Gemini AI
- **API:** ❌ NOT CONFIGURED
- **Analysis:** ❌ NOT IMPLEMENTED

### Email
- **Provider:** ❌ NOT CONFIGURED
- **Templates:** ❌ NOT IMPLEMENTED
- **Sending:** ❌ NOT IMPLEMENTED

**Total External Services:** 5
**Fully Configured:** 0 (0%)
**Partially Configured:** 3 (60%)
**Not Configured:** 2 (40%)

---

## API Routes

### Authentication (1)
- `/api/github/callback` - GitHub OAuth callback

### Stripe (3)
- `/api/stripe/checkout` - Stripe checkout
- `/api/stripe/customer-portal` - Stripe customer portal
- `/api/stripe/webhook` - Stripe webhook

### AI (1)
- `/api/ai-review` - AI review for listings

**Total API Routes:** 5

---

## Summary

### Routes
- **Total:** 54
- **Public:** 24
- **Protected:** 30

### Components
- **Total:** 25+
- **Layout:** 7
- **Marketplace:** 3
- **UI:** 13

### Database
- **Total Tables:** 39
- **RLS Enabled:** 39/39 (100%)

### Edge Functions
- **Total:** 12
- **Deployed:** 3 (25%)
- **Not Deployed:** 9 (75%)

### Environment Variables
- **Total:** 14
- **Configured:** 3 (21%)
- **Missing/Empty:** 11 (79%)

### External Services
- **Total:** 5
- **Fully Configured:** 0 (0%)
- **Partially Configured:** 3 (60%)
- **Not Configured:** 2 (40%)

### API Routes
- **Total:** 5
