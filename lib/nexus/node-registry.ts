// Nexus Node Registry — production node definitions
// Every node has: metadata, icon, category, inputs, outputs, config schema, validation, execution impl key

export type NodeCategory =
  | "ai" | "llm" | "image" | "audio" | "developer" | "database"
  | "cloud" | "logic" | "files" | "midas" | "analytics" | "browser"
  | "ide" | "communication" | "data" | "devops" | "finance" | "crm"

export type FieldType =
  | "string" | "number" | "boolean" | "select" | "multiselect"
  | "textarea" | "json" | "code" | "secret" | "url" | "file" | "credential"

export interface NodeField {
  key: string
  label: string
  type: FieldType
  required?: boolean
  default?: unknown
  options?: { label: string; value: string; icon?: string }[]
  placeholder?: string
  description?: string
  group?: string
  showIf?: Record<string, unknown>
  validate?: (v: unknown) => string | null
}

export interface NodePort {
  id: string
  label: string
  type: "any" | "string" | "number" | "boolean" | "object" | "array" | "trigger"
  required?: boolean
}

export interface NodeDefinition {
  id: string
  name: string
  description: string
  category: NodeCategory
  /** SVG path or URL or brand color letter */
  icon: string
  /** Hex brand color */
  color: string
  inputs: NodePort[]
  outputs: NodePort[]
  credentials?: string[]
  fields: NodeField[]
  /** Server-side executor key */
  executor: string
  docs?: string
  tags?: string[]
  premium?: boolean
}

const T = (id: string, label: string): NodePort => ({ id, label, type: "trigger" })
const D = (id: string, label: string, type: NodePort["type"] = "any"): NodePort => ({ id, label, type })

