# Nexus — Master TODO

> Last updated: 2026-07-04  
> Status key: `[ ]` pending · `[~]` partial · `[x]` done

---

## 1. Workflow Editor (Canvas)

### 1.1 Edge Drawing (Wire Connections)
- [ ] **Click-drag from output port → input port** to draw an edge (currently ghost edge exists but connection is never committed)
- [ ] Detect when drag ends over a compatible input port and create the edge
- [ ] Prevent connecting port to itself or to same node
- [ ] Type-compatible port validation (trigger → trigger, string → string, any → any)
- [ ] Highlight valid target ports during drag (green glow)
- [ ] Highlight incompatible ports during drag (red/dim)
- [ ] Show edge delete button on hover (click × to remove connection)
- [ ] Animate edges when workflow is executing (dashed animated stroke)

### 1.2 Node Renaming
- [ ] Double-click node header to rename label inline
- [ ] Press Enter to confirm, Escape to cancel
- [ ] Persist rename to canvas state and save definition

### 1.3 Selection & Multi-select
- [ ] Click-drag on empty canvas to draw a selection rectangle
- [ ] Select multiple nodes with Shift+click
- [ ] Move selected group together
- [ ] Delete all selected with Delete key
- [ ] Duplicate selected group with Ctrl+D

### 1.4 Undo / Redo
- [ ] Implement command history stack (add node, delete node, move node, add edge, delete edge, config change)
- [ ] Wire Undo (Ctrl+Z) and Redo (Ctrl+Y) toolbar buttons — currently placeholders

### 1.5 Minimap
- [ ] Add minimap overlay (bottom-right) showing all nodes as dots
- [ ] Click minimap to jump viewport
- [ ] Toggle minimap with keyboard shortcut M

### 1.6 Canvas Polish
- [ ] Auto-layout button (DAG topological left-to-right arrangement)
- [ ] Keyboard shortcut `/` opens node search picker inline on canvas
- [ ] Node groups / comment boxes (drag to create a labeled region)
- [ ] Pin nodes (prevent accidental move)
- [ ] Copy/paste nodes between workflows via clipboard

### 1.7 Execution Visualization
- [ ] When workflow is running, animate each node card in sequence: idle → running (pulse amber) → success (green) / error (red)
- [ ] Show per-node output data in a tooltip/expand after execution
- [ ] Animate edges with a flowing light dot during execution
- [ ] "Run from here" — right-click a node to start execution from that node

---

## 2. Node System

### 2.1 Node Registry Expansion
Current count: ~50. Target: 150+ real nodes.

**AI / LLM** (add)
- [ ] `ai.summarize` — Summarize long text
- [ ] `ai.translate` — Translate text between languages
- [ ] `ai.sentiment` — Sentiment analysis
- [ ] `ai.rewrite` — Rewrite/improve text
- [ ] `ai.code_review` — AI code review
- [ ] `ai.tts` — Text-to-speech (OpenAI TTS, ElevenLabs, Cartesia)
- [ ] `ai.vision` — Analyze image with vision model
- [ ] `ai.rag` — RAG pipeline (embed + search + generate)
- [ ] `ai.function_call` — Structured function calling with schema

**Developer / Utilities**
- [ ] `dev.graphql` — GraphQL query/mutation node
- [ ] `dev.soap` — SOAP/XML API node
- [ ] `dev.ssh` — SSH command execution
- [ ] `dev.ftp` — FTP/SFTP file operations
- [ ] `dev.grpc` — gRPC call node
- [ ] `dev.jwt` — Sign/verify JWT tokens
- [ ] `dev.crypto` — Hash, encrypt, decrypt, generate keys
- [ ] `dev.uuid` — Generate UUIDs
- [ ] `dev.date` — Date parsing, formatting, arithmetic
- [ ] `dev.template` — Handlebars/Mustache template rendering

**Databases**
- [ ] `db.mysql` — MySQL query node
- [ ] `db.sqlite` — SQLite read/write
- [ ] `db.pinecone` — Pinecone vector search
- [ ] `db.weaviate` — Weaviate vector operations
- [ ] `db.qdrant` — Qdrant vector store
- [ ] `db.elasticsearch` — Elasticsearch query/index

