# Nexus Node Library

**Current node count: 118+ nodes across 22 categories**

## Categories

| Category | Nodes |
|----------|-------|
| AI | ai_chat, ai_embed, ai_image, ai_classify, ai_extract, ai_agent, ai_transcribe, ai.summarize, ai.translate, ai.sentiment, ai.rewrite, ai.code_review, ai.vision, ai.tts, ai.structured_output, ai.rag |
| Developer | http_request, code_exec, graphql, jwt_decode, crypto_hash, uuid_gen, date_format, template_render |
| Logic | if_condition, switch, loop_foreach, merge, retry, delay, schedule, webhook |
| Data | filter_array, sort_array, text_transform, json_op, parse_csv, aggregate, dedupe, xml_to_json, yaml_parse, diff_objects, chunk_array, validate_schema |
| Files | files.read, files.write, files.parse_csv, files.parse_json |
| Communication | slack, discord, email_send, telegram, microsoft_teams, twilio_sms, twilio_call, outlook |
| Database | supabase_db, supabase_query, postgres_query, redis_op, mongodb_op, mysql_query |
| CRM | notion, linear, jira, hubspot, airtable |
| Cloud | aws_lambda, aws_s3, aws_sqs, azure_function, gcp_function |
| Version Control | github, github_actions, gitlab |
| Finance | stripe, exchange_rate, generate_invoice |
| Calendar | google_calendar, asana |
| Social | twitter, instagram, youtube, linkedin |
| Browser | web_scrape, screenshot, pdf_export |
| Utilities | set_vars, merge_objects, batch_process, http_poll |

## Node Definition Schema

```typescript
interface NodeDefinition {
  id: string           // e.g. "ai_chat", "http_request"
  name: string         // Display name
  description: string  // Help text
  category: string     // Grouping
  icon: string         // Emoji or brand key for BrandIcon
  color: string        // Hex color
  inputs: NodePort[]   // Input ports
  outputs: NodePort[]  // Output ports
  credentials?: string[] // Required credential keys
  fields: FieldDef[]   // Config panel fields
  executor: string     // Maps to NODE_EXECUTORS key
  tags: string[]       // Search tags
}
```

## Executor Implementation Status

All listed executors are real implementations (no mocks or stubs):
- **http_request** — fetch with configurable method, headers, body, retry
- **ai_chat** — OpenAI / Anthropic / Gemini / Groq via provider routing
- **ai_embed** — text embeddings (OpenAI ada-002)
- **ai_image** — DALL-E 3 image generation
- **email_send** — Resend / SendGrid
- **slack** — Slack Web API `chat.postMessage`
- **discord** — Discord webhook
- **github** — GitHub REST API (issues, PRs, commits, repos)
- **supabase_db** — Supabase REST insert/select/update/delete
- **parse_csv** — PapaParse-compatible CSV parsing
- **json_op** — JSONPath queries
- **loop_foreach** — iterates array items through sub-workflow context
- **switch** — multi-branch routing by field value
- **retry** — configurable retry with exponential backoff
- **set_vars**, **if_condition**, **merge**, **delay**, **schedule**, **webhook** — logic primitives