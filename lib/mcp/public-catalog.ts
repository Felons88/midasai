export type McpProviderCatalogEntry = {
  id: string
  name: string
  company: string
  description: string
  category: string
  transport: "stdio" | "http" | "sse"
  docsUrl: string
  homepageUrl?: string
}

/** Curated MCP servers from major platforms (discovery catalog). */
export const MCP_PROVIDER_CATALOG: McpProviderCatalogEntry[] = [
  {
    id: "stripe",
    name: "Stripe",
    company: "Stripe",
    description: "Payments, billing, customers, and Stripe API resources for agents.",
    category: "Payments",
    transport: "http",
    docsUrl: "https://docs.stripe.com/mcp",
    homepageUrl: "https://stripe.com",
  },
  {
    id: "supabase",
    name: "Supabase",
    company: "Supabase",
    description: "Database, auth, storage, and edge functions via Supabase MCP.",
    category: "Database",
    transport: "http",
    docsUrl: "https://supabase.com/docs/guides/getting-started/mcp",
    homepageUrl: "https://supabase.com",
  },
  {
    id: "github",
    name: "GitHub",
    company: "GitHub",
    description: "Repos, issues, pull requests, and code search for Copilot agents.",
    category: "Developer",
    transport: "http",
    docsUrl: "https://docs.github.com/en/copilot/how-tos/context/model-context-protocol",
    homepageUrl: "https://github.com",
  },
  {
    id: "linear",
    name: "Linear",
    company: "Linear",
    description: "Issues, projects, and team workflows from Linear.",
    category: "Productivity",
    transport: "http",
    docsUrl: "https://linear.app/docs/mcp",
    homepageUrl: "https://linear.app",
  },
  {
    id: "notion",
    name: "Notion",
    company: "Notion",
    description: "Pages, databases, and workspace search through Notion MCP.",
    category: "Productivity",
    transport: "http",
    docsUrl: "https://developers.notion.com/docs/mcp",
    homepageUrl: "https://notion.so",
  },
  {
    id: "slack",
    name: "Slack",
    company: "Salesforce",
    description: "Channels, messages, and workspace context for Slack agents.",
    category: "Communication",
    transport: "http",
    docsUrl: "https://api.slack.com/docs/apps/ai/mcp",
    homepageUrl: "https://slack.com",
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    company: "Cloudflare",
    description: "Workers, DNS, R2, and edge operations via Cloudflare MCP.",
    category: "Infrastructure",
    transport: "http",
    docsUrl: "https://developers.cloudflare.com/agents/model-context-protocol/",
    homepageUrl: "https://cloudflare.com",
  },
  {
    id: "vercel",
    name: "Vercel",
    company: "Vercel",
    description: "Deployments, projects, domains, and logs from the Vercel platform.",
    category: "Infrastructure",
    transport: "http",
    docsUrl: "https://vercel.com/docs/agent-resources/vercel-mcp",
    homepageUrl: "https://vercel.com",
  },
  {
    id: "sentry",
    name: "Sentry",
    company: "Sentry",
    description: "Error monitoring, issues, and release health for production apps.",
    category: "Observability",
    transport: "http",
    docsUrl: "https://docs.sentry.io/product/sentry-mcp/",
    homepageUrl: "https://sentry.io",
  },
  {
    id: "posthog",
    name: "PostHog",
    company: "PostHog",
    description: "Product analytics, feature flags, and session insights.",
    category: "Analytics",
    transport: "http",
    docsUrl: "https://posthog.com/docs/model-context-protocol",
    homepageUrl: "https://posthog.com",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    company: "MongoDB",
    description: "Atlas clusters, collections, and document queries.",
    category: "Database",
    transport: "http",
    docsUrl: "https://www.mongodb.com/docs/atlas/atlas-mcp-server/",
    homepageUrl: "https://mongodb.com",
  },
  {
    id: "openai",
    name: "OpenAI",
    company: "OpenAI",
    description: "Files, assistants, and Responses API tooling for OpenAI agents.",
    category: "AI",
    transport: "http",
    docsUrl: "https://platform.openai.com/docs/guides/tools-mcp",
    homepageUrl: "https://openai.com",
  },
]