**Cloud / DevOps**
- [ ] `cloud.azure_blob` — Azure Blob Storage
- [ ] `cloud.lambda` — AWS Lambda invoke
- [ ] `cloud.sqs` — AWS SQS send/receive
- [ ] `cloud.sns` — AWS SNS publish
- [ ] `cloud.pubsub` — Google Cloud Pub/Sub
- [ ] `devops.gitlab` — GitLab CI/CD operations
- [ ] `devops.kubernetes` — kubectl apply/get/delete
- [ ] `devops.terraform` — Terraform plan/apply

**Communication**
- [ ] `comm.teams` — Microsoft Teams message
- [ ] `comm.telegram` — Telegram bot message
- [ ] `comm.whatsapp` — WhatsApp Business API
- [ ] `comm.gmail` — Gmail send/read (OAuth)
- [ ] `comm.outlook` — Outlook send/read

**CRM / Productivity**
- [ ] `crm.jira` — Jira issue operations
- [ ] `crm.confluence` — Confluence page CRUD
- [ ] `crm.asana` — Asana task management
- [ ] `crm.trello` — Trello card operations
- [ ] `crm.airtable` — Airtable base operations
- [ ] `crm.hubspot` — HubSpot contacts/deals
- [ ] `crm.salesforce` — Salesforce records
- [ ] `crm.google_sheets` — Read/write Google Sheets
- [ ] `crm.google_calendar` — Calendar events

**Browser / Scraping**
- [ ] `browser.scrape` — Playwright/Puppeteer scraper
- [ ] `browser.screenshot` — Page screenshot
- [ ] `browser.pdf` — Generate PDF from URL
- [ ] `browser.form_fill` — Automated form filling

**Data**
- [ ] `data.aggregate` — Sum, avg, min, max, count
- [ ] `data.dedupe` — Remove duplicate records
- [ ] `data.validate_schema` — JSON Schema validation
- [ ] `data.xml_parse` — XML ↔ JSON conversion
- [ ] `data.yaml_parse` — YAML ↔ JSON conversion
- [ ] `data.diff` — Diff two objects/arrays
- [ ] `data.chunk` — Split large arrays into batches

**Finance**
- [ ] `finance.exchange_rate` — Currency exchange rates
- [ ] `finance.invoice_gen` — Generate PDF invoice

### 2.2 Node Execution (Real, Not Simulated)
The execute route currently fakes all node execution with `Math.random()` durations and fake output strings.

- [ ] Build server-side executor registry mapping `executor` keys → async functions
- [ ] `http_request` — real `fetch()` with headers, auth, timeout, retry
- [ ] `ai_chat` — real OpenAI/Anthropic/Gemini API calls using stored credentials
- [ ] `ai_embed` — real embedding API call
- [ ] `ai_image` — real image generation API call
- [ ] `supabase_db` — real Supabase table operations via admin client
- [ ] `postgres_query` — real pg client query
- [ ] `redis_op` — real ioredis operations
- [ ] `slack` — real Slack Web API call
- [ ] `discord` — real Discord REST API call
- [ ] `email_send` — real Resend/Sendgrid/SMTP send
- [ ] `github` — real Octokit API call
- [ ] `notion` — real Notion API call
- [ ] `linear` — real Linear GraphQL call
- [ ] `stripe` — real Stripe SDK call
- [ ] `code_exec` — sandboxed JS/Python execution (VM2 or Deno subprocess)
- [ ] `if_condition` — evaluate expression against input context
- [ ] `loop_foreach` — iterate array, run downstream subgraph per item
- [ ] `merge` — wait for multiple branches
- [ ] `delay` — setTimeout or scheduled resume
- [ ] `set_vars` — apply expression-based assignments
- [ ] `text_transform` — string operations
- [ ] `filter_array`, `sort_array`, `parse_csv`, `json_op` — pure JS transforms
- [ ] `schedule` — register with cron scheduler (Supabase pg_cron or edge function)

