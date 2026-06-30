# MidasAI Production Audit

**Date:** 2026-06-20
**Auditor:** Claude Code
**Branch:** main
**Commit:** 8ab27f3 + uncommitted layout refactor

---

## Executive Summary

**Production Readiness Score: 42/100 (Blocked — do not ship)**

The platform has a solid Next.js 15 + Supabase foundation, a clean UI, and most marketplace pages are wired to real database queries. However, the live database is almost empty, several critical tables from the codebase schema are missing in the actual database, external integrations (GitHub, Gemini, Stripe) are not configured, and the developer platform is built against tables that do not exist. The recent layout refactor builds cleanly and removes duplicate navbars, but it is not yet committed or deployed.

---

## Working Systems

| System | Status | Evidence |
|--------|--------|----------|
| Next.js 15 app structure | Working | `package.json`, `app/` route groups |
| Supabase Auth client/server setup | Working | `lib/supabase/server.ts`, `lib/supabase/client.ts`, `middleware.ts` |
| User/role schema | Working | `public.users` exists, `role_enum` has USER/CREATOR/ADMIN/OWNER |
| Categories & tags seed data | Working | `categories` = 12 rows, `tags` = 50 rows |
| Marketplace pages query real data | Working | `app/(marketing)/page.tsx`, `skills/page.tsx`, `search/page.tsx` use Supabase |
| Route group layout refactor | Working | `app/(marketing)/layout.tsx` (Navbar + Footer), `app/(protected)/layout.tsx` (Sidebar + TopBar), root layout is plain HTML |
| ESLint | Working | `npm run lint` passes after apostrophe fixes |
| Production build | Working | `npm run build` exits 0 |
| GitHub OAuth code | Code exists | `app/api/github/callback/route.ts`, `supabase/functions/github/*` |
| MCP server edge function code | Code exists | `supabase/functions/mcp/index.ts` |
| Stripe account | Connected | Stripe MCP returned account `acct_1QwF09HIviwxEURf` |

---

## Broken Systems

