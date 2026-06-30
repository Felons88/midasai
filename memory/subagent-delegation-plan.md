# Subagent Delegation Plan

**Date:** 2026-06-20
**Purpose:** Delegate Priority 0 tasks to GitHub Copilot agents

---

## Delegation Strategy

**Tool:** GitHub Copilot Coding Agent (via `mcp0_assign_copilot_to_issue`)
**Repository:** Felons88/midasai
**Base Branch:** main

Each Priority 0 task will be:
1. Created as a GitHub issue with detailed specifications
2. Assigned to GitHub Copilot agent
3. Copilot will create a pull request with implementation
4. Pull request will be reviewed and merged

---

## Task 0.1: Configure Environment Variables

**GitHub Issue Title:** Configure all missing environment variables

**Issue Body:**
```
Configure all missing environment variables in Vercel and local development environment.

**Required Variables:**
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- GEMINI_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_STARTER_MONTHLY_PRICE_ID
- STRIPE_STARTER_YEARLY_PRICE_ID
- STRIPE_PRO_MONTHLY_PRICE_ID
- STRIPE_PRO_YEARLY_PRICE_ID
- STRIPE_BUSINESS_MONTHLY_PRICE_ID
- STRIPE_BUSINESS_YEARLY_PRICE_ID
- SUPABASE_SERVICE_ROLE_KEY

**Acceptance Criteria:**
- All variables added to Vercel environment variables
- All variables added to local .env.local
- GitHub OAuth flow tested and working
- Stripe checkout flow tested and working
- Gemini API integration tested and working
- Service role client verified working

**Files to Update:**
- .env.local (add missing variables)
- Documentation (update environment variable guide)

**Do NOT:**
- Commit actual secret values to repository
- Share credentials in issue or PR
```

**Custom Instructions:**
```
Create environment variable documentation but do not include actual secret values. Update .env.local.example with placeholder values.
```

---

## Task 0.2: Implement Role-Based Access Control

**GitHub Issue Title:** Implement role-based access control in middleware

**Issue Body:**
```
Add role verification to middleware and protected route layouts to prevent unauthorized access.

**Current State:**
Middleware only checks authentication, not authorization. Any authenticated user can access admin, creator, and developer routes.

**Desired State:**
Middleware checks both authentication and authorization based on user roles.

**Requirements:**
- Update middleware.ts to check user role
- Add role check to admin route layout
- Add role check to creator route layout
- Add role check to developer route layout
- Implement role upgrade flow (user → creator)
- Test role-based access control

**Role Definitions:**
- USER: Can access user routes, developer routes
- CREATOR: Can access user, developer, and creator routes
- ADMIN: Can access all routes including admin
- MODERATOR: Can access moderation routes

**Acceptance Criteria:**
- Middleware checks user role before allowing access
- Admin routes require ADMIN role
- Creator routes require CREATOR role
- Developer routes require USER role (or higher)
- Role upgrade flow implemented
- All protected routes tested with different roles

**Files to Update:**
- middleware.ts
- app/(protected)/admin/layout.tsx
- app/(protected)/creator/layout.tsx
- app/(protected)/developer/layout.tsx
- lib/roles.ts (create new file for role utilities)

**Database Schema:**
- users table has role column (already exists)
- No schema changes needed
```

**Custom Instructions:**
```
Implement role checking in middleware using Supabase auth context. Create a lib/roles.ts file with helper functions for role checking. Ensure role checks are performed on every protected route.
```

---

## Task 0.3: Fix Admin Route Security

**GitHub Issue Title:** Move admin routes to environment-based path

**Issue Body:**
```
Move admin routes from publicly exposed `/admin` to environment-based path for security.

**Current State:**
Admin routes are publicly accessible at `/admin` which is discoverable.

**Desired State:**
Admin routes use environment variable for path (e.g., `/admin-secret-xyz`).

**Requirements:**
- Add ADMIN_SECRET_ROUTE to environment variables
- Update admin route structure to use environment variable
- Add redirect from old `/admin` to 404
- Test new admin route access
- Verify admin route not discoverable

**Acceptance Criteria:**
- ADMIN_SECRET_ROUTE environment variable configured
- Old `/admin` routes redirect to 404
- New admin route accessible only with correct path
- Admin route tested and verified
- Admin route not discoverable

**Files to Update:**
- .env.local (add ADMIN_SECRET_ROUTE)
- app/(protected)/admin/** (update route structure)
- middleware.ts (update admin route check)

**Environment Variable:**
- ADMIN_SECRET_ROUTE: Random secret string for admin path
```

**Custom Instructions:**
```
Use environment variable ADMIN_SECRET_ROUTE to set the admin path. If not set, default to a secure random path. Ensure old `/admin` routes return 404.
```

---

## Task 0.4: Deploy Edge Functions

