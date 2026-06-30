// 72-file Project Intelligence Upgrade Package manifest
// Each file has a clear purpose — organized into 12 categories × 6 files each

export interface ManifestFile {
  name: string
  category: string
  prompt: string
}

export const EXPANSION_MANIFEST: ManifestFile[] = [
  // ═══════════════════════════════════════════
  // CATEGORY 1: PROJECT FOUNDATION (6 files)
  // ═══════════════════════════════════════════
  { name: "PROJECT_BIBLE.md", category: "foundation", prompt: "Master source of truth. System overview, mission statement, tech stack, core principles, file structure map, dependency graph, environment setup, and development philosophy." },
  { name: "TECH_STACK.md", category: "foundation", prompt: "Complete tech stack specification. Analyze the project files to determine EXACTLY what technologies, frameworks, libraries, databases, services, and tools the user's project requires. For EACH dependency: name, version (recommended), purpose, install command (npm/yarn/pnpm), configuration file, and official docs URL. Organize into sections: Frontend (framework, UI library, styling, state management, icons, animations), Backend (runtime, API framework, auth, ORM/client), Database (engine, hosting, migrations, extensions), DevOps (hosting, CI/CD, CDN, monitoring), AI/ML (models, SDKs, APIs), and Third-Party Services (payments, email, analytics, storage). Include a package.json-ready dependency list and a one-command setup script." },
  { name: "ARCHITECTURE_OVERVIEW.md", category: "foundation", prompt: "High-level architecture diagram descriptions, system boundaries, service topology, data flow maps, and integration points." },
  { name: "TECH_STACK_RATIONALE.md", category: "foundation", prompt: "Why each technology in the tech stack was chosen. For every framework, library, and service: compare 2-3 alternatives considered, explain the trade-off, migration path if switching later, version pinning policy, and upgrade strategy. Reference the TECH_STACK.md for the full list." },
  { name: "GLOSSARY.md", category: "foundation", prompt: "Domain glossary defining every business term, technical abbreviation, status enum, role name, and entity relationship used in the project." },
  { name: "CONTRIBUTING.md", category: "foundation", prompt: "Contribution guide: branch strategy, commit conventions, PR templates, code review checklist, issue templates, and onboarding steps for new developers." },

  // ═══════════════════════════════════════════
  // CATEGORY 2: DATABASE & DATA LAYER (6 files)
  // ═══════════════════════════════════════════
  { name: "DATABASE_SCHEMA.md", category: "database", prompt: "Complete database schema documentation. Every table, column, type, constraint, index, and relationship with ER diagram descriptions." },
  { name: "DATABASE_MIGRATIONS.md", category: "database", prompt: "Migration strategy guide. How to create, test, rollback, and deploy migrations. Migration naming conventions, versioning rules, and zero-downtime migration patterns." },
  { name: "DATABASE_INDEXES.md", category: "database", prompt: "Index strategy document. Every index, why it exists, query patterns it serves, composite index design, partial indexes, and index maintenance procedures." },
  { name: "DATABASE_RLS_POLICIES.md", category: "database", prompt: "Row Level Security policy documentation. Every RLS policy, what it protects, ownership rules, role-based access patterns, and testing procedures." },
  { name: "DATABASE_FUNCTIONS.md", category: "database", prompt: "Database functions and triggers documentation. Every stored function, trigger, its purpose, input/output, security definer settings, and execution context." },
  { name: "DATA_MODEL_RELATIONSHIPS.md", category: "database", prompt: "Entity relationship documentation. Foreign keys, cascade rules, polymorphic associations, junction tables, and data integrity constraints." },

  // ═══════════════════════════════════════════
  // CATEGORY 3: API DESIGN (6 files)
  // ═══════════════════════════════════════════
  { name: "API_REFERENCE.md", category: "api", prompt: "Complete API reference. Every endpoint, method, path, request/response schemas, authentication requirements, rate limits, and example curl commands." },
  { name: "API_DESIGN_PRINCIPLES.md", category: "api", prompt: "API design system. Naming conventions, versioning strategy, error response format, pagination patterns, filtering/sorting conventions, and HATEOAS considerations." },
  { name: "API_AUTHENTICATION.md", category: "api", prompt: "Authentication and authorization flows. JWT handling, session management, OAuth flows, API key management, token refresh, and security headers." },
  { name: "API_ERROR_CODES.md", category: "api", prompt: "Comprehensive error code catalog. Every error code, HTTP status, user-facing message, developer message, and resolution steps." },
  { name: "API_RATE_LIMITING.md", category: "api", prompt: "Rate limiting strategy. Per-endpoint limits, tier-based quotas, burst handling, retry-after headers, and abuse detection patterns." },
  { name: "API_WEBHOOKS.md", category: "api", prompt: "Webhook system documentation. Event types, payload schemas, delivery guarantees, retry policies, signature verification, and consumer implementation guide." },

  // ═══════════════════════════════════════════
  // CATEGORY 4: SECURITY (6 files)
  // ═══════════════════════════════════════════
  { name: "SECURITY_PLAYBOOK.md", category: "security", prompt: "Security playbook. Threat model, attack surfaces, OWASP top 10 mitigations, security headers, CSP policy, and incident response procedures." },
  { name: "SECURITY_RBAC.md", category: "security", prompt: "Role-Based Access Control matrix. Every role (USER, CREATOR, ADMIN, MODERATOR, OWNER), permissions per resource, escalation paths, and role assignment rules." },
  { name: "SECURITY_SECRETS.md", category: "security", prompt: "Secret management guide. How secrets are stored, rotated, accessed. Environment variable naming, vault integration, CI/CD secret injection, and audit logging." },
  { name: "SECURITY_AUDIT_LOG.md", category: "security", prompt: "Audit logging specification. What events are logged, log schema, retention policy, query patterns, compliance requirements, and alerting rules." },
  { name: "SECURITY_CSRF_XSS.md", category: "security", prompt: "CSRF and XSS protection guide. Token generation, validation flow, content sanitization, CSP directives, and testing procedures." },
  { name: "SECURITY_COMPLIANCE.md", category: "security", prompt: "Compliance documentation. GDPR data handling, data retention policies, user data export, deletion procedures, cookie consent, and privacy policy technical implementation." },

  // ═══════════════════════════════════════════
  // CATEGORY 5: SCALING & PERFORMANCE (6 files)
  // ═══════════════════════════════════════════
  { name: "SCALING_BLUEPRINT.md", category: "scaling", prompt: "Scaling blueprint. Horizontal scaling strategy, database connection pooling, read replicas, sharding considerations, and capacity planning models." },
  { name: "CACHING_STRATEGY.md", category: "scaling", prompt: "Caching architecture. Edge caching, server-side caching, database query caching, cache invalidation patterns, TTL policies, and cache warming strategies." },
  { name: "CDN_ARCHITECTURE.md", category: "scaling", prompt: "CDN and asset delivery strategy. Static asset optimization, image transformation pipeline, lazy loading, prefetching, and geographic distribution." },
  { name: "PERFORMANCE_BUDGETS.md", category: "scaling", prompt: "Performance budget document. Core Web Vitals targets, bundle size limits, API response time SLAs, database query time limits, and Lighthouse score targets." },
  { name: "LOAD_TESTING.md", category: "scaling", prompt: "Load testing strategy. Test scenarios, tools (k6, Artillery), baseline metrics, stress test thresholds, soak test procedures, and performance regression detection." },
  { name: "DATABASE_SCALING.md", category: "scaling", prompt: "Database scaling guide. Connection pooling (PgBouncer/Supavisor), read replicas, partitioning strategy, vacuum tuning, and query optimization patterns." },

  // ═══════════════════════════════════════════
  // CATEGORY 6: AI & AGENT SYSTEMS (6 files)
  // ═══════════════════════════════════════════
  { name: "AI_ARCHITECTURE.md", category: "ai", prompt: "AI system architecture. Model selection strategy, prompt routing, fallback chains, token budget management, streaming patterns, and AI provider abstraction layer." },
  { name: "AGENT_RULES.md", category: "ai", prompt: "Agent system rules. Agent roles, ownership boundaries, communication protocols, conflict resolution, memory management, and handoff procedures." },
  { name: "PROMPT_LIBRARY.md", category: "ai", prompt: "Reusable prompt library. 20+ copy-pasteable prompts for: code generation, architecture analysis, security auditing, documentation, debugging, code review, and refactoring." },
  { name: "AI_SAFETY.md", category: "ai", prompt: "AI safety constraints. Output validation, content filtering, hallucination detection, rate limiting, cost controls, and human-in-the-loop checkpoints." },
  { name: "AI_MEMORY_SYSTEM.md", category: "ai", prompt: "AI memory and context management. Short-term context windows, long-term memory storage, retrieval strategies, embedding models, and context pruning algorithms." },
  { name: "AI_EVALUATION.md", category: "ai", prompt: "AI output evaluation framework. Quality metrics, automated scoring, human evaluation rubrics, A/B testing framework, and regression detection for AI outputs." },

  // ═══════════════════════════════════════════
  // CATEGORY 7: FRONTEND ARCHITECTURE (6 files)
  // ═══════════════════════════════════════════
  { name: "FRONTEND_ARCHITECTURE.md", category: "frontend", prompt: "Frontend architecture. Component hierarchy, state management patterns, routing structure, layout system, code splitting strategy, and rendering modes (SSR/SSG/CSR)." },
  { name: "DESIGN_SYSTEM.md", category: "frontend", prompt: "Design system specification. Color palette, typography scale, spacing system, component variants, animation guidelines, dark mode implementation, and accessibility standards." },
  { name: "COMPONENT_LIBRARY.md", category: "frontend", prompt: "Component library catalog. Every shared component, its props, variants, usage examples, accessibility attributes, and composition patterns." },
  { name: "FRONTEND_STATE.md", category: "frontend", prompt: "State management guide. Client state, server state, URL state, form state patterns. React hooks, context usage, optimistic updates, and cache synchronization." },
  { name: "FRONTEND_TESTING.md", category: "frontend", prompt: "Frontend testing strategy. Unit tests (Vitest), component tests (Testing Library), E2E tests (Playwright), visual regression, accessibility testing, and snapshot testing." },
  { name: "RESPONSIVE_DESIGN.md", category: "frontend", prompt: "Responsive design specification. Breakpoints, mobile-first patterns, touch targets, viewport handling, adaptive layouts, and device-specific optimizations." },

  // ═══════════════════════════════════════════
  // CATEGORY 8: DEVOPS & INFRASTRUCTURE (6 files)
  // ═══════════════════════════════════════════
  { name: "DEPLOYMENT_GUIDE.md", category: "devops", prompt: "Deployment guide. CI/CD pipeline, build process, environment promotion (dev → staging → prod), rollback procedures, and deployment checklist." },
  { name: "ENVIRONMENT_SETUP.md", category: "devops", prompt: "Environment configuration. All environment variables, their purposes, default values, required vs optional, and per-environment overrides." },
  { name: "MONITORING_OBSERVABILITY.md", category: "devops", prompt: "Monitoring and observability. Metrics collection, log aggregation, distributed tracing, alerting rules, dashboards, and on-call runbooks." },
  { name: "INCIDENT_RESPONSE.md", category: "devops", prompt: "Incident response playbook. Severity levels, escalation paths, communication templates, post-mortem template, and recovery procedures." },
  { name: "BACKUP_RECOVERY.md", category: "devops", prompt: "Backup and disaster recovery. Database backup schedule, point-in-time recovery, cross-region replication, RTO/RPO targets, and recovery testing procedures." },
  { name: "DEPENDENCIES_MANIFEST.md", category: "devops", prompt: "Complete dependency manifest. Analyze the project to produce: a full package.json dependencies + devDependencies list with exact versions, install commands for every package, configuration files needed (tsconfig, tailwind.config, next.config, postcss, etc.), system requirements (Node version, OS), and a single copy-paste setup script that installs everything from scratch." },

  // ═══════════════════════════════════════════
  // CATEGORY 9: TESTING & QA (6 files)
  // ═══════════════════════════════════════════
  { name: "TESTING_STRATEGY.md", category: "testing", prompt: "Testing strategy overview. Test pyramid, coverage targets, testing environments, test data management, and quality gates." },
  { name: "UNIT_TESTING.md", category: "testing", prompt: "Unit testing guide. Framework setup, mocking patterns, assertion best practices, test organization, and coverage enforcement." },
  { name: "INTEGRATION_TESTING.md", category: "testing", prompt: "Integration testing guide. API testing, database testing, third-party service mocking, test containers, and fixture management." },
  { name: "E2E_TESTING.md", category: "testing", prompt: "End-to-end testing guide. Playwright setup, page object model, test scenarios for critical user flows, CI integration, and flaky test management." },
  { name: "ACCESSIBILITY_TESTING.md", category: "testing", prompt: "Accessibility testing guide. WCAG 2.1 AA compliance, automated checks (axe-core), manual testing procedures, screen reader testing, and keyboard navigation." },
  { name: "SECURITY_TESTING.md", category: "testing", prompt: "Security testing guide. Penetration testing checklist, dependency vulnerability scanning, SAST/DAST tools, and security regression testing." },

  // ═══════════════════════════════════════════
  // CATEGORY 10: MARKETPLACE & BUSINESS (6 files)
  // ═══════════════════════════════════════════
  { name: "MARKETPLACE_ARCHITECTURE.md", category: "marketplace", prompt: "Marketplace system architecture. Listing lifecycle, category taxonomy, search and discovery, recommendation engine, and content moderation pipeline." },
  { name: "MONETIZATION_MODEL.md", category: "marketplace", prompt: "Monetization model documentation. Revenue streams (commissions, subscriptions, featured listings, ads), pricing strategy, payout system, and financial reporting." },
  { name: "CREATOR_ECOSYSTEM.md", category: "marketplace", prompt: "Creator ecosystem guide. Creator onboarding, verification, analytics dashboard, payout management, and creator success metrics." },
  { name: "SEARCH_DISCOVERY.md", category: "marketplace", prompt: "Search and discovery system. Full-text search implementation, faceted filtering, ranking algorithm, trending calculation, and personalization strategy." },
  { name: "CONTENT_MODERATION.md", category: "marketplace", prompt: "Content moderation system. Automated checks, human review queue, appeal process, content policies, and moderation tooling." },
  { name: "USER_LIFECYCLE.md", category: "marketplace", prompt: "User lifecycle documentation. Registration, onboarding, engagement loops, retention strategies, churn prevention, and account management." },

  // ═══════════════════════════════════════════
  // CATEGORY 11: INTEGRATIONS & ECOSYSTEM (6 files)
  // ═══════════════════════════════════════════
  { name: "GITHUB_INTEGRATION.md", category: "integrations", prompt: "GitHub integration guide. OAuth flow, repository access, webhook handling, file sync, and GitHub Actions integration." },
  { name: "STRIPE_INTEGRATION.md", category: "integrations", prompt: "Stripe integration guide. Checkout flow, subscription management, webhook handling, Connect payouts, refund processing, and invoice generation." },
  { name: "MCP_INTEGRATION.md", category: "integrations", prompt: "Model Context Protocol integration. MCP server registry, tool discovery, capability negotiation, authentication, and usage tracking." },
  { name: "EMAIL_SYSTEM.md", category: "integrations", prompt: "Email system documentation. Transactional emails, templates, delivery service, bounce handling, unsubscribe management, and email verification flow." },
  { name: "ANALYTICS_INTEGRATION.md", category: "integrations", prompt: "Analytics integration guide. PostHog setup, Google Analytics, Microsoft Clarity, custom event taxonomy, conversion tracking, and privacy compliance." },
  { name: "THIRD_PARTY_SERVICES.md", category: "integrations", prompt: "Third-party service catalog. Every external service, its purpose, API version, rate limits, fallback strategy, and health check procedures." },

  // ═══════════════════════════════════════════
  // CATEGORY 12: WORKFLOW & EXPANSION (6 files)
  // ═══════════════════════════════════════════
  { name: "WORKFLOW_HISTORY.md", category: "workflow", prompt: "Expansion workflow history. Timeline of all improvement rounds, suggestions applied, score progression from import to completion, and lessons learned." },
  { name: "ARCHITECTURE_REPORT.md", category: "workflow", prompt: "Architecture gap analysis report. Current state assessment, industry comparison (vs Stripe/Vercel/OpenAI), improvement recommendations, and technical debt inventory." },
  { name: "EXPANSION_PLAYBOOK.md", category: "workflow", prompt: "Expansion playbook. How to run future expansions, what triggers re-expansion, quality score interpretation, and continuous improvement process." },
  { name: "TECHNICAL_DEBT.md", category: "workflow", prompt: "Technical debt registry. Known shortcuts, temporary solutions, planned refactors, priority matrix, and estimated remediation effort for each item." },
  { name: "ROADMAP.md", category: "workflow", prompt: "Technical roadmap. Next 3/6/12 month feature plans, infrastructure upgrades, dependency updates, and architecture evolution milestones." },
  { name: "DECISION_LOG.md", category: "workflow", prompt: "Architecture Decision Records (ADRs). Key technical decisions, context, options considered, chosen approach, consequences, and review dates." },
]

// Category metadata for UI display
export const CATEGORIES: Record<string, { label: string; color: string; count: number }> = {
  foundation: { label: "Project Foundation", color: "amber", count: 6 },
  database: { label: "Database & Data Layer", color: "blue", count: 6 },
  api: { label: "API Design", color: "purple", count: 6 },
  security: { label: "Security", color: "red", count: 6 },
  scaling: { label: "Scaling & Performance", color: "green", count: 6 },
  ai: { label: "AI & Agent Systems", color: "pink", count: 6 },
  frontend: { label: "Frontend Architecture", color: "cyan", count: 6 },
  devops: { label: "DevOps & Infrastructure", color: "orange", count: 6 },
  testing: { label: "Testing & QA", color: "yellow", count: 6 },
  marketplace: { label: "Marketplace & Business", color: "emerald", count: 6 },
  integrations: { label: "Integrations & Ecosystem", color: "violet", count: 6 },
  workflow: { label: "Workflow & Expansion", color: "rose", count: 6 },
}
