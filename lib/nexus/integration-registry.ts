/**
 * Integration Registry — defines every external service a node can connect to.
 * Each integration specifies:
 *  - authType: "oauth" | "apikey" | "multi"  (multi = multiple API key fields)
 *  - For OAuth: the authorize URL is built server-side (/api/nexus/oauth/[provider])
 *  - For apikey/multi: fields the user must fill in manually
 */

export type AuthType = "oauth" | "apikey" | "multi"

export interface IntegrationField {
  key: string
  label: string
  type: "string" | "password" | "url"
  placeholder?: string
  required: boolean
  hint?: string
}

export interface Integration {
  id: string
  name: string
  icon: string        // brand id (matches BrandIcon) or emoji
  color: string
  authType: AuthType
  description: string
  fields?: IntegrationField[]  // only for apikey / multi
  docsUrl?: string
  oauthScopes?: string[]        // for oauth — informational display
}

export const INTEGRATION_REGISTRY: Integration[] = [
  // ── OAuth integrations ────────────────────────────────────────────────────────
  {
    id: "github",
    name: "GitHub",
    icon: "github",
    color: "#ffffff",
    authType: "oauth",
    description: "Access repositories, issues, pull requests, and GitHub Actions.",
    oauthScopes: ["repo", "read:user", "workflow"],
    docsUrl: "https://docs.github.com/en/apps/oauth-apps",
  },
  {
    id: "google",
    name: "Google",
    icon: "google",
    color: "#4285f4",
    authType: "oauth",
    description: "Access Gmail, Drive, Calendar, Sheets, and other Google Workspace APIs.",
    oauthScopes: ["email", "profile", "https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/drive"],
    docsUrl: "https://developers.google.com/identity/protocols/oauth2",
  },
  {
    id: "slack",
    name: "Slack",
    icon: "slack",
    color: "#4a154b",
    authType: "oauth",
    description: "Send messages, manage channels, and read Slack workspace data.",
    oauthScopes: ["chat:write", "channels:read", "users:read"],
    docsUrl: "https://api.slack.com/authentication",
  },
  {
    id: "discord",
    name: "Discord",
    icon: "discord",
    color: "#5865f2",
    authType: "oauth",
    description: "Send messages and manage Discord servers via OAuth.",
    oauthScopes: ["bot", "applications.commands"],
    docsUrl: "https://discord.com/developers/docs/topics/oauth2",
  },
  {
    id: "notion",
    name: "Notion",
    icon: "notion",
    color: "#000000",
    authType: "oauth",
    description: "Read and write Notion databases and pages.",
    oauthScopes: ["read_content", "update_content", "insert_content"],
    docsUrl: "https://developers.notion.com/docs/authorization",
  },
  {
    id: "linear",
    name: "Linear",
    icon: "linear",
    color: "#5e6ad2",
    authType: "oauth",
    description: "Manage Linear issues, projects, and teams.",
    oauthScopes: ["read", "write"],
    docsUrl: "https://developers.linear.app/docs/oauth/authentication",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    icon: "twitter",
    color: "#1da1f2",
    authType: "oauth",
    description: "Post tweets, read timelines, and search on Twitter/X.",
    oauthScopes: ["tweet.read", "tweet.write", "users.read"],
    docsUrl: "https://developer.twitter.com/en/docs/authentication/oauth-2-0",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "linkedin",
    color: "#0a66c2",
    authType: "oauth",
    description: "Post updates and read LinkedIn profile data.",
    oauthScopes: ["r_liteprofile", "w_member_social"],
    docsUrl: "https://learn.microsoft.com/en-us/linkedin/shared/authentication",
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: "stripe",
    color: "#635bff",
    authType: "oauth",
    description: "Manage Stripe customers, payments, and subscriptions.",
    oauthScopes: ["read_write"],
    docsUrl: "https://stripe.com/docs/connect/oauth-reference",
  },

  // ── API Key integrations ───────────────────────────────────────────────────────
  {
    id: "openai",
    name: "OpenAI",
    icon: "openai",
    color: "#10a37f",
    authType: "apikey",
    description: "GPT-4, GPT-4o, DALL-E, Whisper, and Embeddings.",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "sk-...", required: true, hint: "Found at platform.openai.com/api-keys" },
      { key: "org_id", label: "Organization ID (optional)", type: "string", placeholder: "org-...", required: false },
    ],
    docsUrl: "https://platform.openai.com/docs/authentication",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    icon: "anthropic",
    color: "#cc785c",
    authType: "apikey",
    description: "Claude 3 and Claude 3.5 language models.",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "sk-ant-...", required: true, hint: "Found at console.anthropic.com/account/keys" },
    ],
    docsUrl: "https://docs.anthropic.com/claude/reference/getting-started-with-the-api",
  },
  {
    id: "groq",
    name: "Groq",
    icon: "groq",
    color: "#f55036",
    authType: "apikey",
    description: "Ultra-fast LLM inference for Llama, Mixtral, and more.",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "gsk_...", required: true, hint: "Found at console.groq.com/keys" },
    ],
    docsUrl: "https://console.groq.com/docs/quickstart",
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: "telegram",
    color: "#2ca5e0",
    authType: "apikey",
    description: "Send messages and manage Telegram bots via the Bot API.",
    fields: [
      { key: "bot_token", label: "Bot Token", type: "password", placeholder: "123456:ABC-DEF...", required: true, hint: "Get from @BotFather on Telegram" },
    ],
    docsUrl: "https://core.telegram.org/bots/api",
  },
  {
    id: "discord_bot",
    name: "Discord Bot",
    icon: "discord",
    color: "#5865f2",
    authType: "apikey",
    description: "Use a Discord Bot Token for server management and messaging.",
    fields: [
      { key: "bot_token", label: "Bot Token", type: "password", placeholder: "MTA...", required: true, hint: "Found at discord.com/developers/applications → Bot" },
    ],
    docsUrl: "https://discord.com/developers/docs/topics/oauth2#bots",
  },
  {
    id: "supabase",
    name: "Supabase",
    icon: "supabase",
    color: "#3ecf8e",
    authType: "multi",
    description: "Connect to your Supabase project for database, auth, and storage.",
    fields: [
      { key: "url", label: "Project URL", type: "url", placeholder: "https://xxxx.supabase.co", required: true, hint: "Settings → API → Project URL" },
      { key: "anon_key", label: "Anon / Public Key", type: "password", placeholder: "eyJ...", required: true, hint: "Settings → API → Project API Keys" },
      { key: "service_key", label: "Service Role Key (optional)", type: "password", placeholder: "eyJ...", required: false, hint: "Only needed for admin operations" },
    ],
    docsUrl: "https://supabase.com/docs/guides/api",
  },
  {
    id: "aws",
    name: "AWS",
    icon: "aws",
    color: "#f97316",
    authType: "multi",
    description: "Amazon Web Services — S3, Lambda, SES, and more.",
    fields: [
      { key: "access_key_id", label: "Access Key ID", type: "string", placeholder: "AKIA...", required: true },
      { key: "secret_access_key", label: "Secret Access Key", type: "password", placeholder: "...", required: true },
      { key: "region", label: "Default Region", type: "string", placeholder: "us-east-1", required: false },
    ],
    docsUrl: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html",
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    icon: "cloudflare",
    color: "#f48120",
    authType: "multi",
    description: "Workers, KV, R2, and DNS management via Cloudflare API.",
    fields: [
      { key: "api_token", label: "API Token", type: "password", placeholder: "...", required: true, hint: "dash.cloudflare.com/profile/api-tokens" },
      { key: "account_id", label: "Account ID", type: "string", placeholder: "...", required: false },
    ],
    docsUrl: "https://developers.cloudflare.com/fundamentals/api",
  },
  {
    id: "vercel",
    name: "Vercel",
    icon: "vercel",
    color: "#ffffff",
    authType: "apikey",
    description: "Deploy projects and manage domains on Vercel.",
    fields: [
      { key: "api_token", label: "API Token", type: "password", placeholder: "...", required: true, hint: "vercel.com/account/tokens" },
    ],
    docsUrl: "https://vercel.com/docs/rest-api",
  },
  {
    id: "twilio",
    name: "Twilio",
    icon: "twilio",
    color: "#f22f46",
    authType: "multi",
    description: "SMS, voice calls, and WhatsApp messaging.",
    fields: [
      { key: "account_sid", label: "Account SID", type: "string", placeholder: "AC...", required: true },
      { key: "auth_token", label: "Auth Token", type: "password", placeholder: "...", required: true },
      { key: "from_number", label: "From Phone Number", type: "string", placeholder: "+1...", required: false },
    ],
    docsUrl: "https://www.twilio.com/docs/usage/api",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    icon: "sendgrid",
    color: "#1a82e2",
    authType: "apikey",
    description: "Transactional and marketing email via SendGrid.",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "SG...", required: true, hint: "app.sendgrid.com/settings/api_keys" },
    ],
    docsUrl: "https://docs.sendgrid.com/api-reference",
  },
  {
    id: "resend",
    name: "Resend",
    icon: "resend",
    color: "#000000",
    authType: "apikey",
    description: "Modern transactional email API.",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "re_...", required: true, hint: "resend.com/api-keys" },
    ],
    docsUrl: "https://resend.com/docs",
  },
  {
    id: "pinecone",
    name: "Pinecone",
    icon: "🌲",
    color: "#00a67e",
    authType: "multi",
    description: "Managed vector database for AI applications.",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "...", required: true },
      { key: "environment", label: "Environment", type: "string", placeholder: "us-east-1-aws", required: true },
    ],
    docsUrl: "https://docs.pinecone.io/docs/authentication",
  },
  {
    id: "qdrant",
    name: "Qdrant",
    icon: "🔮",
    color: "#6438c3",
    authType: "multi",
    description: "Open-source vector database.",
    fields: [
      { key: "url", label: "Qdrant URL", type: "url", placeholder: "https://xxx.qdrant.io", required: true },
      { key: "api_key", label: "API Key", type: "password", placeholder: "...", required: false, hint: "Optional for self-hosted" },
    ],
    docsUrl: "https://qdrant.tech/documentation/quick-start",
  },
  {
    id: "posthog",
    name: "PostHog",
    icon: "posthog",
    color: "#f54e00",
    authType: "multi",
    description: "Product analytics and event tracking.",
    fields: [
      { key: "api_key", label: "Project API Key", type: "string", placeholder: "phc_...", required: true },
      { key: "host", label: "Host (optional)", type: "url", placeholder: "https://app.posthog.com", required: false },
    ],
    docsUrl: "https://posthog.com/docs/api",
  },
  {
    id: "railway",
    name: "Railway",
    icon: "railway",
    color: "#7B61FF",
    authType: "apikey",
    description: "Deploy and manage services on Railway.",
    fields: [
      { key: "api_token", label: "API Token", type: "password", placeholder: "...", required: true, hint: "railway.app/account/tokens" },
    ],
    docsUrl: "https://docs.railway.app/reference/public-api",
  },
  {
    id: "azure",
    name: "Azure",
    icon: "azure",
    color: "#0078d4",
    authType: "multi",
    description: "Azure Blob Storage, Functions, and more.",
    fields: [
      { key: "connection_string", label: "Connection String", type: "password", placeholder: "DefaultEndpointsProtocol=https;...", required: true },
    ],
    docsUrl: "https://docs.microsoft.com/en-us/azure/storage/common/storage-configure-connection-string",
  },
  {
    id: "pagerduty",
    name: "PagerDuty",
    icon: "pagerduty",
    color: "#00b050",
    authType: "apikey",
    description: "Incident management and alerting.",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "...", required: true, hint: "app.pagerduty.com/api_keys" },
    ],
    docsUrl: "https://developer.pagerduty.com/api-reference",
  },
  {
    id: "wordpress",
    name: "WordPress",
    icon: "wordpress",
    color: "#21759b",
    authType: "multi",
    description: "WordPress REST API access.",
    fields: [
      { key: "site_url", label: "Site URL", type: "url", placeholder: "https://mysite.com", required: true },
      { key: "username", label: "Username", type: "string", placeholder: "admin", required: true },
      { key: "app_password", label: "Application Password", type: "password", placeholder: "xxxx xxxx xxxx xxxx", required: true, hint: "Users → Profile → Application Passwords" },
    ],
    docsUrl: "https://developer.wordpress.org/rest-api",
  },
  {
    id: "contentful",
    name: "Contentful",
    icon: "contentful",
    color: "#fad400",
    authType: "multi",
    description: "Contentful CMS API access.",
    fields: [
      { key: "access_token", label: "Delivery API Token", type: "password", placeholder: "...", required: true },
      { key: "management_token", label: "Management API Token", type: "password", placeholder: "...", required: false, hint: "Needed for create/update operations" },
    ],
    docsUrl: "https://www.contentful.com/developers/docs/references/authentication",
  },
  {
    id: "cal_com",
    name: "Cal.com",
    icon: "cal",
    color: "#111827",
    authType: "apikey",
    description: "Cal.com scheduling and booking API.",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "cal_live_...", required: true, hint: "app.cal.com/settings/developer/api-keys" },
    ],
    docsUrl: "https://developer.cal.com/api",
  },
  {
    id: "search",
    name: "Search API",
    icon: "🔍",
    color: "#4285f4",
    authType: "apikey",
    description: "Brave Search, Serper, or Bing search API key.",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "...", required: true },
      { key: "provider", label: "Provider", type: "string", placeholder: "brave / serper / bing", required: false },
    ],
    docsUrl: "https://brave.com/search/api",
  },
  {
    id: "docker",
    name: "Docker",
    icon: "docker",
    color: "#2496ed",
    authType: "multi",
    description: "Docker Hub or private registry credentials.",
    fields: [
      { key: "registry_url", label: "Registry URL", type: "url", placeholder: "https://index.docker.io/v1/", required: false },
      { key: "username", label: "Username", type: "string", required: true },
      { key: "password", label: "Password / Token", type: "password", required: true },
    ],
    docsUrl: "https://docs.docker.com/reference/cli/docker/login",
  },
]