**GitHub Issue Title:** Deploy all 9 missing Supabase edge functions

**Issue Body:**
```
Deploy all 9 missing edge functions to Supabase.

**Missing Edge Functions:**
1. api-keys - API key creation and management
2. api-keys/manage - API key management (delete, revoke, edit)
3. webhooks - Webhook management
4. webhooks/deliver - Webhook delivery
5. applications - OAuth application management
6. applications/authorize - OAuth authorization
7. mcp - MCP server management
8. mcp/connect - MCP server connection
9. mcp/usage - MCP usage tracking
10. usage/track - General usage tracking

**Requirements:**
- Deploy all edge functions to Supabase
- Test each edge function
- Add error handling to all edge functions
- Add logging to all edge functions
- Verify JWT verification is enabled

**Acceptance Criteria:**
- All 9 edge functions deployed
- All edge functions tested
- All edge functions have proper error handling
- All edge functions have proper logging
- JWT verification enabled on all functions

**Files to Create/Update:**
- supabase/functions/api-keys/index.ts
- supabase/functions/api-keys/manage.ts
- supabase/functions/webhooks/index.ts
- supabase/functions/webhooks/deliver.ts
- supabase/functions/applications/index.ts
- supabase/functions/applications/authorize.ts
- supabase/functions/mcp/index.ts
- supabase/functions/mcp/connect.ts
- supabase/functions/mcp/usage.ts
- supabase/functions/usage/track.ts

**Note:** Some edge function files may already exist but are not deployed. Deploy them using Supabase CLI.
```

**Custom Instructions:**
```
Use Supabase CLI to deploy edge functions. Ensure each function has proper CORS, JWT verification, error handling, and logging. Test each function after deployment.
```

---

## Task 0.5: Configure Supabase Storage

**GitHub Issue Title:** Configure Supabase Storage buckets and file upload/serving

**Issue Body:**
```
Configure Supabase Storage buckets, policies, and implement file upload/serving functionality.

**Requirements:**
- Create storage buckets (listings, avatars, assets)
- Configure storage policies (public read, authenticated write)
- Implement file upload API route
- Implement file serving logic
- Implement file deletion logic

**Buckets:**
- listings: Store listing files (public read, creator write)
- avatars: Store user avatars (public read, user write)
- assets: Store general assets (public read, authenticated write)

**Acceptance Criteria:**
- Storage buckets created in Supabase
- Storage policies configured
- File upload API implemented
- File serving implemented
- File deletion implemented
- File upload tested
- File serving tested
- File deletion tested

**Files to Create:**
- app/api/upload/route.ts (file upload API)
- lib/storage.ts (storage utilities)

**Files to Update:**
- components/marketplace/DownloadFlow.tsx (use real file serving)
- app/(protected)/creator/upload/page.tsx (use real file upload)

**Database Schema:**
- No schema changes needed
- Storage policies configured in Supabase dashboard
```

**Custom Instructions:**
```
Use Supabase Storage API for file operations. Implement proper error handling and file validation. Ensure storage policies are configured correctly in Supabase dashboard.
```

---

## Task 0.6: Fix Purchase Flow

**GitHub Issue Title:** Fix PurchaseFlow to use correct table and integrate with Stripe

**Issue Body:**
```
Fix PurchaseFlow component to use correct table and integrate with Stripe payment processing.

**Current State:**
PurchaseFlow uses wrong table (`purchases` instead of `transactions`) and has no payment processing.

**Desired State:**
PurchaseFlow uses `transactions` table and integrates with Stripe payment processing.

**Requirements:**
- Update PurchaseFlow to use transactions table
- Integrate Stripe payment processing
- Implement fee calculation
- Implement creator payout calculation
- Test purchase flow
- Test refund flow

**Acceptance Criteria:**
- PurchaseFlow uses transactions table
- Stripe payment processing integrated
- Fee calculation implemented
- Creator payout calculation implemented
- Purchase flow tested end-to-end
- Refund flow tested
- Transaction records created correctly

**Files to Update:**
- components/marketplace/PurchaseFlow.tsx
- app/api/stripe/checkout/route.ts (may need updates)
- lib/payments.ts (create payment utilities)

**Database Schema:**
- transactions table already exists
- No schema changes needed
```

**Custom Instructions:**
```
Update PurchaseFlow to use the transactions table. Integrate with existing Stripe checkout route. Implement fee calculation based on platform fee percentage. Calculate creator payout amount.
```

---

## Task 0.7: Implement Creator Upload

**GitHub Issue Title:** Implement full creator upload flow with GitHub OAuth and Supabase Storage

