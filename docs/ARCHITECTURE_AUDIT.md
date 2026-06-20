# Architecture Audit - MidasAI

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.0.0 |
| Language | TypeScript | 5.x |
| UI Library | React | 18.3.1 |
| Styling | Tailwind CSS | 3.4.x |
| Component Library | Shadcn UI (Radix primitives) | Latest |
| Database | Supabase (PostgreSQL) | 2.43.4 |
| Auth | Supabase SSR Auth | 0.4.0 |
| Icons | Lucide React | 0.424.0 |
| Validation | Zod | 3.23.8 |

## Project Structure

```
midasai/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   │   ├── analyze/        # AI analysis endpoint
│   │   ├── ai-review/      # AI review scoring
│   │   ├── bookmarks/      # Bookmark toggle API
│   │   ├── notifications/  # Notification management API
│   │   ├── quality-control/# Quality scoring
│   │   ├── reject/         # Listing rejection
│   │   ├── search/         # Search with filters
│   │   └── test-sandbox/   # Test sandbox endpoint
│   ├── auth/               # Authentication pages
│   ├── admin/              # Admin dashboard & management
│   ├── creator/            # Creator portal
│   ├── dashboard/          # User dashboard
│   ├── listing/[id]/       # Dynamic listing detail
│   ├── search/             # Search page
│   ├── skills/             # Category: Claude Skills
│   ├── plugins/            # Category: Cursor Rules
│   ├── mcp/                # Category: MCP Servers
│   ├── agents/             # Category: AI Agents
│   ├── workflows/          # Category: Workflows
│   ├── templates/          # Category: Templates
│   ├── prompts/            # Category: Prompts
│   ├── bookmarks/          # User bookmarks
│   ├── notifications/      # User notifications
│   ├── profile/            # User profile
│   ├── settings/           # User settings
│   ├── pricing/            # Pricing page
│   ├── about/              # About page
│   ├── blog/               # Blog page
│   ├── contact/            # Contact page
│   ├── trending/           # Trending listings
│   ├── featured/           # Featured listings
│   ├── collections/        # Collections
│   └── categories/         # All categories
├── components/
│   ├── layout/             # Navbar, Footer
│   └── ui/                 # Shadcn UI components
├── lib/
│   └── supabase/           # Client, Server, Middleware
├── supabase/
│   └── schema.sql          # Database schema (26 tables)
├── types/
│   └── database.ts         # TypeScript database types
└── public/                 # Static assets
```

## Database Schema (26 tables)

### Core Tables
- `users` - User accounts with role enum
- `profiles` - Extended user profiles (bio, links)
- `user_settings` - User preferences
- `creators` - Creator-specific profiles

### Marketplace Tables
- `listings` - Marketplace listings
- `categories` - Listing categories
- `tags` / `listing_tags` - Tag system
- `reviews` - User reviews with ratings
- `bookmarks` - Saved listings
- `downloads` - Download tracking
- `collections` / `collection_items` - Curated collections

### Commerce Tables
- `transactions` - Purchase records
- `subscriptions` - Subscription management

### System Tables
- `notifications` - User notifications
- `notification_preferences` - Notification settings
- `messages` - User messaging
- `analytics` - Event tracking
- `audit_logs` - System audit trail
- `site_settings` - Platform configuration
- `assets` - File/media assets

### New Tables (Added)
- `followers` - User follow relationships
- `listing_versions` - Version history for listings
- `dashboard_preferences` - Dashboard layout preferences

## Authentication Architecture

- **Client**: `@supabase/ssr` browser client with cookie-based sessions
- **Server**: Server-side Supabase client using `cookies()` from Next.js
- **Middleware**: Session refresh + route protection (/dashboard, /creator, /admin)
- **Registration**: Creates user + profile + user_settings records

## Design System

- **Colors**: OLED Black (#09090B), Midas Gold (#CA8A04), Glass morphism
- **Fonts**: Poppins (headings), Open Sans (body)
- **Effects**: Ambient glow, noise overlay, glass borders, shadow-glow
- **Animations**: fade-in-up, scale-in, shimmer, pulse-glow, float

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/search` | GET | Full-text search with filters |
| `/api/analyze` | POST | AI repository analysis |
| `/api/ai-review` | POST | AI quality review scoring |
| `/api/quality-control` | POST | Quality validation |
| `/api/bookmarks` | POST | Toggle bookmark |
| `/api/notifications` | PATCH | Mark notifications read |
| `/api/reject` | POST | Admin listing rejection |
| `/api/test-sandbox` | POST | Test sandbox environment |