export function getIntegration(id: string): Integration | undefined {
  return INTEGRATION_REGISTRY.find(i => i.id === id)
}

/** Map from credential key (used in NodeDefinition.credentials[]) to integration id */
export const CREDENTIAL_TO_INTEGRATION: Record<string, string> = {
  openai: "openai",
  anthropic: "anthropic",
  groq: "groq",
  google: "google",
  github: "github",
  slack: "slack",
  discord: "discord",
  telegram: "telegram",
  discord_bot: "discord_bot",
  stripe: "stripe",
  notion: "notion",
  linear: "linear",
  twitter: "twitter",
  linkedin: "linkedin",
  supabase: "supabase",
  aws: "aws",
  cloudflare: "cloudflare",
  vercel: "vercel",
  twilio: "twilio",
  sendgrid: "sendgrid",
  resend: "resend",
  analytics: "posthog",
  vector_db: "pinecone",
  railway: "railway",
  azure: "azure",
  pagerduty: "pagerduty",
  wordpress: "wordpress",
  contentful: "contentful",
  cal_com: "cal_com",
  search: "search",
  docker: "docker",
  push: "sendgrid",
}

/** Providers that support server-side OAuth redirect */
export const OAUTH_PROVIDERS = new Set([
  "github", "google", "slack", "discord", "notion", "linear", "twitter", "linkedin", "stripe",
])