**Issue Body:**
```
Implement full creator upload flow with GitHub OAuth integration and Supabase Storage for file uploads.

**Requirements:**
- Configure GitHub OAuth app
- Implement GitHub OAuth flow
- Implement GitHub repo scanning
- Implement manual file upload
- Implement listing creation from upload
- Test upload flows

**Acceptance Criteria:**
- GitHub OAuth flow working
- GitHub repo scanning working
- Manual file upload working
- Listing creation from upload working
- File upload to Supabase Storage working
- Upload flow tested end-to-end
- Error handling implemented

**Files to Create:**
- app/api/github/oauth/route.ts (GitHub OAuth)
- app/api/github/repos/route.ts (GitHub repo fetching)
- app/api/github/scan/route.ts (GitHub repo scanning)
- lib/github.ts (GitHub utilities)

**Files to Update:**
- app/(protected)/creator/upload/page.tsx
- components/creator/UploadModal.tsx

**Database Schema:**
- github_connections table already exists
- No schema changes needed
```

**Custom Instructions:**
```
Implement GitHub OAuth flow using GitHub API. Implement repo scanning to extract metadata for listing creation. Use Supabase Storage for manual file uploads. Create listings from uploaded data.
```

---

## Task 0.8: Implement Creator Verification

**GitHub Issue Title:** Implement Stripe Connect for creator verification and payouts

**Issue Body:**
```
Implement Stripe Connect integration for creator verification and payout setup.

**Requirements:**
- Configure Stripe Connect
- Implement Stripe Connect onboarding flow
- Implement identity verification
- Implement bank account setup
- Track creator account status
- Test verification flow
- Test payout eligibility

**Acceptance Criteria:**
- Stripe Connect onboarding flow implemented
- Identity verification implemented
- Bank account setup implemented
- Creator account status tracked
- Payout eligibility implemented
- Verification flow tested
- Payout flow tested

**Files to Create:**
- app/api/stripe/connect/onboard/route.ts (Stripe Connect onboarding)
- app/api/stripe/connect/verify/route.ts (Identity verification)
- lib/stripe-connect.ts (Stripe Connect utilities)

**Files to Update:**
- app/(protected)/creator/verification/page.tsx (create verification page)
- app/(protected)/creator/payouts/page.tsx (update for Stripe Connect)

**Database Schema:**
- creator_accounts table already exists
- No schema changes needed
```

**Custom Instructions:**
```
Use Stripe Connect API for onboarding and verification. Track creator account status in creator_accounts table. Implement payout eligibility checks based on account status.
```

---

## Task 0.9: Update schema.sql

**GitHub Issue Title:** Update schema.sql to fix schema drift

**Issue Body:**
```
Update schema.sql to include missing columns (stripe_price_id, stripe_customer_id) on subscriptions table.

**Current State:**
schema.sql is missing stripe_price_id and stripe_customer_id columns on subscriptions table, causing schema drift.

**Desired State:**
schema.sql matches live database schema.

**Requirements:**
- Update schema.sql with stripe_price_id column
- Update schema.sql with stripe_customer_id column
- Regenerate TypeScript types
- Run build to verify
- Create migration for future deployments

**Acceptance Criteria:**
- schema.sql updated with missing columns
- Schema aligned with live database
- TypeScript types regenerated
- Build passes
- Migration created for future deployments

**Files to Update:**
- supabase/schema.sql
- types/database.ts (regenerate)

**Migration:**
- Create migration file for adding columns
```

**Custom Instructions:**
```
Add stripe_price_id and stripe_customer_id columns to subscriptions table in schema.sql. Regenerate TypeScript types using Supabase CLI. Create a migration file for future deployments.
```

---

## Execution Order

1. **Task 0.9** (Update schema.sql) - No dependencies, quick win
2. **Task 0.1** (Configure Environment Variables) - Required for most other tasks
3. **Task 0.2** (Role-Based Access Control) - Security critical
4. **Task 0.3** (Admin Route Security) - Security critical
5. **Task 0.5** (Supabase Storage) - Required for upload
6. **Task 0.4** (Deploy Edge Functions) - Required for platform functionality
7. **Task 0.6** (Purchase Flow) - Revenue critical
8. **Task 0.7** (Creator Upload) - Creator critical
9. **Task 0.8** (Creator Verification) - Revenue critical

---

## Delegation Process

For each task:
1. Create GitHub issue with detailed specifications
2. Assign issue to GitHub Copilot agent using `mcp0_assign_copilot_to_issue`
3. Monitor Copilot progress
4. Review pull request when created
5. Test implementation
6. Merge pull request if approved
7. Update todo.md with completion status

---

## Success Criteria

**Priority 0 Completion:**
- [ ] All 9 Priority 0 tasks completed
- [ ] All security vulnerabilities resolved
- [ ] All critical integrations functional
- [ ] Platform can process payments
- [ ] Creators can upload listings
- [ ] Developers can use platform

**Production Readiness:**
- [ ] All Priority 0 tasks completed
- [ ] Platform can be safely deployed to production
- [ ] No critical security vulnerabilities
- [ ] All core functionality working