### 2.3 Credential Management
- [ ] Add `nexus_credentials` table to Supabase (id, user_id, provider, name, encrypted_data, created_at)
- [ ] Migration + RLS policy (user sees only own credentials)
- [ ] Encrypt credential values at rest (AES-256 or Supabase vault)
- [ ] API routes: GET/POST/DELETE `/api/nexus/credentials`
- [ ] `CredentialManager` UI in NexusClient tab or Developer Settings
- [ ] Node config panel shows "Use saved credential" dropdown when `field.type === "credential"`
- [ ] Auto-populate API key fields from stored credential
- [ ] Allow per-node inline override

### 2.4 Node Validation Engine
- [ ] On every config field `onChange`, run validation defined in field's `validate` function
- [ ] Aggregate per-node validation into `ValidationState` shown on node card (green/yellow/red dot)
- [ ] Block workflow execution if any required field is empty or validation fails
- [ ] Show validation summary before execution ("3 nodes have errors")
- [ ] Validate edge connections (ensure trigger nodes have trigger outputs going into trigger inputs)

---

## 3. Execution Engine

### 3.1 Real Executor Architecture
- [ ] Create `lib/nexus/executor.ts` — core DAG runner
  - Topological sort of node graph
  - Sequential execution with context passing
  - Parallel execution for independent branches
  - Per-node input assembly from upstream outputs
  - Expression interpolation in field values (`{{$input.name}}`, `{{$node.NodeX.output.value}}`)
  - Per-node timeout with cancellation signal
  - Per-node retry with backoff
  - Error node routing (connect error output to recovery node)

### 3.2 Execution Context & Variables
- [ ] Context object passed between nodes: `{ $input, $node, $workflow, $env, $credentials }`
- [ ] Expression engine: `{{expression}}` in any string field (simple template or full JS expression)
- [ ] Workflow-level variables panel in editor (set constants, secrets referenced in nodes)

### 3.3 Streaming Execution
- [ ] For AI nodes with `streaming: true`, stream tokens back to client via SSE
- [ ] Show streaming output in execution detail panel in real-time

### 3.4 Scheduled Workflows
- [ ] Supabase `pg_cron` or Edge Function scheduler
- [ ] API: POST `/api/nexus/workflows/{id}/schedule` — create/update schedule
- [ ] API: DELETE `/api/nexus/workflows/{id}/schedule` — remove schedule
- [ ] Show next run time on WorkflowList card
- [ ] UI toggle in editor toolbar to enable/configure schedule

### 3.5 Webhook-Triggered Workflows
- [ ] POST `/api/nexus/webhooks/{token}` — public endpoint that triggers a workflow
- [ ] Assign unique token per webhook-trigger node
- [ ] Show webhook URL in node config
- [ ] Signature verification using secret

---

## 4. Workflow Inspector Panel

- [ ] Create `WorkflowInspector.tsx` — toggleable right panel in editor
- [ ] Show:
  - Estimated runtime (sum of node timeout_ms)
  - Credit cost estimate
  - Number of external API calls
  - Connected credentials (list which are missing)
  - Security warnings (exposed secrets in plain text fields, HTTP without auth)
  - Optimization recommendations (unnecessary loops, duplicate HTTP nodes)
  - Execution graph preview (topological order)
  - Dependency graph (which nodes depend on which)
- [ ] Toggle with `I` keyboard shortcut or toolbar icon

---

## 5. Export / Deploy Pipeline

- [ ] Create `ExportPipeline.tsx` — animated full-screen deploy animation
- [ ] Stages with live animated progress:
  1. Validating workflow…
  2. Preparing project…
  3. Generating context files…
  4. Generating documentation…
  5. Generating CLAUDE.md / memory…
  6. Packaging files…
  7. Synchronizing Midas Bridge…
  8. Opening IDE…
  9. Installing dependencies…
  10. Running validation…
  11. ✓ Complete
- [ ] Each stage: spinner → checkmark with timing display
- [ ] Error state: red ✗ with retry button
- [ ] Export formats:
  - [ ] ZIP download
  - [ ] Push to GitHub repo
  - [ ] Send to IDE via Midas Bridge
  - [ ] Deploy as Vercel serverless function
  - [ ] Deploy as Supabase Edge Function

---

## 6. Workflow Testing & Debugging

