# MidasAI Production Readiness TODO

**Last Updated:** 2026-06-20
**Status:** Phase 0-4 Complete, Phase 5 Ready to Begin

---

## Priority 0 Tasks (Launch Blockers)

### Task 0.1: Configure Environment Variables
**Effort:** 1 day
**Status:** Pending
**Description:** Configure all missing environment variables in Vercel and local development.

**Subtasks:**
- [ ] Add GITHUB_CLIENT_ID to Vercel
- [ ] Add GITHUB_CLIENT_SECRET to Vercel
- [ ] Add GEMINI_API_KEY to Vercel
- [ ] Add STRIPE_SECRET_KEY to Vercel
- [ ] Add STRIPE_WEBHOOK_SECRET to Vercel
- [ ] Add STRIPE_STARTER_MONTHLY_PRICE_ID to Vercel
- [ ] Add STRIPE_STARTER_YEARLY_PRICE_ID to Vercel
- [ ] Add STRIPE_PRO_MONTHLY_PRICE_ID to Vercel
- [ ] Add STRIPE_PRO_YEARLY_PRICE_ID to Vercel
- [ ] Add STRIPE_BUSINESS_MONTHLY_PRICE_ID to Vercel
- [ ] Add STRIPE_BUSINESS_YEARLY_PRICE_ID to Vercel
- [ ] Add SUPABASE_SERVICE_ROLE_KEY to Vercel
- [ ] Add all variables to local .env.local
- [ ] Test GitHub OAuth flow
- [ ] Test Stripe checkout flow
- [ ] Test Gemini API integration
- [ ] Verify service role client works

---

### Task 0.2: Implement Role-Based Access Control
**Effort:** 2-3 days
**Status:** Pending
**Description:** Add role verification to middleware and protected route layouts.

**Subtasks:**
- [ ] Update middleware.ts to check user role
- [ ] Add role check to admin route layout
- [ ] Add role check to creator route layout
- [ ] Add role check to developer route layout
- [ ] Implement role upgrade flow (user → creator)
- [ ] Test admin route access with USER role (should fail)
- [ ] Test admin route access with ADMIN role (should succeed)
- [ ] Test creator route access with USER role (should fail)
- [ ] Test creator route access with CREATOR role (should succeed)

---

### Task 0.3: Fix Admin Route Security
**Effort:** 1 day
**Status:** Pending
**Description:** Move admin routes to environment-based path.

**Subtasks:**
- [ ] Add ADMIN_SECRET_ROUTE to environment variables
- [ ] Update admin route structure to use environment variable
- [ ] Add redirect from old `/admin` to 404
- [ ] Test access to old `/admin` (should 404)
- [ ] Test access to new admin route (should work)
- [ ] Verify admin route not discoverable

---

### Task 0.4: Deploy Edge Functions
**Effort:** 3-5 days
**Status:** Pending
**Description:** Deploy all 9 missing edge functions.

**Subtasks:**
- [ ] Deploy api-keys edge function
- [ ] Test API key creation via edge function
- [ ] Deploy webhooks edge function
- [ ] Deploy webhooks/deliver edge function
- [ ] Test webhook creation and delivery
- [ ] Deploy applications edge function
- [ ] Deploy applications/authorize edge function
- [ ] Test OAuth flow
- [ ] Deploy mcp edge function
- [ ] Deploy mcp/connect edge function
- [ ] Deploy mcp/usage edge function
- [ ] Test MCP server connection
- [ ] Deploy usage/track edge function
- [ ] Test usage tracking
- [ ] Add error handling to all edge functions
- [ ] Add logging to all edge functions

---

### Task 0.5: Configure Supabase Storage
**Effort:** 2-3 days
**Status:** Pending
**Description:** Configure Supabase Storage buckets, policies, and file upload/serving.

**Subtasks:**
- [ ] Create listings bucket in Supabase
- [ ] Create avatars bucket in Supabase
- [ ] Create assets bucket in Supabase
- [ ] Configure storage policies (public read, authenticated write)
- [ ] Implement file upload API route
- [ ] Implement file serving logic
- [ ] Implement file deletion logic
- [ ] Test file upload
- [ ] Test file serving
- [ ] Test file deletion

---

### Task 0.6: Fix Purchase Flow
**Effort:** 3-5 days
**Status:** Pending
**Description:** Fix PurchaseFlow to use correct table and integrate with Stripe.

