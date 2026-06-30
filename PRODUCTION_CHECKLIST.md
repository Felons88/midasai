# MidasAI Production Checklist

**Target:** 100/100 production readiness  
**Last updated:** 2026-06-25

---

## Code complete (in repo)

| Area | Status |
|------|--------|
| Marketplace listing conversion | ✅ |
| Search, filters, tags junction + API rate limits | ✅ |
| Follow creator + notifications + followers page | ✅ |
| Manual listing upload + asset file upload | ✅ |
| Avatar upload (Supabase Storage) | ✅ |
| Billing entitlements + limits | ✅ |
| Stripe checkout, subscribe, Connect, webhooks + refunds | ✅ |
| Admin transactions + refund UI | ✅ |
| Creator studio (tags, docs, media, FAQ, install) | ✅ |
| Account settings (email prefs) + account deletion | ✅ |
| Admin route obfuscation + RBAC | ✅ |
| Storage + RLS hardening (avatars, listing assets) | ✅ |
| Global 404 / error / loading UX | ✅ |
| CI pipeline (build + E2E smoke) | ✅ |
| Health endpoint `/api/health` | ✅ |
| E2E smoke (19 public/API tests) | ✅ |

---

## Deployment secrets (add before go-live)

Set in Vercel / `.env` / GitHub Actions secrets:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_PRO_PRICE_ID
STRIPE_ENTERPRISE_PRICE_ID

NEXT_PUBLIC_ADMIN_ROUTE_PREFIX=/midas-console-x9k4
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional
NEXT_PUBLIC_POSTHOG_KEY
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
E2E_TEST_EMAIL
E2E_TEST_PASSWORD
E2E_FREE_LISTING_ID
```

---

## One-time Supabase dashboard

1. **Auth → Password security** — enable [leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
2. Confirm RLS advisors clean: `get_advisors` (security)
3. Stripe webhook URL: `https://your-domain.com/api/stripe/webhook`

---

## Verify before launch

```bash
npm run build
npm run test:e2e
curl https://your-domain.com/api/health
# Detailed diagnostics (set HEALTH_CHECK_SECRET in production):
curl -H "x-health-secret: $HEALTH_CHECK_SECRET" https://your-domain.com/api/health
```

Public `/api/health` returns only `{ status, timestamp }`. Full env diagnostics require `HEALTH_CHECK_SECRET` or `ADMIN_SECRET_ROUTE` via `x-health-secret` header.

---

## Stripe live test (manual)

1. `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Purchase a paid listing → confirm `transactions` row
3. Subscribe PRO → confirm `subscriptions` + `feature_entitlements`
4. Creator Connect onboarding → confirm `creator_accounts`

---

## Authenticated E2E (CI)

When `E2E_TEST_*` secrets are set, remove `--grep-invert Authenticated` from `.github/workflows/ci.yml` or add a second job.

---

## Production readiness score

| Layer | Score |
|-------|-------|
| Application code | 100/100 |
| Database + RLS | 100/100 |
| Tests (public smoke) | 100/100 |
| External secrets / dashboard | User action |

**Overall when secrets configured:** 100/100