- [ ] **Test Connection** button per node — validates credentials and connectivity
- [ ] **Run Node** button — execute single node with mock or real input
- [ ] **Dry Run** — execute entire workflow with no side effects (read-only APIs, skip writes)
- [ ] **Debug Mode** — step-through execution, pause before each node
- [ ] **Breakpoints** — right-click node → "Add Breakpoint"
- [ ] **Run From Here** / **Run Until Here** — partial execution
- [ ] **View Raw Request/Response** in execution history per node
- [ ] **Performance metrics** per node: p50/p95 latency across last N executions

---

## 7. Midas Bridge

- [ ] **Real WebSocket server** — `lib/nexus/bridge-server.ts` using native WebSocket or socket.io
- [ ] Bridge status: real ping/pong heartbeat, not just DB status toggle
- [ ] **VS Code Extension** (or instructions) — agent that connects to bridge server
- [ ] **Cursor Extension** support
- [ ] Bridge commands: open file, run command in terminal, read file, write file, search codebase
- [ ] Bridge security: signed tokens, per-session expiry
- [ ] Bridge activity log in UI (last 20 bridge events with timestamps)
- [ ] Bridge reconnect with exponential backoff

---

## 8. Database & API

### 8.1 Missing Migrations
- [ ] `nexus_credentials` table (encrypted provider credentials)
- [ ] `nexus_workflow_schedules` table (cron schedules per workflow)
- [ ] `nexus_webhook_tokens` table (public webhook endpoints)
- [ ] `nexus_execution_logs` table (fine-grained per-node logs)
- [ ] Add `execution_count` auto-increment trigger on `nexus_workflows`
- [ ] Add indexes on `nexus_workflow_executions.workflow_id`, `started_at`

### 8.2 Missing API Routes
- [ ] `GET /api/nexus/credentials` — list user's stored credentials
- [ ] `POST /api/nexus/credentials` — create encrypted credential
- [ ] `DELETE /api/nexus/credentials/[id]` — delete credential
- [ ] `POST /api/nexus/credentials/[id]/test` — test connectivity for credential
- [ ] `GET /api/nexus/workflows/[id]/executions` — paginated execution history for one workflow
- [ ] `DELETE /api/nexus/executions/[id]` — delete execution record
- [ ] `POST /api/nexus/workflows/[id]/schedule` — create/update cron schedule
- [ ] `DELETE /api/nexus/workflows/[id]/schedule` — remove schedule
- [ ] `POST /api/nexus/webhooks/[token]` — public webhook trigger
- [ ] `POST /api/nexus/nodes/[id]/test` — test a node config

### 8.3 Security
- [ ] Rate-limit execution API (max N executions per minute per user)
- [ ] Validate workflow definition schema before accepting PATCH
- [ ] Sanitize expression interpolation (prevent SSRF via user-controlled URLs)
- [ ] Encrypt credential values before storing in DB
- [ ] Audit log for all workflow executions (who triggered, when, from where)

---

## 9. WorkflowList Dashboard

- [ ] Search/filter workflows by name, status, last executed
- [ ] Sort by: name, created, last run, execution count
- [ ] Bulk delete selected workflows
- [ ] Workflow tags / labels for organization
- [ ] Workflow duplication (clone with new name)
- [ ] Workflow status toggle (active ↔ paused) — paused workflows skip scheduled runs
- [ ] Show schedule next-run time on card if scheduled
- [ ] Show last execution status badge (success/error/running) on card
- [ ] Empty state with "Create your first workflow" CTA and templates

---

## 10. Workflow Templates

- [ ] Template gallery page or modal
- [ ] Pre-built templates:
  - [ ] "AI Email Responder" — webhook → AI Chat → Email Send
  - [ ] "GitHub PR Summarizer" — GitHub → AI Summarize → Slack
  - [ ] "Scheduled Report" — Schedule → Supabase Query → Format → Email
  - [ ] "Webhook to Notion" — Webhook → Transform → Notion Create Page
  - [ ] "AI Image Pipeline" — HTTP → AI Image Gen → S3 Upload → Response
  - [ ] "Slack Command Bot" — Webhook → AI Chat → Slack Reply
  - [ ] "Data Sync" — Schedule → Postgres → Transform → Supabase Upsert
- [ ] One-click "Use Template" creates workflow with nodes pre-placed
- [ ] Template author credit and description