**Subtasks:**
- [ ] Update PurchaseFlow to use transactions table
- [ ] Integrate Stripe payment processing
- [ ] Implement fee calculation logic
- [ ] Implement creator payout logic
- [ ] Test purchase flow with test Stripe payment
- [ ] Test refund flow
- [ ] Verify transaction records in database

---

### Task 0.7: Implement Creator Upload
**Effort:** 5-7 days
**Status:** Pending
**Description:** Implement full creator upload flow with GitHub OAuth and Supabase Storage.

**Subtasks:**
- [ ] Configure GitHub OAuth app
- [ ] Implement GitHub OAuth flow
- [ ] Implement GitHub repo scanning
- [ ] Implement manual file upload
- [ ] Implement listing creation from upload
- [ ] Test GitHub upload flow
- [ ] Test manual upload flow
- [ ] Verify listing creation

---

### Task 0.8: Implement Creator Verification
**Effort:** 5-7 days
**Status:** Pending
**Description:** Implement Stripe Connect integration for creator verification.

**Subtasks:**
- [ ] Configure Stripe Connect
- [ ] Implement Stripe Connect onboarding
- [ ] Implement identity verification
- [ ] Implement bank account setup
- [ ] Track creator account status
- [ ] Test verification flow
- [ ] Test payout eligibility

---

### Task 0.9: Update schema.sql
**Effort:** 1 day
**Status:** Pending
**Description:** Update schema.sql to fix schema drift.

**Subtasks:**
- [ ] Update schema.sql with stripe_price_id column
- [ ] Update schema.sql with stripe_customer_id column
- [ ] Regenerate TypeScript types
- [ ] Run build to verify
- [ ] Create migration for future deployments

---

## Priority 1 Tasks (Revenue Blockers)

### Task 1.1: Implement Rate Limiting
**Effort:** 3-5 days
**Status:** Pending
**Description:** Implement rate limiting at API and edge function level.

**Subtasks:**
- [ ] Set up Redis or caching layer
- [ ] Implement rate limiting middleware
- [ ] Add rate limit headers
- [ ] Implement rate limit alerts
- [ ] Test rate limiting
- [ ] Test rate limit bypass protection

---

### Task 1.2: Implement Input Validation
**Effort:** 2-3 days
**Status:** Pending
**Description:** Implement comprehensive input validation with Zod.

**Subtasks:**
- [ ] Install Zod
- [ ] Define schemas for all inputs
- [ ] Implement validation in API routes
- [ ] Implement validation in edge functions
- [ ] Test validation
- [ ] Test security (SQL injection, XSS)

---

### Task 1.3: Implement CSRF Protection
**Effort:** 2 days
**Status:** Pending
**Description:** Implement CSRF protection with tokens and SameSite cookies.

**Subtasks:**
- [ ] Implement CSRF token generation
- [ ] Implement CSRF token validation
- [ ] Configure SameSite cookies
- [ ] Test CSRF protection
- [ ] Test CSRF bypass protection

---

### Task 1.4: Implement XSS Protection
**Effort:** 2 days
**Status:** Pending
**Description:** Implement XSS protection with CSP headers and sanitization.

**Subtasks:**
- [ ] Implement CSP headers
- [ ] Implement XSS protection headers
- [ ] Implement input sanitization
- [ ] Implement output encoding
- [ ] Test XSS protection

---

### Task 1.5: Implement Email System
**Effort:** 2-3 days
**Status:** Pending
**Description:** Configure email provider and implement email sending.

**Subtasks:**
- [ ] Configure Resend or SendGrid
- [ ] Create email templates
- [ ] Implement email sending function
- [ ] Test email sending
- [ ] Test email delivery tracking

---

### Task 1.6: Implement Email Verification
**Effort:** 2-3 days
**Status:** Pending
**Description:** Implement email verification flow for registration.

**Subtasks:**
- [ ] Implement verification token generation
- [ ] Implement verification email sending
- [ ] Implement verification token validation
- [ ] Implement account activation
- [ ] Test email verification flow

---

### Task 1.7: Implement Listing Management
**Effort:** 2-3 days
**Status:** Pending
**Description:** Implement full listing management for creators.

**Subtasks:**
- [ ] Implement listing edit API
- [ ] Implement listing delete API
- [ ] Implement listing archive API
- [ ] Implement listing status change API
- [ ] Add UI for listing management
- [ ] Test listing management
- [ ] Test permission checks

---

### Task 1.8: Implement API Key Management
**Effort:** 1-2 days
**Status:** Pending
**Description:** Implement full API key management.

