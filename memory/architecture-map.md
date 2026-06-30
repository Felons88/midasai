# MidasAI Architecture Map

## Date
2025-01-19

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI (Radix UI primitives)
- **Fonts**: Poppins (headings), Open Sans (body)

### Backend
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **ORM**: None (direct Supabase client)
- **API**: Next.js App Router (planned)

### Infrastructure
- **Hosting**: Vercel (implied by Next.js)
- **Database**: Supabase
- **Storage**: Supabase Storage (planned)

---

## Database Schema

### Tables
- **users**: User profiles with roles (USER, CREATOR, ADMIN)
- **categories**: Marketplace categories
- **listings**: Marketplace listings (SKILL, PLUGIN, MCP, AGENT, PROMPT, WORKFLOW, TEMPLATE)
- **reviews**: User reviews for listings
- **bookmarks**: User bookmarks for listings
- **notifications**: User notifications
- **site_settings**: Platform configuration

### RLS Policies
- Users can view/edit own data
- Listings are publicly viewable, creators can manage own listings
- Reviews are publicly viewable, users can manage own reviews
- Bookmarks are private to user
- Notifications are private to user
- Site settings are publicly viewable

---

## Route Structure

### Public Routes (18)
- `/` - Homepage
- `/skills` - Skills directory
- `/plugins` - Plugins directory
- `/mcp` - MCP Servers directory
- `/agents` - AI Agents directory
- `/prompts` - Prompts directory
- `/workflows` - Workflows directory
- `/templates` - Templates directory
- `/collections` - Collections browse
- `/categories` - Categories browse
- `/trending` - Trending listings
- `/featured` - Featured listings
- `/search` - Search page
- `/pricing` - Pricing page
- `/blog` - Blog page
- `/docs` - Documentation
- `/about` - About page
- `/contact` - Contact page

### Authentication Routes (4)
- `/auth/login` - Login
- `/auth/register` - Register
- `/auth/forgot-password` - Forgot password
- `/auth/reset-password` - Reset password

### Protected User Routes (5)
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/settings` - User settings
- `/notifications` - User notifications
- `/bookmarks` - User bookmarks

### Protected Creator Routes (4)
- `/creator/dashboard` - Creator dashboard
- `/creator/upload` - Upload new listing
- `/creator/listings` - Manage listings
- `/creator/analytics` - Creator analytics

### Protected Admin Routes (4)
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - User management
- `/admin/listings` - Listing management
- `/admin/settings` - Platform settings

### Marketplace Routes (1)
- `/listing/[id]` - Listing detail page

---

## Design System

### Theme
- **Mode**: Dark (forced in layout.tsx)
- **Style**: Glassmorphism with premium dark luxury aesthetic
- **Primary Color**: Blue (#3B82F6)
- **Background**: Dark (#0F172A)
- **Card Background**: Dark (#1E293B)

### Typography
- **Headings**: Poppins (400, 500, 600, 700)
- **Body**: Open Sans (300, 400, 500, 600, 700)

### Components
- Button, Card, Input, Label, Dropdown Menu (Shadcn UI)

---

## Current Data Flow

### Authentication
1. User registers → Supabase Auth creates user
2. User profile created in `users` table
3. Session stored in cookies
4. Middleware validates session on protected routes

### Current Limitations
- No real database queries in pages
- All data is hardcoded/mock
- No API routes
- No server actions
- No edge functions
- No real-time features