export const NODE_REGISTRY: NodeDefinition[] = [

  // ─── AI / LLM ────────────────────────────────────────────────────────────────

  {
    id: "ai.chat",
    name: "AI Chat",
    description: "Chat with any AI model using a unified provider interface.",
    category: "ai",
    icon: "✦",
    color: "#7c3aed",
    inputs: [D("trigger", "Trigger", "trigger"), D("prompt", "Prompt", "string"), D("context", "Context", "any")],
    outputs: [D("response", "Response", "string"), D("usage", "Usage", "object"), D("raw", "Raw", "object")],
    credentials: ["ai_provider"],
    fields: [
      { key: "provider", label: "Provider", type: "select", required: true, default: "openai", options: [
        { label: "OpenAI", value: "openai", icon: "openai" },
        { label: "Anthropic", value: "anthropic", icon: "anthropic" },
        { label: "Google Gemini", value: "gemini", icon: "google" },
        { label: "Groq", value: "groq", icon: "groq" },
        { label: "OpenRouter", value: "openrouter", icon: "openrouter" },
        { label: "Ollama (Local)", value: "ollama", icon: "ollama" },
        { label: "Together AI", value: "together", icon: "together" },
        { label: "Replicate", value: "replicate", icon: "replicate" },
        { label: "Mistral", value: "mistral", icon: "mistral" },
        { label: "Cohere", value: "cohere", icon: "cohere" },
        { label: "xAI Grok", value: "xai", icon: "xai" },
        { label: "DeepSeek", value: "deepseek", icon: "deepseek" },
        { label: "Fireworks", value: "fireworks", icon: "fireworks" },
        { label: "Perplexity", value: "perplexity", icon: "perplexity" },
      ]},
      { key: "model", label: "Model", type: "string", required: true, default: "gpt-4o", placeholder: "gpt-4o, claude-3-5-sonnet, gemini-1.5-pro..." },
      { key: "system_prompt", label: "System Prompt", type: "textarea", placeholder: "You are a helpful assistant...", group: "Prompts" },
      { key: "user_prompt", label: "User Prompt", type: "textarea", placeholder: "{{$input.message}}", group: "Prompts" },
      { key: "temperature", label: "Temperature", type: "number", default: 0.7, group: "Parameters" },
      { key: "max_tokens", label: "Max Tokens", type: "number", default: 2048, group: "Parameters" },
      { key: "streaming", label: "Streaming", type: "boolean", default: false, group: "Parameters" },
      { key: "json_mode", label: "JSON Mode", type: "boolean", default: false, group: "Parameters" },
      { key: "base_url", label: "Base URL Override", type: "url", placeholder: "https://api.openai.com/v1", group: "Advanced" },
      { key: "api_key_override", label: "API Key Override", type: "secret", group: "Advanced" },
    ],
    executor: "ai_chat",
    tags: ["ai", "llm", "chat", "openai", "anthropic", "gemini"],
  },

  {
    id: "ai.embed",
    name: "AI Embeddings",
    description: "Generate vector embeddings from text for semantic search.",
    category: "ai",
    icon: "⊞",
    color: "#7c3aed",
    inputs: [D("trigger", "Trigger", "trigger"), D("text", "Text", "string")],
    outputs: [D("embedding", "Embedding", "array"), D("dimensions", "Dimensions", "number")],
    credentials: ["ai_provider"],
    fields: [
      { key: "provider", label: "Provider", type: "select", required: true, default: "openai", options: [
        { label: "OpenAI", value: "openai" },
        { label: "Cohere", value: "cohere" },
        { label: "Mistral", value: "mistral" },
        { label: "Ollama", value: "ollama" },
      ]},
      { key: "model", label: "Model", type: "string", default: "text-embedding-3-small" },
      { key: "dimensions", label: "Dimensions", type: "number", default: 1536, group: "Advanced" },
    ],
    executor: "ai_embed",
    tags: ["ai", "embeddings", "vector", "search"],
  },

  {
    id: "ai.image",
    name: "AI Image Generation",
    description: "Generate images using AI models.",
    category: "image",
    icon: "🖼",
    color: "#db2777",
    inputs: [D("trigger", "Trigger", "trigger"), D("prompt", "Prompt", "string")],
    outputs: [D("image_url", "Image URL", "string"), D("base64", "Base64", "string")],
    credentials: ["ai_provider"],
    fields: [
      { key: "provider", label: "Provider", type: "select", required: true, default: "openai", options: [
        { label: "OpenAI DALL-E", value: "openai" },
        { label: "Fal.ai", value: "fal" },
        { label: "Replicate", value: "replicate" },
        { label: "Stability AI", value: "stability" },
      ]},
      { key: "model", label: "Model", type: "string", default: "dall-e-3" },
      { key: "prompt", label: "Prompt", type: "textarea", required: true },
      { key: "size", label: "Size", type: "select", default: "1024x1024", options: [
        { label: "1024×1024", value: "1024x1024" },
        { label: "1792×1024", value: "1792x1024" },
        { label: "1024×1792", value: "1024x1792" },
      ]},
      { key: "quality", label: "Quality", type: "select", default: "standard", options: [{ label: "Standard", value: "standard" }, { label: "HD", value: "hd" }] },
      { key: "style", label: "Style", type: "select", default: "vivid", options: [{ label: "Vivid", value: "vivid" }, { label: "Natural", value: "natural" }] },
      { key: "n", label: "Count", type: "number", default: 1, group: "Advanced" },
    ],
    executor: "ai_image",
    tags: ["ai", "image", "generation", "dall-e", "stable-diffusion"],
  },

  {
    id: "ai.transcribe",
    name: "AI Transcription",
    description: "Transcribe audio to text using Whisper or compatible models.",
    category: "audio",
    icon: "🎙",
    color: "#0891b2",
    inputs: [D("trigger", "Trigger", "trigger"), D("audio", "Audio File", "any")],
    outputs: [D("text", "Transcript", "string"), D("segments", "Segments", "array")],
    credentials: ["ai_provider"],
    fields: [
      { key: "provider", label: "Provider", type: "select", default: "openai", options: [{ label: "OpenAI Whisper", value: "openai" }, { label: "Groq Whisper", value: "groq" }] },
      { key: "language", label: "Language", type: "string", placeholder: "en", default: "en" },
      { key: "prompt", label: "Hint Prompt", type: "string", placeholder: "Optional context..." },
    ],
    executor: "ai_transcribe",
    tags: ["ai", "audio", "transcription", "whisper"],
  },

  {
    id: "ai.classify",
    name: "AI Classifier",
    description: "Classify text into categories using AI.",
    category: "ai",
    icon: "⬡",
    color: "#7c3aed",
    inputs: [D("trigger", "Trigger", "trigger"), D("text", "Text", "string")],
    outputs: [D("category", "Category", "string"), D("confidence", "Confidence", "number"), D("all", "All Scores", "object")],
    credentials: ["ai_provider"],
    fields: [
      { key: "provider", label: "Provider", type: "select", default: "openai", options: [{ label: "OpenAI", value: "openai" }, { label: "Anthropic", value: "anthropic" }] },
      { key: "categories", label: "Categories (comma-separated)", type: "string", required: true, placeholder: "positive, negative, neutral" },
      { key: "model", label: "Model", type: "string", default: "gpt-4o-mini" },
    ],
    executor: "ai_classify",
    tags: ["ai", "classification", "nlp"],
  },

  {
    id: "ai.extract",
    name: "AI Data Extraction",
    description: "Extract structured data from unstructured text using AI.",
    category: "ai",
    icon: "⊕",
    color: "#7c3aed",
    inputs: [D("trigger", "Trigger", "trigger"), D("text", "Text", "string")],
    outputs: [D("data", "Extracted Data", "object"), D("raw", "Raw Response", "string")],
    credentials: ["ai_provider"],
    fields: [
      { key: "provider", label: "Provider", type: "select", default: "openai", options: [{ label: "OpenAI", value: "openai" }, { label: "Anthropic", value: "anthropic" }] },
      { key: "model", label: "Model", type: "string", default: "gpt-4o" },
      { key: "schema", label: "Output Schema (JSON)", type: "json", required: true, placeholder: '{"name": "string", "email": "string"}' },
      { key: "instructions", label: "Instructions", type: "textarea", placeholder: "Extract the customer's name and email..." },
    ],
    executor: "ai_extract",
    tags: ["ai", "extraction", "structured", "json"],
  },

  {
    id: "ai.agent",
    name: "AI Agent",
    description: "Run an autonomous AI agent with tool access.",
    category: "ai",
    icon: "◈",
    color: "#7c3aed",
    inputs: [D("trigger", "Trigger", "trigger"), D("task", "Task", "string"), D("context", "Context", "any")],
    outputs: [D("result", "Result", "string"), D("steps", "Steps", "array"), D("tools_used", "Tools Used", "array")],
    credentials: ["ai_provider"],
    fields: [
      { key: "provider", label: "Provider", type: "select", default: "openai", options: [{ label: "OpenAI", value: "openai" }, { label: "Anthropic", value: "anthropic" }] },
      { key: "model", label: "Model", type: "string", default: "gpt-4o" },
      { key: "system_prompt", label: "Agent Instructions", type: "textarea" },
      { key: "max_steps", label: "Max Steps", type: "number", default: 10, group: "Advanced" },
      { key: "tools", label: "Available Tools", type: "multiselect", options: [
        { label: "Web Search", value: "web_search" },
        { label: "Code Execution", value: "code_exec" },
        { label: "File System", value: "file_system" },
        { label: "HTTP Request", value: "http" },
      ], group: "Advanced" },
    ],
    executor: "ai_agent",
    tags: ["ai", "agent", "autonomous"],
  },

  // ─── Developer / HTTP ─────────────────────────────────────────────────────────

  {
    id: "dev.http",
    name: "HTTP Request",
    description: "Make HTTP requests to any API endpoint.",
    category: "developer",
    icon: "⬡",
    color: "#2563eb",
    inputs: [D("trigger", "Trigger", "trigger"), D("body", "Body", "any"), D("headers_in", "Headers", "object")],
    outputs: [D("response", "Response", "object"), D("status", "Status Code", "number"), D("headers", "Headers", "object"), D("body_out", "Body", "any")],
    fields: [
      { key: "method", label: "Method", type: "select", required: true, default: "GET", options: ["GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS"].map(m => ({ label: m, value: m })) },
      { key: "url", label: "URL", type: "url", required: true, placeholder: "https://api.example.com/data" },
      { key: "headers", label: "Headers", type: "json", default: {}, group: "Headers" },
      { key: "body", label: "Body", type: "json", group: "Body" },
      { key: "auth_type", label: "Auth Type", type: "select", default: "none", options: [{ label: "None", value: "none" }, { label: "Bearer Token", value: "bearer" }, { label: "Basic Auth", value: "basic" }, { label: "API Key", value: "apikey" }], group: "Auth" },
      { key: "auth_value", label: "Auth Value", type: "secret", group: "Auth", showIf: { auth_type: ["bearer", "basic", "apikey"] } },
      { key: "timeout_ms", label: "Timeout (ms)", type: "number", default: 30000, group: "Advanced" },
      { key: "retry_count", label: "Retry Count", type: "number", default: 0, group: "Advanced" },
      { key: "follow_redirects", label: "Follow Redirects", type: "boolean", default: true, group: "Advanced" },
    ],
    executor: "http_request",
    tags: ["http", "api", "rest", "fetch"],
  },

  {
    id: "dev.webhook",
    name: "Webhook Trigger",
    description: "Receive and process incoming webhook payloads.",
    category: "developer",
    icon: "⇥",
    color: "#2563eb",
    inputs: [],
    outputs: [D("body", "Body", "object"), D("headers", "Headers", "object"), D("method", "Method", "string"), D("query", "Query", "object")],
    fields: [
      { key: "path", label: "Webhook Path", type: "string", required: true, placeholder: "/webhooks/my-hook" },
      { key: "secret", label: "Secret (HMAC)", type: "secret" },
      { key: "response_code", label: "Response Code", type: "number", default: 200 },
      { key: "response_body", label: "Response Body", type: "json", default: { ok: true } },
    ],
    executor: "webhook_trigger",
    tags: ["webhook", "trigger", "http"],
  },

  {
    id: "dev.schedule",
    name: "Schedule / Cron",
    description: "Trigger workflows on a schedule using cron expressions.",
    category: "developer",
    icon: "⊙",
    color: "#2563eb",
    inputs: [],
    outputs: [D("timestamp", "Timestamp", "string"), D("tick", "Tick", "number")],
    fields: [
      { key: "cron", label: "Cron Expression", type: "string", required: true, placeholder: "0 9 * * 1-5", description: "Standard cron: min hour day month weekday" },
      { key: "timezone", label: "Timezone", type: "string", default: "UTC", placeholder: "America/New_York" },
    ],
    executor: "schedule",
    tags: ["schedule", "cron", "trigger"],
  },

  {
    id: "dev.code",
    name: "Code / Script",
    description: "Execute JavaScript code with access to workflow context.",
    category: "developer",
    icon: "</>",
    color: "#059669",
    inputs: [D("trigger", "Trigger", "trigger"), D("data", "Data", "any")],
    outputs: [D("result", "Result", "any"), D("error", "Error", "string")],
    fields: [
      { key: "language", label: "Language", type: "select", default: "javascript", options: [{ label: "JavaScript", value: "javascript" }, { label: "TypeScript", value: "typescript" }, { label: "Python", value: "python" }] },
      { key: "code", label: "Code", type: "code", required: true, default: "// Access input via $input\n// Return result\nreturn { result: $input }" },
      { key: "timeout_ms", label: "Timeout (ms)", type: "number", default: 10000, group: "Advanced" },
    ],
    executor: "code_exec",
    tags: ["code", "script", "javascript", "python"],
  },

  // ─── GitHub ───────────────────────────────────────────────────────────────────

  {
    id: "github.repo",
    name: "GitHub Repository",
    description: "Read files, commits, issues from GitHub repos.",
    category: "developer",
    icon: "github",
    color: "#24292f",
    inputs: [D("trigger", "Trigger", "trigger")],
    outputs: [D("data", "Data", "object"), D("items", "Items", "array")],
    credentials: ["github"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "get_repo", options: [
        { label: "Get Repository", value: "get_repo" },
        { label: "List Files", value: "list_files" },
        { label: "Get File Content", value: "get_file" },
        { label: "List Commits", value: "list_commits" },
        { label: "List Issues", value: "list_issues" },
        { label: "Create Issue", value: "create_issue" },
        { label: "List Pull Requests", value: "list_prs" },
        { label: "Create PR", value: "create_pr" },
        { label: "Search Code", value: "search_code" },
      ]},
      { key: "owner", label: "Owner", type: "string", required: true, placeholder: "octocat" },
      { key: "repo", label: "Repository", type: "string", required: true, placeholder: "my-repo" },
      { key: "path", label: "File Path", type: "string", placeholder: "src/index.ts", showIf: { operation: ["get_file", "list_files"] } },
      { key: "branch", label: "Branch", type: "string", default: "main" },
      { key: "query", label: "Search Query", type: "string", showIf: { operation: ["search_code"] } },
    ],
    executor: "github",
    tags: ["github", "git", "repository", "code"],
  },

  {
    id: "github.actions",
    name: "GitHub Actions",
    description: "Trigger and monitor GitHub Actions workflows.",
    category: "devops",
    icon: "github",
    color: "#24292f",
    inputs: [D("trigger", "Trigger", "trigger")],
    outputs: [D("run", "Run", "object"), D("status", "Status", "string")],
    credentials: ["github"],
    fields: [
      { key: "owner", label: "Owner", type: "string", required: true },
      { key: "repo", label: "Repository", type: "string", required: true },
      { key: "workflow_id", label: "Workflow ID / Filename", type: "string", required: true, placeholder: "ci.yml" },
      { key: "ref", label: "Branch/Tag", type: "string", default: "main" },
      { key: "inputs", label: "Inputs", type: "json" },
    ],
    executor: "github_actions",
    tags: ["github", "actions", "ci", "cd"],
  },

  // ─── Database ─────────────────────────────────────────────────────────────────

  {
    id: "db.supabase",
    name: "Supabase",
    description: "Query, insert, update, delete records in Supabase.",
    category: "database",
    icon: "supabase",
    color: "#3ecf8e",
    inputs: [D("trigger", "Trigger", "trigger"), D("data", "Data", "object")],
    outputs: [D("result", "Result", "any"), D("count", "Count", "number")],
    credentials: ["supabase"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "select", options: [
        { label: "Select", value: "select" },
        { label: "Insert", value: "insert" },
        { label: "Update", value: "update" },
        { label: "Upsert", value: "upsert" },
        { label: "Delete", value: "delete" },
        { label: "RPC", value: "rpc" },
      ]},
      { key: "table", label: "Table", type: "string", required: true, placeholder: "my_table" },
      { key: "select_columns", label: "Columns", type: "string", default: "*", showIf: { operation: ["select"] } },
      { key: "filter", label: "Filter (JSON)", type: "json", placeholder: '{"id": "eq.123"}', showIf: { operation: ["select", "update", "delete"] } },
      { key: "data", label: "Data (JSON)", type: "json", showIf: { operation: ["insert", "update", "upsert"] } },
      { key: "rpc_name", label: "Function Name", type: "string", showIf: { operation: ["rpc"] } },
      { key: "rpc_args", label: "Function Args (JSON)", type: "json", showIf: { operation: ["rpc"] } },
      { key: "limit", label: "Limit", type: "number", default: 100, showIf: { operation: ["select"] } },
      { key: "order", label: "Order By", type: "string", placeholder: "created_at.desc", showIf: { operation: ["select"] } },
    ],
    executor: "supabase_db",
    tags: ["supabase", "database", "postgresql", "query"],
  },

  {
    id: "db.postgres",
    name: "PostgreSQL",
    description: "Execute raw SQL queries against PostgreSQL.",
    category: "database",
    icon: "postgres",
    color: "#336791",
    inputs: [D("trigger", "Trigger", "trigger"), D("params", "Params", "array")],
    outputs: [D("rows", "Rows", "array"), D("count", "Row Count", "number")],
    credentials: ["postgres"],
    fields: [
      { key: "query", label: "SQL Query", type: "code", required: true, placeholder: "SELECT * FROM users WHERE id = $1" },
      { key: "params", label: "Parameters (JSON array)", type: "json", default: [] },
      { key: "transaction", label: "Use Transaction", type: "boolean", default: false },
    ],
    executor: "postgres_query",
    tags: ["postgresql", "sql", "database"],
  },

  {
    id: "db.redis",
    name: "Redis",
    description: "Get, set, delete Redis keys. Publish to channels.",
    category: "database",
    icon: "redis",
    color: "#dc382d",
    inputs: [D("trigger", "Trigger", "trigger"), D("value", "Value", "any")],
    outputs: [D("result", "Result", "any"), D("ttl", "TTL", "number")],
    credentials: ["redis"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "get", options: [
        { label: "Get", value: "get" },
        { label: "Set", value: "set" },
        { label: "Delete", value: "del" },
        { label: "Incr", value: "incr" },
        { label: "Expire", value: "expire" },
        { label: "Publish", value: "publish" },
        { label: "Subscribe", value: "subscribe" },
        { label: "HSET", value: "hset" },
        { label: "HGET", value: "hget" },
        { label: "LPUSH", value: "lpush" },
        { label: "LRANGE", value: "lrange" },
      ]},
      { key: "key", label: "Key", type: "string", required: true },
      { key: "value", label: "Value", type: "string", showIf: { operation: ["set", "hset", "lpush", "publish"] } },
      { key: "ttl", label: "TTL (seconds)", type: "number", showIf: { operation: ["set", "expire"] } },
      { key: "field", label: "Hash Field", type: "string", showIf: { operation: ["hset", "hget"] } },
    ],
    executor: "redis_op",
    tags: ["redis", "cache", "pubsub"],
  },

  {
    id: "db.mongodb",
    name: "MongoDB",
    description: "Query, insert, update, delete documents in MongoDB.",
    category: "database",
    icon: "mongodb",
    color: "#4db33d",
    inputs: [D("trigger", "Trigger", "trigger"), D("document", "Document", "object")],
    outputs: [D("result", "Result", "any"), D("count", "Count", "number")],
    credentials: ["mongodb"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "find", options: [
        { label: "Find", value: "find" },
        { label: "FindOne", value: "findOne" },
        { label: "InsertOne", value: "insertOne" },
        { label: "InsertMany", value: "insertMany" },
        { label: "UpdateOne", value: "updateOne" },
        { label: "DeleteOne", value: "deleteOne" },
        { label: "Aggregate", value: "aggregate" },
      ]},
      { key: "database", label: "Database", type: "string", required: true },
      { key: "collection", label: "Collection", type: "string", required: true },
      { key: "filter", label: "Filter (JSON)", type: "json", default: {} },
      { key: "document", label: "Document (JSON)", type: "json", showIf: { operation: ["insertOne", "updateOne"] } },
      { key: "pipeline", label: "Pipeline (JSON array)", type: "json", showIf: { operation: ["aggregate"] } },
    ],
    executor: "mongodb_op",
    tags: ["mongodb", "nosql", "database"],
  },

  // ─── Cloud ────────────────────────────────────────────────────────────────────

  {
    id: "cloud.s3",
    name: "AWS S3",
    description: "Upload, download, list, delete objects in S3 buckets.",
    category: "cloud",
    icon: "aws",
    color: "#ff9900",
    inputs: [D("trigger", "Trigger", "trigger"), D("file", "File", "any")],
    outputs: [D("url", "URL", "string"), D("key", "Key", "string"), D("metadata", "Metadata", "object")],
    credentials: ["aws"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "upload", options: [
        { label: "Upload", value: "upload" },
        { label: "Download", value: "download" },
        { label: "List Objects", value: "list" },
        { label: "Delete Object", value: "delete" },
        { label: "Get Presigned URL", value: "presign" },
      ]},
      { key: "bucket", label: "Bucket", type: "string", required: true },
      { key: "key", label: "Object Key", type: "string", required: true, placeholder: "uploads/file.pdf" },
      { key: "region", label: "Region", type: "string", default: "us-east-1" },
      { key: "acl", label: "ACL", type: "select", default: "private", options: [{ label: "Private", value: "private" }, { label: "Public Read", value: "public-read" }] },
    ],
    executor: "aws_s3",
    tags: ["aws", "s3", "storage", "cloud"],
  },

  {
    id: "cloud.gcs",
    name: "Google Cloud Storage",
    description: "Upload, download, list, delete objects in GCS buckets.",
    category: "cloud",
    icon: "google",
    color: "#4285f4",
    inputs: [D("trigger", "Trigger", "trigger"), D("file", "File", "any")],
    outputs: [D("url", "URL", "string"), D("name", "Name", "string")],
    credentials: ["gcp"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "upload", options: ["upload", "download", "list", "delete"].map(o => ({ label: o.charAt(0).toUpperCase() + o.slice(1), value: o })) },
      { key: "bucket", label: "Bucket", type: "string", required: true },
      { key: "name", label: "Object Name", type: "string", required: true },
    ],
    executor: "gcs",
    tags: ["gcp", "storage", "cloud", "google"],
  },

  {
    id: "cloud.cloudflare",
    name: "Cloudflare",
    description: "Cloudflare Workers KV, R2, DNS, cache purge.",
    category: "cloud",
    icon: "cloudflare",
    color: "#f48120",
    inputs: [D("trigger", "Trigger", "trigger"), D("data", "Data", "any")],
    outputs: [D("result", "Result", "any")],
    credentials: ["cloudflare"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "kv_get", options: [
        { label: "KV Get", value: "kv_get" },
        { label: "KV Put", value: "kv_put" },
        { label: "KV Delete", value: "kv_delete" },
        { label: "R2 Upload", value: "r2_upload" },
        { label: "Purge Cache", value: "cache_purge" },
        { label: "DNS List", value: "dns_list" },
      ]},
      { key: "namespace_id", label: "KV Namespace ID", type: "string", showIf: { operation: ["kv_get", "kv_put", "kv_delete"] } },
      { key: "key", label: "Key", type: "string", showIf: { operation: ["kv_get", "kv_put", "kv_delete"] } },
      { key: "value", label: "Value", type: "string", showIf: { operation: ["kv_put"] } },
      { key: "zone_id", label: "Zone ID", type: "string" },
    ],
    executor: "cloudflare",
    tags: ["cloudflare", "cdn", "workers", "kv"],
  },

  {
    id: "cloud.vercel",
    name: "Vercel",
    description: "Deploy projects, manage domains, inspect deployments.",
    category: "devops",
    icon: "vercel",
    color: "#000000",
    inputs: [D("trigger", "Trigger", "trigger")],
    outputs: [D("deployment", "Deployment", "object"), D("url", "URL", "string")],
    credentials: ["vercel"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "list_deployments", options: [
        { label: "List Deployments", value: "list_deployments" },
        { label: "Get Deployment", value: "get_deployment" },
        { label: "Cancel Deployment", value: "cancel_deployment" },
        { label: "List Projects", value: "list_projects" },
        { label: "Get Project", value: "get_project" },
        { label: "List Domains", value: "list_domains" },
      ]},
      { key: "project_id", label: "Project ID", type: "string" },
      { key: "deployment_id", label: "Deployment ID", type: "string" },
      { key: "team_id", label: "Team ID", type: "string", group: "Advanced" },
    ],
    executor: "vercel",
    tags: ["vercel", "deploy", "hosting"],
  },

  // ─── Communication ────────────────────────────────────────────────────────────

  {
    id: "comm.slack",
    name: "Slack",
    description: "Send messages, create channels, read messages from Slack.",
    category: "communication",
    icon: "slack",
    color: "#4a154b",
    inputs: [D("trigger", "Trigger", "trigger"), D("message", "Message", "string")],
    outputs: [D("message_id", "Message ID", "string"), D("channel", "Channel", "string")],
    credentials: ["slack"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "post_message", options: [
        { label: "Post Message", value: "post_message" },
        { label: "Post to Thread", value: "post_thread" },
        { label: "Upload File", value: "upload_file" },
        { label: "Create Channel", value: "create_channel" },
        { label: "Invite to Channel", value: "invite_user" },
        { label: "List Channels", value: "list_channels" },
        { label: "Get User", value: "get_user" },
      ]},
      { key: "channel", label: "Channel", type: "string", required: true, placeholder: "#general or C1234567" },
      { key: "text", label: "Message", type: "textarea", placeholder: "Hello {{$user.name}}!" },
      { key: "blocks", label: "Block Kit (JSON)", type: "json", group: "Advanced" },
      { key: "thread_ts", label: "Thread Timestamp", type: "string", showIf: { operation: ["post_thread"] } },
      { key: "username", label: "Bot Username", type: "string", group: "Appearance" },
      { key: "icon_emoji", label: "Icon Emoji", type: "string", placeholder: ":robot_face:", group: "Appearance" },
    ],
    executor: "slack",
    tags: ["slack", "message", "notification"],
  },

  {
    id: "comm.discord",
    name: "Discord",
    description: "Send messages, embeds, manage channels in Discord.",
    category: "communication",
    icon: "discord",
    color: "#5865f2",
    inputs: [D("trigger", "Trigger", "trigger"), D("message", "Message", "string")],
    outputs: [D("message_id", "Message ID", "string")],
    credentials: ["discord"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "send_message", options: [
        { label: "Send Message", value: "send_message" },
        { label: "Send Embed", value: "send_embed" },
        { label: "Send Webhook", value: "send_webhook" },
        { label: "Delete Message", value: "delete_message" },
        { label: "Create Thread", value: "create_thread" },
      ]},
      { key: "channel_id", label: "Channel ID", type: "string", required: true },
      { key: "content", label: "Content", type: "textarea" },
      { key: "embed", label: "Embed (JSON)", type: "json", showIf: { operation: ["send_embed"] } },
      { key: "webhook_url", label: "Webhook URL", type: "url", showIf: { operation: ["send_webhook"] } },
    ],
    executor: "discord",
    tags: ["discord", "message", "notification"],
  },

  {
    id: "comm.email",
    name: "Email",
    description: "Send emails via SMTP, SendGrid, Resend, or Postmark.",
    category: "communication",
    icon: "✉",
    color: "#0ea5e9",
    inputs: [D("trigger", "Trigger", "trigger"), D("to", "To", "string"), D("body", "Body", "string")],
    outputs: [D("message_id", "Message ID", "string"), D("status", "Status", "string")],
    credentials: ["email"],
    fields: [
      { key: "provider", label: "Provider", type: "select", required: true, default: "smtp", options: [
        { label: "SMTP", value: "smtp" },
        { label: "SendGrid", value: "sendgrid" },
        { label: "Resend", value: "resend" },
        { label: "Postmark", value: "postmark" },
        { label: "Mailgun", value: "mailgun" },
      ]},
      { key: "to", label: "To", type: "string", required: true, placeholder: "user@example.com" },
      { key: "cc", label: "CC", type: "string", group: "Recipients" },
      { key: "bcc", label: "BCC", type: "string", group: "Recipients" },
      { key: "from", label: "From", type: "string", placeholder: "noreply@myapp.com" },
      { key: "subject", label: "Subject", type: "string", required: true },
      { key: "html", label: "HTML Body", type: "textarea", placeholder: "<p>Hello {{name}}!</p>" },
      { key: "text", label: "Text Body", type: "textarea" },
    ],
    executor: "email_send",
    tags: ["email", "smtp", "sendgrid", "resend", "notification"],
  },

  {
    id: "comm.twilio",
    name: "Twilio",
    description: "Send SMS, make voice calls, send WhatsApp messages.",
    category: "communication",
    icon: "twilio",
    color: "#f22f46",
    inputs: [D("trigger", "Trigger", "trigger"), D("message", "Message", "string")],
    outputs: [D("sid", "Message SID", "string"), D("status", "Status", "string")],
    credentials: ["twilio"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "send_sms", options: [
        { label: "Send SMS", value: "send_sms" },
        { label: "Send WhatsApp", value: "send_whatsapp" },
        { label: "Make Call", value: "make_call" },
      ]},
      { key: "to", label: "To Number", type: "string", required: true, placeholder: "+1234567890" },
      { key: "from", label: "From Number", type: "string", placeholder: "+1987654321" },
      { key: "body", label: "Message Body", type: "textarea", required: true },
    ],
    executor: "twilio",
    tags: ["twilio", "sms", "whatsapp", "voice"],
  },

  // ─── Logic / Control Flow ────────────────────────────────────────────────────

  {
    id: "logic.if",
    name: "If / Condition",
    description: "Branch workflow based on a condition.",
    category: "logic",
    icon: "⬡",
    color: "#d97706",
    inputs: [D("trigger", "Trigger", "trigger"), D("value", "Value", "any")],
    outputs: [D("true", "True", "any"), D("false", "False", "any")],
    fields: [
      { key: "condition", label: "Condition", type: "string", required: true, placeholder: "{{$input.status}} === 'active'" },
      { key: "comparison", label: "Compare Mode", type: "select", default: "expression", options: [
        { label: "Expression", value: "expression" },
        { label: "Equals", value: "equals" },
        { label: "Not Equals", value: "not_equals" },
        { label: "Greater Than", value: "gt" },
        { label: "Less Than", value: "lt" },
        { label: "Contains", value: "contains" },
        { label: "Is Empty", value: "is_empty" },
        { label: "Is Not Empty", value: "is_not_empty" },
      ]},
      { key: "value_b", label: "Compare Value", type: "string", showIf: { comparison: ["equals", "not_equals", "gt", "lt", "contains"] } },
    ],
    executor: "if_condition",
    tags: ["logic", "condition", "branch", "if"],
  },

  {
    id: "logic.switch",
    name: "Switch",
    description: "Route data to different branches based on value.",
    category: "logic",
    icon: "⇄",
    color: "#d97706",
    inputs: [D("trigger", "Trigger", "trigger"), D("value", "Value", "any")],
    outputs: [D("output_1", "Case 1", "any"), D("output_2", "Case 2", "any"), D("output_3", "Case 3", "any"), D("default", "Default", "any")],
    fields: [
      { key: "field", label: "Input Field", type: "string", required: true, placeholder: "{{$input.type}}" },
      { key: "cases", label: "Cases (JSON)", type: "json", required: true, default: [{ value: "case1", output: 0 }, { value: "case2", output: 1 }] },
    ],
    executor: "switch",
    tags: ["logic", "switch", "route"],
  },

  {
    id: "logic.loop",
    name: "Loop / For Each",
    description: "Iterate over an array and process each item.",
    category: "logic",
    icon: "↺",
    color: "#d97706",
    inputs: [D("trigger", "Trigger", "trigger"), D("items", "Items Array", "array")],
    outputs: [D("item", "Item", "any"), D("index", "Index", "number"), D("results", "All Results", "array")],
    fields: [
      { key: "field", label: "Array Field", type: "string", required: true, placeholder: "{{$input.items}}" },
      { key: "batch_size", label: "Batch Size", type: "number", default: 1, group: "Advanced" },
      { key: "concurrency", label: "Concurrency", type: "number", default: 1, group: "Advanced" },
    ],
    executor: "loop_foreach",
    tags: ["logic", "loop", "iteration", "foreach"],
  },

  {
    id: "logic.merge",
    name: "Merge / Join",
    description: "Merge multiple workflow branches into one.",
    category: "logic",
    icon: "⊼",
    color: "#d97706",
    inputs: [D("branch_1", "Branch 1", "any"), D("branch_2", "Branch 2", "any"), D("branch_3", "Branch 3", "any")],
    outputs: [D("merged", "Merged", "object")],
    fields: [
      { key: "strategy", label: "Merge Strategy", type: "select", default: "object", options: [
        { label: "Deep Merge Object", value: "object" },
        { label: "Array Concatenation", value: "array" },
        { label: "Wait All", value: "wait_all" },
        { label: "First Wins", value: "first" },
      ]},
    ],
    executor: "merge",
    tags: ["logic", "merge", "join", "combine"],
  },

  {
    id: "logic.delay",
    name: "Wait / Delay",
    description: "Pause execution for a specified duration.",
    category: "logic",
    icon: "⊘",
    color: "#d97706",
    inputs: [D("trigger", "Trigger", "trigger")],
    outputs: [D("trigger_out", "After Delay", "trigger")],
    fields: [
      { key: "duration_ms", label: "Duration (ms)", type: "number", required: true, default: 1000 },
      { key: "until", label: "Wait Until (ISO date)", type: "string", placeholder: "2025-01-01T00:00:00Z" },
    ],
    executor: "delay",
    tags: ["logic", "delay", "wait", "sleep"],
  },

  {
    id: "logic.retry",
    name: "Retry",
    description: "Retry a node on failure with configurable backoff.",
    category: "logic",
    icon: "↻",
    color: "#d97706",
    inputs: [D("trigger", "Trigger", "trigger")],
    outputs: [D("result", "Result", "any"), D("error", "Error", "string"), D("attempts", "Attempts", "number")],
    fields: [
      { key: "max_attempts", label: "Max Attempts", type: "number", default: 3 },
      { key: "backoff_ms", label: "Initial Backoff (ms)", type: "number", default: 1000 },
      { key: "backoff_strategy", label: "Backoff Strategy", type: "select", default: "exponential", options: [{ label: "Fixed", value: "fixed" }, { label: "Exponential", value: "exponential" }, { label: "Linear", value: "linear" }] },
    ],
    executor: "retry",
    tags: ["logic", "retry", "error", "resilience"],
  },

  {
    id: "logic.set",
    name: "Set / Transform",
    description: "Set, transform, or compute variables for downstream nodes.",
    category: "logic",
    icon: "≡",
    color: "#d97706",
    inputs: [D("trigger", "Trigger", "trigger"), D("data", "Data", "any")],
    outputs: [D("output", "Output", "object")],
    fields: [
      { key: "assignments", label: "Assignments (JSON)", type: "json", required: true, default: { result: "{{$input.value}}" }, description: "Key-value pairs. Values support {{expressions}}." },
    ],
    executor: "set_vars",
    tags: ["logic", "transform", "set", "variable"],
  },

  // ─── Files ────────────────────────────────────────────────────────────────────

  {
    id: "files.read",
    name: "Read File",
    description: "Read file contents from local path or URL.",
    category: "files",
    icon: "📄",
    color: "#f59e0b",
    inputs: [D("trigger", "Trigger", "trigger"), D("path_in", "Path", "string")],
    outputs: [D("content", "Content", "string"), D("binary", "Binary", "any"), D("size", "Size", "number")],
    fields: [
      { key: "path", label: "File Path", type: "string", required: true, placeholder: "/path/to/file.txt" },
      { key: "encoding", label: "Encoding", type: "select", default: "utf8", options: [{ label: "UTF-8", value: "utf8" }, { label: "Base64", value: "base64" }, { label: "Binary", value: "binary" }] },
    ],
    executor: "file_read",
    tags: ["files", "read", "io"],
  },

  {
    id: "files.write",
    name: "Write File",
    description: "Write content to a file on disk.",
    category: "files",
    icon: "💾",
    color: "#f59e0b",
    inputs: [D("trigger", "Trigger", "trigger"), D("content", "Content", "string")],
    outputs: [D("path_out", "Path", "string"), D("size", "Size", "number")],
    fields: [
      { key: "path", label: "File Path", type: "string", required: true, placeholder: "/output/result.txt" },
      { key: "content", label: "Content", type: "textarea" },
      { key: "append", label: "Append Mode", type: "boolean", default: false },
      { key: "create_dirs", label: "Create Directories", type: "boolean", default: true },
    ],
    executor: "file_write",
    tags: ["files", "write", "io"],
  },

  {
    id: "files.parse_csv",
    name: "Parse CSV",
    description: "Parse CSV data into structured records.",
    category: "data",
    icon: "⊞",
    color: "#f59e0b",
    inputs: [D("trigger", "Trigger", "trigger"), D("csv", "CSV Data", "string")],
    outputs: [D("rows", "Rows", "array"), D("headers", "Headers", "array"), D("count", "Count", "number")],
    fields: [
      { key: "delimiter", label: "Delimiter", type: "string", default: "," },
      { key: "has_header", label: "Has Header Row", type: "boolean", default: true },
      { key: "skip_empty", label: "Skip Empty Rows", type: "boolean", default: true },
    ],
    executor: "parse_csv",
    tags: ["csv", "data", "parse"],
  },

  {
    id: "files.parse_json",
    name: "Parse / Format JSON",
    description: "Parse JSON strings or format objects to JSON.",
    category: "data",
    icon: "{ }",
    color: "#f59e0b",
    inputs: [D("trigger", "Trigger", "trigger"), D("input", "Input", "any")],
    outputs: [D("result", "Result", "any"), D("pretty", "Pretty String", "string")],
    fields: [
      { key: "operation", label: "Operation", type: "select", default: "parse", options: [{ label: "Parse String → Object", value: "parse" }, { label: "Stringify Object → String", value: "stringify" }, { label: "Extract Path", value: "path" }] },
      { key: "path", label: "JSON Path", type: "string", placeholder: "$.data.items[0]", showIf: { operation: ["path"] } },
      { key: "indent", label: "Indent Spaces", type: "number", default: 2, showIf: { operation: ["stringify"] } },
    ],
    executor: "json_op",
    tags: ["json", "data", "parse", "format"],
  },

  // ─── Data Transformation ─────────────────────────────────────────────────────

  {
    id: "data.text",
    name: "Text Transform",
    description: "Transform, clean, and format text strings.",
    category: "data",
    icon: "Aa",
    color: "#0891b2",
    inputs: [D("trigger", "Trigger", "trigger"), D("text_in", "Text", "string")],
    outputs: [D("text_out", "Result", "string"), D("parts", "Parts", "array")],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "trim", options: [
        { label: "Trim", value: "trim" },
        { label: "Uppercase", value: "upper" },
        { label: "Lowercase", value: "lower" },
        { label: "Title Case", value: "title" },
        { label: "Split", value: "split" },
        { label: "Join", value: "join" },
        { label: "Replace", value: "replace" },
        { label: "Regex Replace", value: "regex_replace" },
        { label: "Truncate", value: "truncate" },
        { label: "Slug", value: "slug" },
        { label: "Extract Emails", value: "extract_emails" },
        { label: "Extract URLs", value: "extract_urls" },
        { label: "Markdown to HTML", value: "md_to_html" },
        { label: "HTML to Text", value: "html_to_text" },
      ]},
      { key: "separator", label: "Separator", type: "string", default: ",", showIf: { operation: ["split", "join"] } },
      { key: "find", label: "Find", type: "string", showIf: { operation: ["replace", "regex_replace"] } },
      { key: "replace_with", label: "Replace With", type: "string", showIf: { operation: ["replace", "regex_replace"] } },
      { key: "max_length", label: "Max Length", type: "number", default: 100, showIf: { operation: ["truncate"] } },
    ],
    executor: "text_transform",
    tags: ["text", "transform", "string"],
  },

  {
    id: "data.filter",
    name: "Filter Array",
    description: "Filter array items based on conditions.",
    category: "data",
    icon: "⧖",
    color: "#0891b2",
    inputs: [D("trigger", "Trigger", "trigger"), D("array_in", "Array", "array")],
    outputs: [D("filtered", "Filtered", "array"), D("rejected", "Rejected", "array"), D("count", "Count", "number")],
    fields: [
      { key: "condition", label: "Filter Condition", type: "string", required: true, placeholder: "item.status === 'active'" },
      { key: "limit", label: "Max Results", type: "number", default: 0, description: "0 = unlimited" },
    ],
    executor: "filter_array",
    tags: ["data", "filter", "array"],
  },

  {
    id: "data.sort",
    name: "Sort Array",
    description: "Sort array items by one or more fields.",
    category: "data",
    icon: "⇅",
    color: "#0891b2",
    inputs: [D("trigger", "Trigger", "trigger"), D("array_in", "Array", "array")],
    outputs: [D("sorted", "Sorted", "array")],
    fields: [
      { key: "field", label: "Sort Field", type: "string", required: true, placeholder: "createdAt" },
      { key: "direction", label: "Direction", type: "select", default: "asc", options: [{ label: "Ascending", value: "asc" }, { label: "Descending", value: "desc" }] },
    ],
    executor: "sort_array",
    tags: ["data", "sort", "array"],
  },

  // ─── Analytics ───────────────────────────────────────────────────────────────

  {
    id: "analytics.event",
    name: "Track Event",
    description: "Track analytics events via PostHog, Mixpanel, or Amplitude.",
    category: "analytics",
    icon: "📊",
    color: "#6366f1",
    inputs: [D("trigger", "Trigger", "trigger"), D("properties_in", "Properties", "object")],
    outputs: [D("event_id", "Event ID", "string")],
    credentials: ["analytics"],
    fields: [
      { key: "provider", label: "Provider", type: "select", default: "posthog", options: [{ label: "PostHog", value: "posthog" }, { label: "Mixpanel", value: "mixpanel" }, { label: "Amplitude", value: "amplitude" }, { label: "Segment", value: "segment" }] },
      { key: "event_name", label: "Event Name", type: "string", required: true, placeholder: "purchase_completed" },
      { key: "distinct_id", label: "User ID", type: "string", placeholder: "{{$user.id}}" },
      { key: "properties", label: "Properties (JSON)", type: "json", default: {} },
    ],
    executor: "analytics_event",
    tags: ["analytics", "posthog", "mixpanel", "tracking"],
  },

  // ─── CRM / Productivity ────────────────────────────────────────────────────────

  {
    id: "crm.notion",
    name: "Notion",
    description: "Read and write Notion databases and pages.",
    category: "crm",
    icon: "notion",
    color: "#000000",
    inputs: [D("trigger", "Trigger", "trigger"), D("data", "Data", "object")],
    outputs: [D("page", "Page", "object"), D("items", "Items", "array")],
    credentials: ["notion"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "query_db", options: [
        { label: "Query Database", value: "query_db" },
        { label: "Create Page", value: "create_page" },
        { label: "Update Page", value: "update_page" },
        { label: "Get Page", value: "get_page" },
        { label: "Create Database", value: "create_db" },
      ]},
      { key: "database_id", label: "Database ID", type: "string" },
      { key: "page_id", label: "Page ID", type: "string" },
      { key: "properties", label: "Properties (JSON)", type: "json" },
      { key: "filter", label: "Filter (JSON)", type: "json" },
    ],
    executor: "notion",
    tags: ["notion", "productivity", "crm"],
  },

  {
    id: "crm.linear",
    name: "Linear",
    description: "Create and manage Linear issues, projects, and teams.",
    category: "crm",
    icon: "linear",
    color: "#5e6ad2",
    inputs: [D("trigger", "Trigger", "trigger"), D("data", "Data", "object")],
    outputs: [D("issue", "Issue", "object"), D("items", "Items", "array")],
    credentials: ["linear"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "create_issue", options: [
        { label: "Create Issue", value: "create_issue" },
        { label: "Update Issue", value: "update_issue" },
        { label: "List Issues", value: "list_issues" },
        { label: "Get Issue", value: "get_issue" },
        { label: "Create Comment", value: "create_comment" },
      ]},
      { key: "team_id", label: "Team ID", type: "string" },
      { key: "title", label: "Title", type: "string", showIf: { operation: ["create_issue"] } },
      { key: "description", label: "Description", type: "textarea" },
      { key: "priority", label: "Priority", type: "select", default: "medium", options: [{ label: "No Priority", value: "0" }, { label: "Urgent", value: "1" }, { label: "High", value: "2" }, { label: "Medium", value: "3" }, { label: "Low", value: "4" }] },
    ],
    executor: "linear",
    tags: ["linear", "project-management", "issues"],
  },

  {
    id: "crm.stripe",
    name: "Stripe",
    description: "Manage customers, payments, subscriptions in Stripe.",
    category: "finance",
    icon: "stripe",
    color: "#635bff",
    inputs: [D("trigger", "Trigger", "trigger"), D("data", "Data", "object")],
    outputs: [D("result", "Result", "object"), D("id", "ID", "string")],
    credentials: ["stripe"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "create_customer", options: [
        { label: "Create Customer", value: "create_customer" },
        { label: "Get Customer", value: "get_customer" },
        { label: "Create Payment Intent", value: "create_payment_intent" },
        { label: "Create Invoice", value: "create_invoice" },
        { label: "Cancel Subscription", value: "cancel_subscription" },
        { label: "List Payments", value: "list_payments" },
      ]},
      { key: "customer_id", label: "Customer ID", type: "string" },
      { key: "amount", label: "Amount (cents)", type: "number" },
      { key: "currency", label: "Currency", type: "string", default: "usd" },
      { key: "metadata", label: "Metadata (JSON)", type: "json", group: "Advanced" },
    ],
    executor: "stripe",
    tags: ["stripe", "payments", "billing", "finance"],
  },

  // ─── Midas Platform ───────────────────────────────────────────────────────────

  {
    id: "midas.api",
    name: "Midas API",
    description: "Call Midas marketplace API endpoints.",
    category: "midas",
    icon: "✦",
    color: "#f59e0b",
    inputs: [D("trigger", "Trigger", "trigger"), D("body", "Body", "object")],
    outputs: [D("result", "Result", "any"), D("status", "Status", "number")],
    fields: [
      { key: "endpoint", label: "Endpoint", type: "select", required: true, default: "/api/listings", options: [
        { label: "List Listings", value: "/api/listings" },
        { label: "Get Listing", value: "/api/listings/{id}" },
        { label: "Create Listing", value: "/api/listings" },
        { label: "Current User", value: "/api/auth/me" },
        { label: "Workflows", value: "/api/nexus/workflows" },
        { label: "Execute Workflow", value: "/api/nexus/workflows/{id}/execute" },
      ]},
      { key: "method", label: "Method", type: "select", default: "GET", options: ["GET", "POST", "PATCH", "DELETE"].map(m => ({ label: m, value: m })) },
      { key: "params", label: "Path Params (JSON)", type: "json", placeholder: '{"id": "{{$input.id}}"}' },
      { key: "body", label: "Body (JSON)", type: "json" },
    ],
    executor: "midas_api",
    tags: ["midas", "api", "marketplace"],
  },

  {
    id: "midas.listing",
    name: "Midas Listing",
    description: "Create, update, and publish listings on the Midas marketplace.",
    category: "midas",
    icon: "✦",
    color: "#f59e0b",
    inputs: [D("trigger", "Trigger", "trigger"), D("data", "Data", "object")],
    outputs: [D("listing", "Listing", "object"), D("id", "ID", "string")],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "create", options: [
        { label: "Create Listing", value: "create" },
        { label: "Update Listing", value: "update" },
        { label: "Publish", value: "publish" },
        { label: "Archive", value: "archive" },
        { label: "Get Analytics", value: "analytics" },
      ]},
      { key: "listing_id", label: "Listing ID", type: "string" },
      { key: "title", label: "Title", type: "string" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "type", label: "Type", type: "select", default: "skill", options: ["skill", "model", "workflow", "agent", "mcp", "template"].map(t => ({ label: t, value: t })) },
      { key: "price_cents", label: "Price (cents)", type: "number", default: 0 },
    ],
    executor: "midas_listing",
    tags: ["midas", "marketplace", "listing"],
  },

  // ─── Browser / Scraping ──────────────────────────────────────────────────────

  {
    id: "browser.scrape",
    name: "Web Scraper",
    description: "Scrape content from a web page using CSS selectors.",
    category: "browser",
    icon: "browser",
    color: "#06b6d4",
    inputs: [D("trigger", "Trigger", "trigger")],
    outputs: [D("html", "HTML", "string"), D("text", "Text", "string"), D("data", "Extracted Data", "object")],
    fields: [
      { key: "url", label: "URL", type: "string", required: true, placeholder: "https://example.com" },
      { key: "selector", label: "CSS Selector", type: "string", placeholder: ".article-body" },
      { key: "wait_for", label: "Wait For Element", type: "string" },
      { key: "javascript", label: "Execute JavaScript", type: "boolean", default: false },
      { key: "timeout_ms", label: "Timeout (ms)", type: "number", default: 10000, group: "Advanced" },
    ],
    executor: "browser_scrape",
    tags: ["browser", "scrape", "html", "web"],
  },

  {
    id: "browser.screenshot",
    name: "Screenshot",
    description: "Take a screenshot of a web page.",
    category: "browser",
    icon: "browser",
    color: "#06b6d4",
    inputs: [D("trigger", "Trigger", "trigger")],
    outputs: [D("image_url", "Image URL", "string"), D("base64", "Base64", "string")],
    fields: [
      { key: "url", label: "URL", type: "string", required: true },
      { key: "full_page", label: "Full Page", type: "boolean", default: false },
      { key: "width", label: "Viewport Width", type: "number", default: 1280 },
      { key: "height", label: "Viewport Height", type: "number", default: 800 },
      { key: "format", label: "Format", type: "select", default: "png", options: [{ label: "PNG", value: "png" }, { label: "JPEG", value: "jpeg" }, { label: "WebP", value: "webp" }] },
    ],
    executor: "browser_screenshot",
    tags: ["browser", "screenshot", "capture"],
  },

  {
    id: "browser.pdf",
    name: "Generate PDF",
    description: "Generate a PDF from a URL or HTML content.",
    category: "browser",
    icon: "browser",
    color: "#06b6d4",
    inputs: [D("trigger", "Trigger", "trigger"), D("html_in", "HTML", "string")],
    outputs: [D("pdf_url", "PDF URL", "string"), D("base64", "Base64", "string")],
    fields: [
      { key: "source", label: "Source", type: "select", required: true, default: "url", options: [{ label: "URL", value: "url" }, { label: "HTML", value: "html" }] },
      { key: "url", label: "URL", type: "string", showIf: { source: ["url"] } },
      { key: "format", label: "Paper Format", type: "select", default: "A4", options: ["A4", "Letter", "Legal", "A3"].map(v => ({ label: v, value: v })) },
      { key: "landscape", label: "Landscape", type: "boolean", default: false },
    ],
    executor: "browser_pdf",
    tags: ["browser", "pdf", "document"],
  },

  {
    id: "browser.form_fill",
    name: "Fill Form",
    description: "Automate filling and submitting web forms.",
    category: "browser",
    icon: "browser",
    color: "#06b6d4",
    inputs: [D("trigger", "Trigger", "trigger"), D("data_in", "Form Data", "object")],
    outputs: [D("result", "Result", "object"), D("success", "Success", "boolean")],
    fields: [
      { key: "url", label: "URL", type: "string", required: true },
      { key: "fields", label: "Field Selectors (JSON)", type: "json", placeholder: '{"#email": "user@example.com"}' },
      { key: "submit_selector", label: "Submit Button Selector", type: "string" },
    ],
    executor: "browser_form_fill",
    tags: ["browser", "form", "automation"],
  },

  // ─── IDE / Code ───────────────────────────────────────────────────────────────

  {
    id: "ide.git_commit",
    name: "Git Commit",
    description: "Stage, commit, and push code changes to a Git repository.",
    category: "ide",
    icon: "git",
    color: "#64748b",
    inputs: [D("trigger", "Trigger", "trigger"), D("files_in", "Files", "array")],
    outputs: [D("commit_sha", "Commit SHA", "string"), D("branch", "Branch", "string")],
    credentials: ["github"],
    fields: [
      { key: "repo_path", label: "Repo Path", type: "string", required: true },
      { key: "message", label: "Commit Message", type: "string", required: true, placeholder: "feat: add new feature" },
      { key: "branch", label: "Branch", type: "string", default: "main" },
      { key: "push", label: "Push After Commit", type: "boolean", default: true },
    ],
    executor: "git_commit",
    tags: ["git", "ide", "commit", "code"],
  },

  {
    id: "ide.run_tests",
    name: "Run Tests",
    description: "Execute test suites and report results.",
    category: "ide",
    icon: "code",
    color: "#64748b",
    inputs: [D("trigger", "Trigger", "trigger")],
    outputs: [D("results", "Results", "object"), D("passed", "Passed", "number"), D("failed", "Failed", "number"), D("coverage", "Coverage", "number")],
    fields: [
      { key: "runner", label: "Test Runner", type: "select", default: "jest", options: ["jest", "vitest", "pytest", "mocha", "go test", "cargo test"].map(v => ({ label: v, value: v })) },
      { key: "path", label: "Test Path", type: "string", placeholder: "src/**/*.test.ts" },
      { key: "coverage", label: "Collect Coverage", type: "boolean", default: false },
      { key: "timeout_s", label: "Timeout (s)", type: "number", default: 60 },
    ],
    executor: "run_tests",
    tags: ["ide", "testing", "jest", "vitest"],
  },

  {
    id: "ide.lint",
    name: "Lint & Format",
    description: "Run ESLint, Prettier, or other linters on code files.",
    category: "ide",
    icon: "code",
    color: "#64748b",
    inputs: [D("trigger", "Trigger", "trigger"), D("code_in", "Code", "string")],
    outputs: [D("code_out", "Fixed Code", "string"), D("errors", "Errors", "array"), D("warnings", "Warnings", "array")],
    fields: [
      { key: "tool", label: "Tool", type: "select", default: "eslint", options: ["eslint", "prettier", "biome", "pylint", "gofmt", "rustfmt"].map(v => ({ label: v, value: v })) },
      { key: "fix", label: "Auto-fix", type: "boolean", default: true },
      { key: "config_path", label: "Config Path", type: "string", group: "Advanced" },
    ],
    executor: "lint_format",
    tags: ["ide", "lint", "format", "eslint"],
  },

  {
    id: "ide.generate_code",
    name: "Generate Code",
    description: "Generate code using AI from a description or specification.",
    category: "ide",
    icon: "code",
    color: "#64748b",
    inputs: [D("trigger", "Trigger", "trigger"), D("spec_in", "Specification", "string")],
    outputs: [D("code", "Code", "string"), D("filename", "Filename", "string"), D("language", "Language", "string")],
    fields: [
      { key: "language", label: "Language", type: "select", default: "typescript", options: ["typescript", "python", "go", "rust", "java", "csharp", "php", "ruby", "swift"].map(v => ({ label: v, value: v })) },
      { key: "framework", label: "Framework", type: "string", placeholder: "Next.js, FastAPI, etc." },
      { key: "description", label: "Description", type: "textarea", required: true, placeholder: "Create a React hook that..." },
      { key: "style", label: "Code Style", type: "select", default: "clean", options: [{ label: "Clean / Minimal", value: "clean" }, { label: "Verbose / Documented", value: "verbose" }, { label: "Optimized", value: "optimized" }] },
    ],
    executor: "generate_code",
    tags: ["ide", "codegen", "ai", "code"],
  },

  // ─── Social Media ─────────────────────────────────────────────────────────────

  {
    id: "social.twitter",
    name: "Twitter / X",
    description: "Post tweets, read timeline, search posts on Twitter/X.",
    category: "communication",
    icon: "twitter",
    color: "#1da1f2",
    inputs: [D("trigger", "Trigger", "trigger"), D("text_in", "Text", "string")],
    outputs: [D("tweet", "Tweet", "object"), D("id", "Tweet ID", "string"), D("items", "Items", "array")],
    credentials: ["twitter"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "post_tweet", options: [
        { label: "Post Tweet", value: "post_tweet" },
        { label: "Get Timeline", value: "get_timeline" },
        { label: "Search Tweets", value: "search" },
        { label: "Like Tweet", value: "like" },
        { label: "Reply to Tweet", value: "reply" },
        { label: "Get User Info", value: "get_user" },
      ]},
      { key: "text", label: "Tweet Text", type: "textarea", placeholder: "Hello world! {{$input.message}}" },
      { key: "tweet_id", label: "Tweet ID", type: "string", showIf: { operation: ["like", "reply"] } },
      { key: "query", label: "Search Query", type: "string", showIf: { operation: ["search"] } },
      { key: "max_results", label: "Max Results", type: "number", default: 10, showIf: { operation: ["search", "get_timeline"] } },
    ],
    executor: "twitter",
    tags: ["twitter", "x", "social", "tweet"],
  },

  {
    id: "social.linkedin",
    name: "LinkedIn",
    description: "Post updates, manage connections on LinkedIn.",
    category: "communication",
    icon: "linkedin",
    color: "#0a66c2",
    inputs: [D("trigger", "Trigger", "trigger"), D("content_in", "Content", "string")],
    outputs: [D("post", "Post", "object"), D("id", "Post ID", "string")],
    credentials: ["linkedin"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "create_post", options: [
        { label: "Create Post", value: "create_post" },
        { label: "Get Profile", value: "get_profile" },
        { label: "Get Connections", value: "get_connections" },
      ]},
      { key: "text", label: "Post Text", type: "textarea", placeholder: "Excited to share..." },
      { key: "visibility", label: "Visibility", type: "select", default: "PUBLIC", options: [{ label: "Public", value: "PUBLIC" }, { label: "Connections", value: "CONNECTIONS" }] },
    ],
    executor: "linkedin",
    tags: ["linkedin", "social", "professional"],
  },

  // ─── Search / Vector DB ───────────────────────────────────────────────────────

  {
    id: "search.web",
    name: "Web Search",
    description: "Search the web using Google, Bing, or Brave Search.",
    category: "developer",
    icon: "🔍",
    color: "#4285f4",
    inputs: [D("trigger", "Trigger", "trigger"), D("query_in", "Query", "string")],
    outputs: [D("results", "Results", "array"), D("top_result", "Top Result", "object"), D("count", "Count", "number")],
    credentials: ["search"],
    fields: [
      { key: "provider", label: "Provider", type: "select", default: "brave", options: [{ label: "Brave Search", value: "brave" }, { label: "Serper (Google)", value: "serper" }, { label: "Bing", value: "bing" }] },
      { key: "query", label: "Search Query", type: "string", required: true, placeholder: "best AI tools 2025" },
      { key: "num_results", label: "Number of Results", type: "number", default: 5 },
      { key: "country", label: "Country Code", type: "string", default: "us", group: "Advanced" },
      { key: "language", label: "Language", type: "string", default: "en", group: "Advanced" },
    ],
    executor: "web_search",
    tags: ["search", "google", "brave", "bing", "web"],
  },

  {
    id: "search.vector",
    name: "Vector Search",
    description: "Semantic search using vector similarity in Pinecone, Qdrant, or pgvector.",
    category: "database",
    icon: "🔮",
    color: "#8b5cf6",
    inputs: [D("trigger", "Trigger", "trigger"), D("query_in", "Query", "string"), D("vector_in", "Vector", "array")],
    outputs: [D("results", "Results", "array"), D("ids", "IDs", "array"), D("scores", "Scores", "array")],
    credentials: ["vector_db"],
    fields: [
      { key: "provider", label: "Provider", type: "select", required: true, default: "pgvector", options: [{ label: "pgvector (Supabase)", value: "pgvector" }, { label: "Pinecone", value: "pinecone" }, { label: "Qdrant", value: "qdrant" }, { label: "Weaviate", value: "weaviate" }] },
      { key: "index_name", label: "Index / Table", type: "string", required: true, placeholder: "embeddings" },
      { key: "top_k", label: "Top K Results", type: "number", default: 5 },
      { key: "threshold", label: "Similarity Threshold", type: "number", default: 0.7, group: "Advanced" },
      { key: "filter", label: "Metadata Filter (JSON)", type: "json", group: "Advanced" },
    ],
    executor: "vector_search",
    tags: ["vector", "semantic", "search", "embedding", "pgvector"],
  },

  {
    id: "search.upsert",
    name: "Vector Upsert",
    description: "Insert or update vectors in a vector database.",
    category: "database",
    icon: "🔮",
    color: "#8b5cf6",
    inputs: [D("trigger", "Trigger", "trigger"), D("items_in", "Items", "array"), D("vectors_in", "Vectors", "array")],
    outputs: [D("ids", "Upserted IDs", "array"), D("count", "Count", "number")],
    credentials: ["vector_db"],
    fields: [
      { key: "provider", label: "Provider", type: "select", required: true, default: "pgvector", options: [{ label: "pgvector (Supabase)", value: "pgvector" }, { label: "Pinecone", value: "pinecone" }, { label: "Qdrant", value: "qdrant" }] },
      { key: "index_name", label: "Index / Table", type: "string", required: true },
      { key: "id_field", label: "ID Field", type: "string", default: "id" },
      { key: "namespace", label: "Namespace", type: "string", group: "Advanced" },
    ],
    executor: "vector_upsert",
    tags: ["vector", "upsert", "embedding", "pgvector"],
  },

  // ─── Calendar / Scheduling ─────────────────────────────────────────────────────

  {
    id: "cal.google",
    name: "Google Calendar",
    description: "Create, read, update events in Google Calendar.",
    category: "crm",
    icon: "google",
    color: "#4285f4",
    inputs: [D("trigger", "Trigger", "trigger"), D("event_in", "Event Data", "object")],
    outputs: [D("event", "Event", "object"), D("events", "Events", "array"), D("id", "Event ID", "string")],
    credentials: ["google"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "create_event", options: [
        { label: "Create Event", value: "create_event" },
        { label: "List Events", value: "list_events" },
        { label: "Update Event", value: "update_event" },
        { label: "Delete Event", value: "delete_event" },
        { label: "Get Free/Busy", value: "freebusy" },
      ]},
      { key: "calendar_id", label: "Calendar ID", type: "string", default: "primary" },
      { key: "summary", label: "Title", type: "string" },
      { key: "start_time", label: "Start Time (ISO)", type: "string", placeholder: "{{$input.date}}" },
      { key: "end_time", label: "End Time (ISO)", type: "string" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "attendees", label: "Attendees (comma-separated emails)", type: "string", group: "Advanced" },
    ],
    executor: "google_calendar",
    tags: ["calendar", "google", "scheduling", "events"],
  },

  {
    id: "cal.cal_com",
    name: "Cal.com",
    description: "Manage bookings and availability via Cal.com API.",
    category: "crm",
    icon: "cal",
    color: "#111827",
    inputs: [D("trigger", "Trigger", "trigger")],
    outputs: [D("booking", "Booking", "object"), D("bookings", "Bookings", "array")],
    credentials: ["cal_com"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "list_bookings", options: [
        { label: "List Bookings", value: "list_bookings" },
        { label: "Get Booking", value: "get_booking" },
        { label: "Cancel Booking", value: "cancel_booking" },
        { label: "Get Available Slots", value: "get_slots" },
      ]},
      { key: "booking_id", label: "Booking ID", type: "string" },
      { key: "event_type_id", label: "Event Type ID", type: "string" },
      { key: "date", label: "Date (YYYY-MM-DD)", type: "string" },
    ],
    executor: "cal_com",
    tags: ["calendar", "scheduling", "booking"],
  },

  // ─── CMS ──────────────────────────────────────────────────────────────────────

  {
    id: "cms.wordpress",
    name: "WordPress",
    description: "Create and manage WordPress posts, pages, and media.",
    category: "crm",
    icon: "wordpress",
    color: "#21759b",
    inputs: [D("trigger", "Trigger", "trigger"), D("data_in", "Data", "object")],
    outputs: [D("post", "Post", "object"), D("id", "Post ID", "number")],
    credentials: ["wordpress"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "create_post", options: [
        { label: "Create Post", value: "create_post" },
        { label: "Update Post", value: "update_post" },
        { label: "Delete Post", value: "delete_post" },
        { label: "List Posts", value: "list_posts" },
        { label: "Upload Media", value: "upload_media" },
      ]},
      { key: "site_url", label: "Site URL", type: "string", required: true, placeholder: "https://mysite.com" },
      { key: "title", label: "Title", type: "string" },
      { key: "content", label: "Content (HTML)", type: "textarea" },
      { key: "status", label: "Status", type: "select", default: "draft", options: [{ label: "Draft", value: "draft" }, { label: "Publish", value: "publish" }, { label: "Private", value: "private" }] },
      { key: "categories", label: "Category IDs (JSON)", type: "json", group: "Advanced" },
    ],
    executor: "wordpress",
    tags: ["wordpress", "cms", "blog"],
  },

  {
    id: "cms.contentful",
    name: "Contentful",
    description: "Read and write Contentful CMS entries and assets.",
    category: "crm",
    icon: "contentful",
    color: "#fad400",
    inputs: [D("trigger", "Trigger", "trigger"), D("data_in", "Data", "object")],
    outputs: [D("entry", "Entry", "object"), D("entries", "Entries", "array")],
    credentials: ["contentful"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "get_entries", options: [
        { label: "Get Entries", value: "get_entries" },
        { label: "Get Entry", value: "get_entry" },
        { label: "Create Entry", value: "create_entry" },
        { label: "Update Entry", value: "update_entry" },
        { label: "Delete Entry", value: "delete_entry" },
        { label: "Publish Entry", value: "publish_entry" },
      ]},
      { key: "space_id", label: "Space ID", type: "string", required: true },
      { key: "environment", label: "Environment", type: "string", default: "master" },
      { key: "content_type", label: "Content Type ID", type: "string" },
      { key: "entry_id", label: "Entry ID", type: "string" },
      { key: "fields", label: "Fields (JSON)", type: "json" },
    ],
    executor: "contentful",
    tags: ["contentful", "cms", "content"],
  },

  // ─── AI / More ────────────────────────────────────────────────────────────────

  {
    id: "ai.rag",
    name: "RAG Pipeline",
    description: "Retrieval-Augmented Generation: embed query, search vectors, augment prompt.",
    category: "ai",
    icon: "🧩",
    color: "#7c3aed",
    inputs: [D("trigger", "Trigger", "trigger"), D("query_in", "User Query", "string")],
    outputs: [D("answer", "Answer", "string"), D("sources", "Sources", "array"), D("context", "Context", "string")],
    credentials: ["openai", "vector_db"],
    fields: [
      { key: "llm_provider", label: "LLM Provider", type: "select", default: "openai", options: [{ label: "OpenAI", value: "openai" }, { label: "Anthropic", value: "anthropic" }, { label: "Groq", value: "groq" }] },
      { key: "llm_model", label: "LLM Model", type: "string", default: "gpt-4o-mini" },
      { key: "vector_index", label: "Vector Index", type: "string", required: true, placeholder: "knowledge_base" },
      { key: "top_k", label: "Top K Sources", type: "number", default: 5 },
      { key: "system_prompt", label: "System Prompt", type: "textarea", placeholder: "You are a helpful assistant. Answer based on the context provided." },
      { key: "temperature", label: "Temperature", type: "number", default: 0.3, group: "Advanced" },
    ],
    executor: "rag_pipeline",
    tags: ["rag", "retrieval", "vector", "llm", "ai"],
  },

  {
    id: "ai.summarize",
    name: "AI Summarizer",
    description: "Summarize long text, articles, or documents with AI.",
    category: "ai",
    icon: "📝",
    color: "#7c3aed",
    inputs: [D("trigger", "Trigger", "trigger"), D("text_in", "Text", "string")],
    outputs: [D("summary", "Summary", "string"), D("bullets", "Bullet Points", "array"), D("keywords", "Keywords", "array")],
    credentials: ["openai"],
    fields: [
      { key: "provider", label: "Provider", type: "select", default: "openai", options: [{ label: "OpenAI", value: "openai" }, { label: "Anthropic", value: "anthropic" }, { label: "Groq", value: "groq" }] },
      { key: "model", label: "Model", type: "string", default: "gpt-4o-mini" },
      { key: "length", label: "Summary Length", type: "select", default: "medium", options: [{ label: "Short (1-2 sentences)", value: "short" }, { label: "Medium (1 paragraph)", value: "medium" }, { label: "Long (detailed)", value: "long" }] },
      { key: "format", label: "Output Format", type: "select", default: "prose", options: [{ label: "Prose", value: "prose" }, { label: "Bullets", value: "bullets" }, { label: "TL;DR", value: "tldr" }] },
      { key: "language", label: "Output Language", type: "string", default: "English", group: "Advanced" },
    ],
    executor: "ai_summarize",
    tags: ["ai", "summarize", "llm", "text"],
  },

  {
    id: "ai.translate",
    name: "AI Translator",
    description: "Translate text between languages using AI.",
    category: "ai",
    icon: "🌐",
    color: "#7c3aed",
    inputs: [D("trigger", "Trigger", "trigger"), D("text_in", "Text", "string")],
    outputs: [D("translation", "Translation", "string"), D("detected_lang", "Detected Language", "string")],
    fields: [
      { key: "source_lang", label: "Source Language", type: "string", default: "auto", placeholder: "auto" },
      { key: "target_lang", label: "Target Language", type: "string", required: true, default: "Spanish" },
      { key: "provider", label: "Provider", type: "select", default: "openai", options: [{ label: "OpenAI", value: "openai" }, { label: "Anthropic", value: "anthropic" }, { label: "DeepL", value: "deepl" }] },
      { key: "formality", label: "Formality", type: "select", default: "default", options: [{ label: "Default", value: "default" }, { label: "Formal", value: "formal" }, { label: "Informal", value: "informal" }], group: "Advanced" },
    ],
    executor: "ai_translate",
    tags: ["ai", "translate", "language", "llm"],
  },

  {
    id: "ai.sentiment",
    name: "Sentiment Analysis",
    description: "Analyze sentiment and emotion in text.",
    category: "ai",
    icon: "😊",
    color: "#7c3aed",
    inputs: [D("trigger", "Trigger", "trigger"), D("text_in", "Text", "string")],
    outputs: [D("sentiment", "Sentiment", "string"), D("score", "Score", "number"), D("emotions", "Emotions", "object")],
    fields: [
      { key: "provider", label: "Provider", type: "select", default: "openai", options: [{ label: "OpenAI", value: "openai" }, { label: "Anthropic", value: "anthropic" }] },
      { key: "aspects", label: "Aspect Analysis", type: "boolean", default: false, description: "Break down sentiment per topic" },
    ],
    executor: "ai_sentiment",
    tags: ["ai", "sentiment", "nlp", "emotion"],
  },

  {
    id: "ai.vision",
    name: "Vision / Image Analysis",
    description: "Analyze images and extract information using multimodal AI.",
    category: "ai",
    icon: "👁",
    color: "#7c3aed",
    inputs: [D("trigger", "Trigger", "trigger"), D("image_url_in", "Image URL", "string")],
    outputs: [D("description", "Description", "string"), D("objects", "Detected Objects", "array"), D("text", "Extracted Text", "string")],
    credentials: ["openai"],
    fields: [
      { key: "provider", label: "Provider", type: "select", default: "openai", options: [{ label: "OpenAI (gpt-4o)", value: "openai" }, { label: "Anthropic (Claude)", value: "anthropic" }, { label: "Google Gemini", value: "google" }] },
      { key: "task", label: "Task", type: "select", default: "describe", options: [
        { label: "Describe Image", value: "describe" },
        { label: "Extract Text (OCR)", value: "ocr" },
        { label: "Detect Objects", value: "objects" },
        { label: "Custom Question", value: "custom" },
      ]},
      { key: "question", label: "Custom Question", type: "string", showIf: { task: ["custom"] }, placeholder: "What is shown in this image?" },
      { key: "detail", label: "Detail Level", type: "select", default: "auto", options: [{ label: "Auto", value: "auto" }, { label: "Low (faster)", value: "low" }, { label: "High (detailed)", value: "high" }], group: "Advanced" },
    ],
    executor: "ai_vision",
    tags: ["ai", "vision", "image", "multimodal", "ocr"],
  },

  // ─── Cloud — More ─────────────────────────────────────────────────────────────

  {
    id: "cloud.lambda",
    name: "AWS Lambda",
    description: "Invoke AWS Lambda functions and retrieve results.",
    category: "cloud",
    icon: "aws",
    color: "#f97316",
    inputs: [D("trigger", "Trigger", "trigger"), D("payload_in", "Payload", "object")],
    outputs: [D("response", "Response", "any"), D("status_code", "Status Code", "number")],
    credentials: ["aws"],
    fields: [
      { key: "function_name", label: "Function Name", type: "string", required: true },
      { key: "region", label: "Region", type: "string", default: "us-east-1" },
      { key: "invocation_type", label: "Invocation Type", type: "select", default: "RequestResponse", options: [{ label: "Request-Response (sync)", value: "RequestResponse" }, { label: "Event (async)", value: "Event" }] },
      { key: "qualifier", label: "Qualifier (version/alias)", type: "string", group: "Advanced" },
    ],
    executor: "aws_lambda",
    tags: ["aws", "lambda", "serverless", "cloud"],
  },

  {
    id: "cloud.ses",
    name: "AWS SES",
    description: "Send emails via Amazon Simple Email Service.",
    category: "cloud",
    icon: "aws",
    color: "#f97316",
    inputs: [D("trigger", "Trigger", "trigger"), D("data_in", "Email Data", "object")],
    outputs: [D("message_id", "Message ID", "string"), D("success", "Success", "boolean")],
    credentials: ["aws"],
    fields: [
      { key: "from", label: "From", type: "string", required: true, placeholder: "noreply@yourdomain.com" },
      { key: "to", label: "To (comma-separated)", type: "string", required: true },
      { key: "subject", label: "Subject", type: "string", required: true },
      { key: "html_body", label: "HTML Body", type: "textarea" },
      { key: "text_body", label: "Text Body", type: "textarea" },
      { key: "region", label: "AWS Region", type: "string", default: "us-east-1", group: "Advanced" },
    ],
    executor: "aws_ses",
    tags: ["aws", "ses", "email", "cloud"],
  },

  {
    id: "cloud.azure_blob",
    name: "Azure Blob Storage",
    description: "Upload, download, and manage Azure Blob Storage files.",
    category: "cloud",
    icon: "azure",
    color: "#0078d4",
    inputs: [D("trigger", "Trigger", "trigger"), D("data_in", "Data", "any")],
    outputs: [D("url", "URL", "string"), D("items", "Items", "array")],
    credentials: ["azure"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "upload", options: [
        { label: "Upload Blob", value: "upload" },
        { label: "Download Blob", value: "download" },
        { label: "List Blobs", value: "list" },
        { label: "Delete Blob", value: "delete" },
        { label: "Generate SAS URL", value: "sas_url" },
      ]},
      { key: "container", label: "Container Name", type: "string", required: true },
      { key: "blob_name", label: "Blob Name", type: "string" },
    ],
    executor: "azure_blob",
    tags: ["azure", "blob", "storage", "cloud"],
  },

  // ─── Utilities ────────────────────────────────────────────────────────────────

  {
    id: "util.template",
    name: "Template Render",
    description: "Render a Handlebars/Mustache template with data.",
    category: "data",
    icon: "📄",
    color: "#0891b2",
    inputs: [D("trigger", "Trigger", "trigger"), D("data_in", "Data", "object")],
    outputs: [D("output", "Rendered Output", "string")],
    fields: [
      { key: "template", label: "Template", type: "textarea", required: true, placeholder: "Hello {{name}}, your order {{order.id}} is ready!" },
      { key: "engine", label: "Engine", type: "select", default: "mustache", options: [{ label: "Mustache / Handlebars", value: "mustache" }, { label: "Jinja2-like", value: "nunjucks" }, { label: "Plain (JS template literal)", value: "literal" }] },
    ],
    executor: "template_render",
    tags: ["template", "render", "handlebars", "mustache"],
  },

  {
    id: "util.hash",
    name: "Hash / Encrypt",
    description: "Hash or encrypt values using MD5, SHA, AES, bcrypt.",
    category: "data",
    icon: "🔒",
    color: "#0891b2",
    inputs: [D("trigger", "Trigger", "trigger"), D("value_in", "Value", "string")],
    outputs: [D("hash", "Hash", "string"), D("verified", "Verified", "boolean")],
    fields: [
      { key: "algorithm", label: "Algorithm", type: "select", required: true, default: "sha256", options: ["md5", "sha1", "sha256", "sha512", "bcrypt", "aes_encrypt", "aes_decrypt"].map(v => ({ label: v.toUpperCase(), value: v })) },
      { key: "secret", label: "Secret / Key", type: "string", placeholder: "only needed for AES / HMAC" },
      { key: "compare_value", label: "Compare Value (for verify)", type: "string", group: "Advanced" },
    ],
    executor: "hash_encrypt",
    tags: ["hash", "encrypt", "security", "crypto"],
  },

  {
    id: "util.date",
    name: "Date & Time",
    description: "Parse, format, convert, and calculate dates and times.",
    category: "data",
    icon: "📅",
    color: "#0891b2",
    inputs: [D("trigger", "Trigger", "trigger"), D("date_in", "Date Input", "string")],
    outputs: [D("iso", "ISO String", "string"), D("unix", "Unix Timestamp", "number"), D("formatted", "Formatted", "string"), D("parts", "Parts", "object")],
    fields: [
      { key: "operation", label: "Operation", type: "select", default: "now", options: [
        { label: "Current Time", value: "now" },
        { label: "Format", value: "format" },
        { label: "Parse", value: "parse" },
        { label: "Add / Subtract", value: "add" },
        { label: "Diff Between Dates", value: "diff" },
        { label: "Convert Timezone", value: "timezone" },
      ]},
      { key: "format", label: "Output Format", type: "string", default: "YYYY-MM-DD HH:mm:ss" },
      { key: "timezone", label: "Timezone", type: "string", default: "UTC", showIf: { operation: ["timezone", "format"] } },
      { key: "amount", label: "Amount", type: "number", showIf: { operation: ["add"] } },
      { key: "unit", label: "Unit", type: "select", default: "days", options: ["seconds", "minutes", "hours", "days", "weeks", "months", "years"].map(v => ({ label: v, value: v })), showIf: { operation: ["add", "diff"] } },
    ],
    executor: "date_time",
    tags: ["date", "time", "format", "timezone"],
  },

  {
    id: "util.number",
    name: "Math / Number",
    description: "Perform math operations, rounding, and number formatting.",
    category: "data",
    icon: "🧮",
    color: "#0891b2",
    inputs: [D("trigger", "Trigger", "trigger"), D("a", "A", "number"), D("b", "B", "number")],
    outputs: [D("result", "Result", "number"), D("formatted", "Formatted", "string")],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "add", options: [
        { label: "Add (a + b)", value: "add" },
        { label: "Subtract (a - b)", value: "subtract" },
        { label: "Multiply (a × b)", value: "multiply" },
        { label: "Divide (a ÷ b)", value: "divide" },
        { label: "Modulo (a % b)", value: "modulo" },
        { label: "Power (a ^ b)", value: "power" },
        { label: "Round", value: "round" },
        { label: "Floor", value: "floor" },
        { label: "Ceil", value: "ceil" },
        { label: "Abs", value: "abs" },
        { label: "Min", value: "min" },
        { label: "Max", value: "max" },
        { label: "Random (0 to a)", value: "random" },
      ]},
      { key: "precision", label: "Decimal Precision", type: "number", default: 2 },
      { key: "format_currency", label: "Format as Currency", type: "boolean", default: false },
      { key: "currency", label: "Currency Code", type: "string", default: "USD", showIf: { format_currency: [true] } },
    ],
    executor: "math_number",
    tags: ["math", "number", "calculate", "round"],
  },

  {
    id: "util.aggregate",
    name: "Aggregate Array",
    description: "Sum, average, min, max, count and group array data.",
    category: "data",
    icon: "Σ",
    color: "#0891b2",
    inputs: [D("trigger", "Trigger", "trigger"), D("array_in", "Array", "array")],
    outputs: [D("result", "Result", "any"), D("count", "Count", "number"), D("grouped", "Grouped", "object")],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "sum", options: [
        { label: "Sum", value: "sum" },
        { label: "Average", value: "avg" },
        { label: "Min", value: "min" },
        { label: "Max", value: "max" },
        { label: "Count", value: "count" },
        { label: "Count Distinct", value: "count_distinct" },
        { label: "Group By", value: "group_by" },
        { label: "Flatten", value: "flatten" },
        { label: "Unique", value: "unique" },
        { label: "Chunk", value: "chunk" },
        { label: "Pick Fields", value: "pick" },
        { label: "Pluck Field", value: "pluck" },
      ]},
      { key: "field", label: "Field", type: "string", placeholder: "price" },
      { key: "group_by_field", label: "Group By Field", type: "string", showIf: { operation: ["group_by"] } },
      { key: "chunk_size", label: "Chunk Size", type: "number", default: 10, showIf: { operation: ["chunk"] } },
      { key: "fields", label: "Fields to Pick (comma-sep)", type: "string", showIf: { operation: ["pick"] } },
    ],
    executor: "aggregate_array",
    tags: ["array", "aggregate", "sum", "group", "data"],
  },

  {
    id: "util.xml",
    name: "XML Parser",
    description: "Parse XML to JSON or convert JSON to XML.",
    category: "data",
    icon: "</> ",
    color: "#0891b2",
    inputs: [D("trigger", "Trigger", "trigger"), D("input_in", "Input", "string")],
    outputs: [D("output", "Output", "any"), D("error", "Error", "string")],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "xml_to_json", options: [{ label: "XML → JSON", value: "xml_to_json" }, { label: "JSON → XML", value: "json_to_xml" }] },
      { key: "root_tag", label: "Root Tag (for JSON→XML)", type: "string", default: "root", showIf: { operation: ["json_to_xml"] } },
      { key: "compact", label: "Compact Output", type: "boolean", default: true },
    ],
    executor: "xml_parse",
    tags: ["xml", "parse", "convert", "data"],
  },

  // ─── Notification / Alerting ──────────────────────────────────────────────────

  {
    id: "notify.push",
    name: "Push Notification",
    description: "Send push notifications via Firebase (FCM), APNs, or OneSignal.",
    category: "communication",
    icon: "🔔",
    color: "#ec4899",
    inputs: [D("trigger", "Trigger", "trigger"), D("token_in", "Device Token", "string")],
    outputs: [D("result", "Result", "object"), D("success", "Success", "boolean")],
    credentials: ["push"],
    fields: [
      { key: "provider", label: "Provider", type: "select", required: true, default: "fcm", options: [{ label: "Firebase (FCM)", value: "fcm" }, { label: "OneSignal", value: "onesignal" }, { label: "Expo Push", value: "expo" }] },
      { key: "title", label: "Title", type: "string", required: true },
      { key: "body", label: "Body", type: "textarea", required: true },
      { key: "data", label: "Extra Data (JSON)", type: "json", group: "Advanced" },
      { key: "badge", label: "Badge Count", type: "number", group: "Advanced" },
    ],
    executor: "push_notify",
    tags: ["push", "notification", "fcm", "mobile"],
  },

  {
    id: "notify.pagerduty",
    name: "PagerDuty",
    description: "Create and resolve PagerDuty incidents and alerts.",
    category: "devops",
    icon: "pagerduty",
    color: "#00b050",
    inputs: [D("trigger", "Trigger", "trigger")],
    outputs: [D("incident", "Incident", "object"), D("id", "Incident ID", "string")],
    credentials: ["pagerduty"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "create_incident", options: [
        { label: "Create Incident", value: "create_incident" },
        { label: "Resolve Incident", value: "resolve_incident" },
        { label: "Acknowledge Incident", value: "acknowledge_incident" },
        { label: "List Incidents", value: "list_incidents" },
        { label: "Trigger Alert", value: "trigger_alert" },
      ]},
      { key: "service_id", label: "Service ID", type: "string" },
      { key: "title", label: "Incident Title", type: "string" },
      { key: "severity", label: "Severity", type: "select", default: "warning", options: ["critical", "error", "warning", "info"].map(v => ({ label: v, value: v })) },
      { key: "incident_id", label: "Incident ID", type: "string", showIf: { operation: ["resolve_incident", "acknowledge_incident"] } },
    ],
    executor: "pagerduty",
    tags: ["pagerduty", "incident", "alerting", "devops"],
  },

  // ─── DevOps ───────────────────────────────────────────────────────────────────

  {
    id: "devops.docker",
    name: "Docker",
    description: "Build, run, and manage Docker containers.",
    category: "devops",
    icon: "docker",
    color: "#2496ed",
    inputs: [D("trigger", "Trigger", "trigger")],
    outputs: [D("output", "Output", "string"), D("exit_code", "Exit Code", "number")],
    credentials: ["docker"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "run", options: [
        { label: "Run Container", value: "run" },
        { label: "Build Image", value: "build" },
        { label: "Pull Image", value: "pull" },
        { label: "Push Image", value: "push" },
        { label: "Stop Container", value: "stop" },
        { label: "Remove Container", value: "rm" },
        { label: "List Containers", value: "ps" },
        { label: "Exec Command", value: "exec" },
      ]},
      { key: "image", label: "Image", type: "string", placeholder: "node:20-alpine" },
      { key: "command", label: "Command", type: "string", placeholder: "npm run build" },
      { key: "environment", label: "Environment (JSON)", type: "json" },
      { key: "volumes", label: "Volumes (JSON)", type: "json" },
    ],
    executor: "docker",
    tags: ["docker", "container", "devops"],
  },

  {
    id: "devops.railway",
    name: "Railway",
    description: "Deploy and manage services on Railway.",
    category: "devops",
    icon: "railway",
    color: "#7B61FF",
    inputs: [D("trigger", "Trigger", "trigger")],
    outputs: [D("deployment", "Deployment", "object"), D("url", "URL", "string")],
    credentials: ["railway"],
    fields: [
      { key: "operation", label: "Operation", type: "select", required: true, default: "list_projects", options: [
        { label: "List Projects", value: "list_projects" },
        { label: "Get Project", value: "get_project" },
        { label: "Deploy Service", value: "deploy" },
        { label: "Get Deployment", value: "get_deployment" },
        { label: "Restart Service", value: "restart" },
      ]},
      { key: "project_id", label: "Project ID", type: "string" },
      { key: "service_id", label: "Service ID", type: "string" },
    ],
    executor: "railway",
    tags: ["railway", "deploy", "hosting"],
  },

]