**Subtasks:**
- [ ] Implement API key delete
- [ ] Implement API key revoke
- [ ] Implement API key edit
- [ ] Implement API key rotate
- [ ] Add UI for key management
- [ ] Test key management
- [ ] Verify audit logging

---

### Task 1.9: Implement Webhook Delivery
**Effort:** 3-4 days
**Status:** Pending
**Description:** Implement full webhook delivery with retry logic.

**Subtasks:**
- [ ] Implement webhook delivery
- [ ] Implement retry logic
- [ ] Implement exponential backoff
- [ ] Implement dead letter queue
- [ ] Test webhook delivery
- [ ] Test webhook failure handling

---

### Task 1.10: Implement OAuth Flow
**Effort:** 4-5 days
**Status:** Pending
**Description:** Implement full OAuth flow for applications.

**Subtasks:**
- [ ] Implement OAuth authorize endpoint
- [ ] Implement OAuth token endpoint
- [ ] Implement OAuth refresh endpoint
- [ ] Test OAuth flow
- [ ] Test token expiration
- [ ] Test token refresh

---

### Task 1.11: Implement MCP Server Management
**Effort:** 3-4 days
**Status:** Pending
**Description:** Implement full MCP server management.

**Subtasks:**
- [ ] Implement MCP server connect
- [ ] Implement MCP server disconnect
- [ ] Implement MCP server test
- [ ] Implement MCP health checks
- [ ] Test MCP management
- [ ] Test MCP usage tracking

---

## Priority 2 Tasks (Growth Systems)

### Task 2.1: Implement Password Reset
**Effort:** 1-2 days
**Status:** Pending
**Description:** Implement password reset flow with email.

**Subtasks:**
- [ ] Implement reset token generation
- [ ] Implement reset email sending
- [ ] Implement reset token validation
- [ ] Implement password update
- [ ] Test password reset flow

---

### Task 2.2: Implement Full-Text Search
**Effort:** 2-3 days
**Status:** Pending
**Description:** Implement full-text search with PostgreSQL.

**Subtasks:**
- [ ] Create full-text search indexes
- [ ] Update search query
- [ ] Test search performance
- [ ] Test search accuracy

---

### Task 2.3: Implement Review Creation
**Effort:** 1-2 days
**Status:** Pending
**Description:** Implement review creation flow.

**Subtasks:**
- [ ] Implement review form
- [ ] Implement review API
- [ ] Implement review validation
- [ ] Test review creation
- [ ] Test review display

---

### Task 2.4: Implement Analytics Visualization
**Effort:** 2-3 days
**Status:** Pending
**Description:** Implement analytics visualization with charts.

**Subtasks:**
- [ ] Install charting library
- [ ] Implement analytics charts
- [ ] Implement date range filtering
- [ ] Test analytics visualization

---

### Task 2.5: Implement Mobile Navigation
**Effort:** 2-3 days
**Status:** Pending
**Description:** Implement mobile navigation with hamburger menu.

**Subtasks:**
- [ ] Implement hamburger menu
- [ ] Implement mobile sidebar
- [ ] Optimize tables for mobile
- [ ] Optimize forms for mobile
- [ ] Test mobile navigation

---

### Task 2.6: Implement Gemini AI Integration
**Effort:** 2-3 days
**Status:** Pending
**Description:** Implement Gemini AI for repo analysis.

**Subtasks:**
- [ ] Implement Gemini API integration
- [ ] Implement repo analysis
- [ ] Implement tag generation
- [ ] Implement description generation
- [ ] Test AI features

---

## Priority 3 Tasks (Polish)

### Task 3.1: Implement Collections
**Effort:** 2-3 days
**Status:** Pending
**Description:** Implement collections functionality.

**Subtasks:**
- [ ] Implement collection creation
- [ ] Implement collection management
- [ ] Implement add listings
- [ ] Test collections

---

### Task 3.2: Implement Loading Skeletons
**Effort:** 1-2 days
**Status:** Pending
**Description:** Implement loading states with Suspense.

**Subtasks:**
- [ ] Implement Suspense boundaries
- [ ] Implement loading skeletons
- [ ] Test loading states

---

## Summary

**Total Tasks:** 28
**Priority 0:** 9 tasks (27-41 days)
**Priority 1:** 11 tasks (26-35 days)
**Priority 2:** 6 tasks (10-16 days)
**Priority 3:** 2 tasks (3-5 days)

**Total Estimated Effort:** 66-97 days
**Recommended Team Size:** 2-3 developers
**Recommended Timeline:** 8 weeks
