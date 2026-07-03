# Blueprint: Enterprise Admin Panel Overhaul

## Objective

Transform the existing admin panel into a single, enterprise-grade control center where the platform owner can manage every aspect of MidasAI: users, roles, content, commerce, support, system health, storage, and projects.

## Scope

This is a multi-phase rebuild. Each phase is a production-ready PR. We will preserve the existing dark-luxury design system and the obfuscated admin route.

---

## Phase 1 — Admin Foundation

Goal: Unify the admin experience with a modern shell, shared data primitives, and an executive dashboard.

### Database / Config
- No schema changes required.
- Add a `site_settings` table row if missing for global toggles.

### Components
- Replace `AdminShell` with a collapsible, responsive admin sidebar with sections and icons.
- Introduce `AdminDataTable` component with:
  - Sortable headers
  - Text filters per column
  - Pagination (server-side)
  - Row selection + bulk actions
  - Export to CSV
- Introduce `AdminFilterBar` with quick filters and date range.
- Introduce `AdminConfirmModal` for destructive actions.
- Introduce `AdminEmptyState` and `AdminLoadingState`.

### Dashboard
- Redesign `/admin/dashboard` as an executive overview:
  - KPI cards (users, revenue, MRR, active listings, downloads, storage)
  - Trend charts (revenue, signups, events) using `recharts` or `BarChart` from `components/analytics`.
  - "Needs attention" alerts (pending listings, open reports, pending payouts, failed jobs, low storage)
  - Live activity feed (last 20 analytics events, moderation actions, transactions)

### Navigation
- Group nav items:
  - **Overview**: Dashboard, Analytics
  - **People**: Users, Roles, Creators, Support
  - **Commerce**: Payments, Subscriptions, Payouts, Billing Events
  - **Content**: Listings, Moderation, Categories, Announcements
  - **System**: Files, Audit Logs, System Health, Settings
  - **Tools**: Import, Categorization, Communications

### Verification
- Build passes.
- Dashboard renders all KPI cards.
- New data table component works on the Users page.

---

## Phase 2 — Users, Roles & Permissions

Goal: Full user lifecycle management with role-based access control.

### Database
- Extend `users` role enum or add `admin_permissions` table to grant granular section access (e.g., `users:read`, `users:write`, `payouts:write`).
- Add `user_bans` or `user_status` field for suspensions.
- Add `audit_logs` table (actor_id, action, target_type, target_id, metadata).

### API
- `POST /api/admin/users/[id]/role` — update role
- `POST /api/admin/users/[id]/ban` — suspend/unsuspend
- `POST /api/admin/users/[id]/impersonate` — generate a temporary session token
- `POST /api/admin/users/[id]/notify` — send user notification
- `GET /api/admin/users` — paginated, filterable, sortable

### UI
- `/admin/users` — enterprise data table:
  - Columns: name, email, role, status, created, last active, actions
  - Filters: role, status, date range, search
  - Bulk actions: change role, suspend, delete
- `/admin/users/[id]` — user detail page:
  - Profile summary
  - Role/permissions editor
  - Subscription & billing history
  - Purchases/downloads
  - Created listings
  - Activity log
  - Admin actions (suspend, notify, impersonate)
- `/admin/roles` — role & permission matrix.

### Verification
- Role change reflects in `users` table.
- Suspended users cannot log in.
- Audit log records every admin action.

---

## Phase 3 — Content & Commerce

Goal: Manage all marketplace content, transactions, and payouts.

### UI
- `/admin/listings` — full listing table with status, type, creator, price, downloads, rating.
  - Bulk actions: approve, reject, suspend, feature, delete
  - Quick view drawer
- `/admin/listings/[id]` — listing detail + edit, preview, review responses, download logs.
- `/admin/moderation` — reports queue with actions (resolve, escalate, remove, warn user).
- `/admin/categories` — manage categories, slugs, icons, active state.
- `/admin/transactions` — payments table with refund action, receipt view.
- `/admin/subscriptions` — subscription management, cancel/extend.
- `/admin/payouts` — payout queue, mark as paid, export.
- `/admin/creators` — creator account approval, verification, commission settings.

### API
- Bulk action endpoints for listings, payouts, moderation.
- Export endpoints for each table.

### Verification
- Admin can approve a pending listing from the table.
- Refund action updates transaction status and Stripe.
- Payout status changes reflect in creator dashboard.

---

## Phase 4 — System, Support & Announcements

Goal: Monitor platform health, support users, and broadcast updates.

### Database
- `support_tickets` table (user_id, subject, status, priority, messages jsonb).
- `platform_announcements` already exists; extend with targeting and scheduling.

### UI
- `/admin/health` — system status:
  - Supabase connection
  - Stripe webhook status
  - Recent errors / failed jobs
  - Queue lengths
  - Storage usage
- `/admin/audit-logs` — searchable table of all admin actions.
- `/admin/support` — ticket queue:
  - List, filter by status/priority
  - Ticket detail with reply thread
  - Assign to admin
- `/admin/announcements` — create, schedule, publish platform announcements.
- `/admin/settings` — global configuration:
  - Feature flags
  - Maintenance mode
  - Marketplace settings
  - Admin route prefix display

### API
- `POST /api/admin/support/tickets/[id]/reply`
- `POST /api/admin/announcements`
- `GET /api/admin/health`

### Verification
- Ticket reply updates `support_tickets`.
- Announcement appears in the user announcement banner.
- Audit log shows every action.

---

## Phase 5 — Storage, Import & Projects

Goal: Manage every file, import, and Architect project.

### UI
- `/admin/files` — storage browser:
  - List all assets by bucket
  - Search, filter by type
  - Preview, delete, replace
  - Storage usage breakdown
- `/admin/import` — import tools:
  - GitHub import queue
  - Marketplace scraper controls
  - Categorization worker status
  - Bulk import from CSV/JSON
- `/admin/projects` — Architect projects:
  - List all `architect_sessions` and `workflow_expansions`
  - View session transcripts, generated files
  - Export or delete projects
  - Monitor background job queue

### API
- `GET /api/admin/files` — list storage objects
- `POST /api/admin/files/[id]/delete`
- `POST /api/admin/import/run`
- `GET /api/admin/projects` — list sessions/expansions

### Verification
- Admin can delete an asset from storage.
- Import job status updates in real time.
- Project list loads with session metadata.

---

## Anti-patterns

- Do not hard-code the admin route prefix anywhere except `lib/admin-route.ts`.
- Do not expose service-role keys to client components.
- Do not allow destructive actions without a confirmation modal.
- Do not build admin APIs without permission checks.
- Do not use mock data; every page queries real tables.

## First Slice

Start with **Phase 1 — Admin Foundation**:
1. Refactor `AdminShell` into a sectioned sidebar.
2. Build `AdminDataTable` and `AdminFilterBar`.
3. Redesign the dashboard with KPI cards, charts, and an attention panel.
4. Apply the shared table to the existing Users page.

Done when: the admin dashboard shows unified KPI cards, the sidebar is sectioned, and the Users page uses the new data table with pagination and search.

## Phase 1 Status: COMPLETE

- Sidebar is now sectioned into Overview, People, Commerce, Content, System, Tools & Storage.
- New `AdminDataTable` component with sorting, per-column filters, pagination, and CSV export.
- Dashboard redesigned with 8 KPI cards, revenue/signup trends, top events, and recent activity feed.
- Users page converted to the new data table.
- New pages added: Creators, Categories, Announcements, System Health, Projects.
- Build passes.

