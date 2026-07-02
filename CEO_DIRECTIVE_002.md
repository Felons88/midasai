[CEO DIRECTIVE] critical – Implement Stripe Connect payment flow with idempotency handling and complete webhook verification system:

1. Create /api/stripe/connect endpoint with proper OAuth flow
2. Implement /api/stripe/checkout/lising endpoint for listing purchases
3. Build /api/stripe/webhook endpoint that handles all Stripe events idempotently
4. Add necessary database tables for tracking payments and subscriptions
5. Implement role-based access controls for paid listings
6. Add proper error handling and retries for webhook processing

All implementation must use TypeScript with strict typing and follow existing code patterns in the repository. Test cases must be written using Jest to ensure proper functionality.

Agency: Code-Agent, Integration-Agent

[CEO DIRECTIVE] high – Implement complete full-text search with ranking capabilities for listings:

1. Add GIN indexes on listings.title and listings.description columns
2. Modify /api/search endpoint to use full-text search queries
3. Implement ranking algorithm that considers relevance, popularity, and freshness
4. Add search suggestions functionality
5. Implement rate limiting for search endpoint

Agency: Data-Agent, Code-Agent

[CEO DIRECTIVE] high – Build Creator Dashboard with real-time analytics and payout management:

1. Create dashboard view at /creator/dashboard while maintaining existing design patterns
2. Implement real-time listing analytics display
3. Build earnings tracking interface with historical data
4. Implement payout management with CSV export functionality
5. Add integration with Stripe Connect for payout processing
6. Ensure all components follow existing design system and accessibility standards

Agency: UI-Agent, Data-Agent, Integration-Agent

[CEO DIRECTIVE] medium – Set up comprehensive analytics and monitoring stack:

1. Integrate PostHog analytics with key user flow tracking
2. Set up Sentry for error monitoring with appropriate alerts
3. Configure performance monitoring dashboards
4. Implement event tracking for critical paths: listing creation, purchase, payout, etc.

Agency: Integration-Agent, QA-Agent

[CEO DIRECTIVE] high – Execute comprehensive test coverage expansion to reach 80%+ coverage:

1. Run existing test suite to identify gaps
2. Add missing unit and integration tests for new API endpoints
3. Ensure Playwright E2E tests cover all critical user flows
4. Generate detailed coverage reports
5. Fix all failing tests and add tests for new functionality

Agency: QA-Agent, Code-Agent

[CEO DIRECTIVE] critical – Execute full production readiness review and prepare launch package:

1. Complete all pending checklist items
2. Generate final documentation package for launch
3. Prepare launch announcement assets
4. Coordinate final marketing campaign preparation
5. Verify all systems are go for launch

Agency: CEO-Agent, Documentation-Agent, Marketing-Agent

These directives represent the critical path to launch MidasAI as a fully functional marketplace with payment processing, robust search, creator tools, and comprehensive analytics. All agents must execute their assigned tasks immediately and report progress to the central agency-executor dashboard.