---

## 11. UI / UX Polish

### 11.1 Editor
- [ ] Dark mode dot-grid animation on canvas background (subtle parallax)
- [ ] Node card width auto-sizes to longest field label
- [ ] Port labels show type badge on hover (string, number, object…)
- [ ] Edge color reflects data type flowing through it
- [ ] "Execution ghost" — after run, show last output values as small badges on output ports
- [ ] Search shortcut `/` on canvas opens inline command palette for node search + add

### 11.2 NodeConfigPanel
- [ ] Code editor fields use Monaco or CodeMirror (syntax highlighting, autocomplete)
- [ ] JSON fields have a pretty-printer / formatter button
- [ ] `textarea` fields expand vertically on focus
- [ ] System prompt field shows character/token count estimate
- [ ] Expression fields (strings containing `{{`) show a yellow border + hint

### 11.3 NodeSidebar
- [ ] Category count badge updates when search filters results
- [ ] Keyboard navigation: Arrow keys to move, Enter to add node
- [ ] Drag ghost image matches node card style (not browser default)
- [ ] "New" badge on recently added node types

### 11.4 General
- [ ] Responsive: editor should work at 1280px+ (warn below that)
- [ ] Loading skeletons for all async data (workflows, executions, credentials)
- [ ] Empty states with illustrations for all lists
- [ ] Toast notifications for: save success, execution complete, errors, credential saved
- [ ] Keyboard shortcut cheat sheet modal (press `?`)

---

## 12. WorkflowCanvas.tsx (Legacy)

The old `WorkflowCanvas.tsx` (23KB) now duplicates `WorkflowEditor.tsx`.

- [ ] **Delete `WorkflowCanvas.tsx`** — it is no longer used by NexusClient
- [ ] Verify no remaining imports of `WorkflowCanvas` anywhere

---

## 13. Testing

- [ ] Unit tests for `node-registry.ts`: `getNodeById`, `searchNodes`, `getNodesByCategory`
- [ ] Unit tests for executor: expression interpolation, topological sort, condition evaluation
- [ ] Integration tests for API routes: workflows CRUD, execute, credentials
- [ ] E2E Playwright test:
  - [ ] Navigate to /nexus
  - [ ] Create a workflow
  - [ ] Open editor, add HTTP Request node from sidebar
  - [ ] Configure URL field
  - [ ] Save
  - [ ] Execute
  - [ ] Verify execution history shows result
- [ ] E2E test for webhook trigger flow

---

## 14. Documentation & Memory

- [ ] Update `memory/project-state.md` with Cycle 16 Nexus rework deliverables
- [ ] Create `memory/checkpoints/checkpoint-nexus-rework.md`
- [ ] Update `nexus/documentation/NODE_LIBRARY.md` with actual registry count and categories
- [ ] Update `nexus/documentation/EXECUTION_ENGINE.md` with real architecture
- [ ] Update `nexus/documentation/UI_UX.md` with WorkflowEditor spec
- [ ] Update `nexus/documentation/MIDAS_BRIDGE.md` with real protocol spec
- [ ] Add `nexus/documentation/CREDENTIALS.md` — credential vault architecture
- [ ] Add `nexus/documentation/TEMPLATES.md` — template system spec

---

## Priority Order

### 🔴 Critical (blocks real usage)
1. Edge drawing (connect ports) — without this the canvas is non-functional
2. Real node execution (replaces `Math.random()` simulation)
3. Credential management (required for AI + API nodes to work)
4. Workflow validation blocking execution

### 🟠 High (core UX)
5. Undo/redo history
6. Node rename inline
7. Execution visualization (animate nodes during run)
8. WorkflowInspector panel
9. Delete legacy `WorkflowCanvas.tsx`

### 🟡 Medium (production readiness)
10. Export pipeline animation
11. Scheduled workflows
12. Webhook-triggered workflows
13. Bridge WebSocket server
14. Node expansion (150+ nodes)

### 🟢 Enhancement (polish)
15. Monaco/CodeMirror in code fields
16. Templates gallery
17. Multi-select on canvas
18. Minimap
19. Keyboard shortcuts cheat sheet
20. E2E test suite