// Category metadata
export const CATEGORY_META: Record<NodeCategory, { label: string; color: string; description: string }> = {
  ai:            { label: "AI & LLM",       color: "#7c3aed", description: "Language models, embeddings, and AI workflows" },
  llm:           { label: "LLM",            color: "#7c3aed", description: "Language model integrations" },
  image:         { label: "Image AI",       color: "#db2777", description: "Image generation and processing" },
  audio:         { label: "Audio AI",       color: "#0891b2", description: "Audio transcription and synthesis" },
  developer:     { label: "Developer",      color: "#2563eb", description: "HTTP requests, webhooks, scheduling, code" },
  database:      { label: "Databases",      color: "#059669", description: "SQL, NoSQL, and cache databases" },
  cloud:         { label: "Cloud",          color: "#f97316", description: "Cloud storage, CDN, and infrastructure" },
  logic:         { label: "Logic",          color: "#d97706", description: "Conditions, loops, merging, flow control" },
  files:         { label: "Files",          color: "#f59e0b", description: "Read, write, and parse files" },
  data:          { label: "Data",           color: "#0891b2", description: "Transform, filter, and format data" },
  midas:         { label: "Midas",          color: "#f59e0b", description: "Midas platform APIs and marketplace" },
  analytics:     { label: "Analytics",      color: "#6366f1", description: "Event tracking and analytics platforms" },
  browser:       { label: "Browser",        color: "#06b6d4", description: "Browser automation and scraping" },
  ide:           { label: "IDE",            color: "#64748b", description: "IDE integrations and code tools" },
  communication: { label: "Communication",  color: "#ec4899", description: "Email, Slack, Discord, SMS" },
  crm:           { label: "CRM",            color: "#8b5cf6", description: "Project management and CRM tools" },
  devops:        { label: "DevOps",         color: "#14b8a6", description: "CI/CD, containers, and deployment" },
  finance:       { label: "Finance",        color: "#22c55e", description: "Payments and financial APIs" },
}

export function getNodeById(id: string): NodeDefinition | undefined {
  return NODE_REGISTRY.find(n => n.id === id)
}

export function getNodesByCategory(category: NodeCategory): NodeDefinition[] {
  return NODE_REGISTRY.filter(n => n.category === category)
}

export function searchNodes(query: string): NodeDefinition[] {
  const q = query.toLowerCase()
  return NODE_REGISTRY.filter(n =>
    n.name.toLowerCase().includes(q) ||
    n.description.toLowerCase().includes(q) ||
    n.tags?.some(t => t.includes(q)) ||
    n.id.includes(q)
  )
}