| System | Problem | Impact |
|--------|---------|--------|
| Database schema drift | `schema.sql` defines `api_keys`, `webhooks`, `applications`, `mcp_servers`, `mcp_tokens`, `usage_records`, `payouts`, but none exist in the live DB | Developer platform, MCP, webhooks, and payouts pages will crash or return empty data |
| Empty marketplace | `users` = 0, `listings` = 0, `downloads` = 0, `reviews` = 0 | All marketplace pages render empty states; no discoverable content |
| GitHub OAuth | `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are empty in `.env` | GitHub connect, repo select, and upload flow will fail at token exchange |
| Gemini AI | `GEMINI_API_KEY` is empty in `.env` | Repo analysis, tag/description/category generation are fake/dead |
| Stripe in project | No Stripe keys in `.env` and no Stripe checkout/webhook code in the project | No payments, no subscriptions, no creator payouts |
| Payouts page | Queries `payouts` table which does not exist | `/creator/payouts` will error |
| `/support` route | Referenced in `AppSidebar` but no page exists | 404 from sidebar |
| Link inconsistency | `skills/page.tsx` links to `/details/${id}`; public route is `/listing/[id]` | Broken navigation from skills grid |
| Admin route | `ADMIN_ROUTE=/admin` in `.env` violates requirements for hidden configurable admin route | Security/predictable admin exposure |

---

## Fake / Placeholder Implementations

| Location | What is fake | Why |
|----------|--------------|-----|
| `app/(marketing)/blog/page.tsx` | "Blog coming soon" placeholder | No CMS or real blog content |
| `app/(marketing)/docs/page.tsx` | Static docs placeholder | No real documentation content |
| `app/(marketing)/about/page.tsx` | Static marketing copy | Fine for launch, but not a real dynamic system |
| `app/(protected)/creator/payouts/page.tsx` | Reads from non-existent `payouts` table | Will return zeros or error |
| `components/layout/AppSidebar.tsx` | Subscription tier and storage usage are hardcoded | No real subscription/storage backend |
| `supabase/functions/mcp/index.ts` | Inserts into `mcp_servers` / `mcp_tokens` tables that do not exist | Runtime DB errors |
| `supabase/functions/github/scan-repo.ts` | Calls Gemini for analysis but `GEMINI_API_KEY` is empty | Analysis will fail or return fake data |
| Search page | No full-text search; uses `ilike('title', ...)` only | Weak search, no ranking |
| Analytics | `analytics` table exists but has 0 rows; no event tracking code found | No real analytics collection |

---

## Missing Integrations

| Integration | Status | Notes |
|-------------|--------|-------|
| GitHub OAuth credentials | Missing | Need `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and callback URL in GitHub app settings |
| Gemini API key | Missing | Need `GEMINI_API_KEY` with Gemini 2.5 Flash access |
| Stripe keys | Missing | Need `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Stripe Connect | Missing | Creator payouts require Stripe Connect onboarding |
| Stripe checkout | Missing | No checkout session creation code |
| Stripe webhooks | Missing | No webhook handler route |
| Email provider | Missing | No Resend/SendGrid/Postmark setup |
| Real-time notifications | Missing | No Supabase realtime subscription for notifications |
| File upload / Supabase Storage | Missing | No storage bucket setup for listing assets |
| Search indexing | Missing | No pgvector or full-text search index |

---

## Production Readiness Scores

| Area | Score | Notes |
|------|-------|-------|
| Auth | 65/100 | Supabase Auth works, login/register code exists, role enum exists, but role upgrade flow and email verification not verified |
| Database | 40/100 | Core tables exist, but schema drift is severe; developer tables missing; zero user/listing data |
| Upload | 30/100 | GitHub upload code exists but requires GitHub + Gemini which are not configured; no ZIP/local upload flow |
| GitHub | 20/100 | Callback code exists, credentials missing, tables missing, no verified end-to-end flow |
| Gemini | 10/100 | Dependency installed, key missing, no verified analysis |
| Payments | 5/100 | Stripe account exists but no project keys, no checkout, no webhooks |
| Marketplace | 55/100 | Pages are real-query-driven, but DB is empty and search is weak |
| Analytics | 15/100 | Table exists, no event tracking code, 0 rows |
| Developer Platform | 25/100 | UI exists, edge functions exist, but DB tables are missing |
| Admin Platform | 30/100 | Pages exist, admin route is predictable, no audit logging verified |
| Layout / Navigation | 80/100 | Refactored to route groups, builds cleanly, no duplicate navbars |
| SEO | 20/100 | Only root metadata exists; no dynamic metadata, sitemap, or robots.txt |

**Overall: 42/100 — Blocked**

---

## Database Evidence

### Tables that exist in live DB
`analytics`, `assets`, `audit_logs`, `bookmarks`, `categories`, `collection_items`, `collections`, `creators`, `downloads`, `github_connections`, `listing_tags`, `listings`, `messages`, `notifications`, `profiles`, `reviews`, `site_settings`, `subscriptions`, `tags`, `transactions`, `user_settings`, `users`

### Tables defined in `schema.sql` but missing from live DB
`api_keys`, `webhooks`, `applications`, `mcp_servers`, `mcp_tokens`, `usage_records`, `payouts`

### Row counts
| Table | Rows |
|-------|------|
| users | 0 |
| listings | 0 |
| creators | 0 |
| downloads | 0 |
| reviews | 0 |
| bookmarks | 0 |
| transactions | 0 |
| analytics | 0 |
| github_connections | 0 |
| categories | 12 |
| tags | 50 |
| site_settings | 1 |

---

## Environment Variables

| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Present |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Present |
| `GEMINI_API_KEY` | **Empty** |
| `GITHUB_CLIENT_ID` | **Empty** |
| `GITHUB_CLIENT_SECRET` | **Empty** |
| `STRIPE_PUBLISHABLE_KEY` | **Missing** |
| `STRIPE_SECRET_KEY` | **Missing** |
| `STRIPE_WEBHOOK_SECRET` | **Missing** |
| `ADMIN_ROUTE` | `/admin` (security violation) |

---

## Build & Lint Status

- `npm run lint` — **PASS** (after fixing apostrophe errors)
- `npm run build` — **PASS** (exit code 0)
- Vercel CLI — 54.1.0 installed

---

## Critical Blockers Before Launch

1. **Apply full database schema** — `api_keys`, `webhooks`, `applications`, `mcp_servers`, `mcp_tokens`, `usage_records`, `payouts` must exist in the live DB.
2. **Configure GitHub OAuth** — add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to `.env` and set the callback URL in the GitHub app.
3. **Configure Gemini** — add `GEMINI_API_KEY` and verify repo analysis end-to-end.
4. **Configure Stripe** — add keys, build checkout flow, and implement webhook handler.
5. **Fix schema drift** — either remove developer-platform code until tables exist, or apply the missing migrations.
6. **Fix `/creator/payouts`** — it queries a missing `payouts` table.
7. **Fix `/support` route** — add the page or remove the sidebar link.
8. **Fix admin route** — move from `/admin` to a hidden env-based route.
9. **Seed marketplace data** — without listings, the marketplace is empty.
10. **Add real analytics event tracking** — currently only an empty table exists.

---

## Next Action

Apply the missing database migrations first. Every external integration and developer feature depends on the schema being correct. Do not configure GitHub/Gemini/Stripe until the tables their code touches actually exist.
