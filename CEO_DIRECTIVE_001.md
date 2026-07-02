[CEO DIRECTIVE] critical – Generate a comprehensive production launch checklist in checklist.md with the following sections:
1. Pre-Launch Verification
2. Stripe Live Mode Configuration
3. Production Database Seeding
4. Marketing Site Launch Checklist
5. Analytics Integration
6. Verification Testing Steps
7. Post-Launch Monitoring Requirements

[CEO DIRECTIVE] high – Implement the full Stripe Connect payment flow with webhook verification and idempotency handling. Must include:
- /api/stripe/checkout/lising endpoint
- /api/stripe/webhook endpoint
- Subscription management flows
- Role-based access controls for paid listings

[CEO DIRECTIVE] medium – Apply database schema to Supabase production project with all pending migrations including:
- 20260627_listing_seo_fields.sql
- 20260629_add_analyzing_status.sql  
- 20260629_update_delete_policy.sql
- 20260630_workflow_conversation_memory.sql
- All remaining migrations not yet applied

[CEO DIRECTIVE] high – Implement full-text search with ranking capabilities for listings
- Add proper GIN indexes on listings.title and listings.description
- Implement full-text search endpoint at /api/search

[CEO DIRECTIVE] high – Build and deploy the Creator Dashboard with:
- Real-time analytics on listings
- Earnings tracking
- Payout management
- Portfolio overview

[CEO DIRECTIVE] low – Create a comprehensive SEO package including:
- Dynamic meta tags
- Open Graph tags
- Structured data implementation
- Sitemap.xml generation
- robots.txt configuration

[CEO DIRECTIVE] high – Set up comprehensive analytics with PostHog and monitoring with Sentry
- Implement event tracking for key user flows
- Set up error monitoring
- Configure performance dashboards

[CEO DIRECTIVE] critical – Run the full test suite and ensure 80%+ test coverage
- Fix any failing tests
- Add missing tests to reach coverage goal
- Ensure all Playwright E2E tests pass

[CEO DIRECTIVE] high – Execute full production readiness review and prepare for launch
- Complete all pending items
- Coordinate with marketing team for launch announcement
- Prepare launch plan and rollout strategy

These directives will enable us to move from 96/100 production readiness to a fully launched marketplace that can accept real payments, support creators with real data, and deliver a premium experience.

All directives must be executed in parallel by the respective agents:

- Code-Agent will handle implementation tasks
- Data-Agent will manage database operations
- Integration-Agent will handle payment and analytics integrations  
- QA-Agent will ensure test coverage
- Documentation-Agent will update relevant docs
- Agency-Executor will track progress

Execution must begin immediately with no delays.