# Nexus Execution Engine

## Architecture

The execution engine lives in `lib/nexus/executor.ts` and is invoked by `app/api/nexus/workflows/[id]/execute/route.ts`.

## Core Flow

1. **Topological sort** — DAG nodes are sorted so dependencies always execute before dependents
2. **Expression interpolation** — `{{node.output_key}}` placeholders are resolved against prior node outputs at runtime
3. **Node executor dispatch** — each node's `executor` key maps to a function in `NODE_EXECUTORS`
4. **Result collection** — every node result (output, error, duration_ms) is stored and returned
5. **Execution record** — results are persisted to `nexus_workflow_executions` in Supabase

## Retry Logic

Each node supports `retries` (0–3) and `retry_delay_ms` config fields. Failed nodes are re-attempted with exponential backoff before marking as `error`.

## Credential Injection

User credentials are fetched from `nexus_credentials` (encrypted at rest via Supabase RLS) and injected into the executor context. Nodes declare which credential keys they need via `credentials: ["openai_api_key"]`.

## Security Hardening (execute route)

- **Rate limit**: 10 executions per user per minute (in-memory sliding window)
- **SSRF protection**: `http_request` node URLs are validated; private/loopback IPs are blocked
- **Schema validation**: max 100 nodes, max 500 edges per workflow
- **Auth**: All routes require authenticated Supabase session + workflow ownership check

## Scheduling

Workflow schedules are stored in `nexus_workflow_schedules` with cron expressions. The `schedule` node triggers the workflow on the configured interval via the `ScheduleManager` UI.

## Webhooks

Webhook tokens are stored in `nexus_webhook_tokens`. The `webhook` trigger node fires when a POST is received at `/api/nexus/webhooks/[token]`.

## Supported Node Executors

See `NODE_LIBRARY.md` for the full list. All executors are real implementations — no mocks.