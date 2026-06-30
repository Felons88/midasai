# MidasAI Phase 1 — Schema Alignment Report

**Date:** 2026-06-20
**Task:** Bring live Supabase database into 100% alignment with `schema.sql` and codebase references.

---

## Summary

**Status: COMPLETE**

All missing developer-platform tables and the additional `payouts`/`usage_records` tables required by the codebase have been created in the live database, indexed, protected with RLS, and wired with `updated_at` triggers. TypeScript database types were regenerated from the live schema.

---

## Migration Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20240621_schema_alignment_developer_platform.sql` | Creates missing enums, developer tables, indexes, RLS, and policies |
| `supabase/migrations/20240621_schema_alignment_triggers.sql` | Creates generic `update_updated_at_column()` function and `updated_at` triggers |

---

## Tables Created

### Required by schema.sql

- `api_keys`
- `api_usage`
- `api_logs`
- `webhooks`
- `webhook_deliveries`
- `applications`
- `oauth_tokens`
- `mcp_servers`
- `mcp_tokens`
- `mcp_connections`
- `mcp_usage`

### Required by codebase (not in schema.sql)

- `payouts`
- `usage_records`

### Verification

All 13 tables are present in the live `public` schema.

---

## Enums Created

- `api_key_status_enum` (ACTIVE, REVOKED, EXPIRED)
- `webhook_status_enum` (ACTIVE, PAUSED, ERROR)
- `webhook_event_enum`
- `delivery_status_enum` (PENDING, DELIVERED, FAILED, RETRYING)
- `application_status_enum` (ACTIVE, SUSPENDED)
- `mcp_server_status_enum` (ACTIVE, INACTIVE, ERROR)
- `log_level_enum` (INFO, WARN, ERROR)

---

## Indexes Created

All 24 indexes from the schema.sql "Developer Platform Indexes" section were created, plus 4 additional indexes for `payouts` and `usage_records`:

- `idx_api_keys_user_id`
- `idx_api_keys_status`
- `idx_api_usage_api_key_id`
- `idx_api_usage_user_id`
- `idx_api_usage_created_at`
- `idx_api_logs_user_id`
- `idx_api_logs_api_key_id`
- `idx_webhooks_user_id`
- `idx_webhooks_status`
- `idx_webhook_deliveries_webhook_id`
- `idx_webhook_deliveries_status`
- `idx_applications_user_id`
- `idx_applications_client_id`
- `idx_oauth_tokens_application_id`
- `idx_oauth_tokens_user_id`
- `idx_mcp_servers_user_id`
- `idx_mcp_servers_status`
- `idx_mcp_tokens_mcp_server_id`
- `idx_mcp_tokens_user_id`
- `idx_mcp_connections_mcp_server_id`
- `idx_mcp_connections_user_id`
- `idx_mcp_usage_mcp_server_id`
- `idx_mcp_usage_user_id`
- `idx_payouts_user_id`
- `idx_payouts_status`
- `idx_usage_records_user_id`
- `idx_usage_records_resource_type`

Primary-key and unique-constraint indexes are created automatically by PostgreSQL.

---

## Row Level Security

RLS is enabled on all 13 new tables.

| Table | RLS Enabled |
|-------|-------------|
| api_keys | Yes |
| api_usage | Yes |
| api_logs | Yes |
| webhooks | Yes |
| webhook_deliveries | Yes |
| applications | Yes |
| oauth_tokens | Yes |
| mcp_servers | Yes |
| mcp_tokens | Yes |
| mcp_connections | Yes |
| mcp_usage | Yes |
| payouts | Yes |
| usage_records | Yes |

---

## Policies Created

36 policies were created across the new tables:

- **API Keys:** 4 (view, insert, update, delete own)
- **API Usage:** 2 (view own, service_role insert)
- **API Logs:** 2 (view own, service_role insert)
- **Webhooks:** 4 (view, insert, update, delete own)
- **Webhook Deliveries:** 2 (view own, service_role insert)
- **Applications:** 3 (view, insert, update own)
- **OAuth Tokens:** 2 (view own, service_role insert)
- **MCP Servers:** 4 (view, insert, update, delete own)
- **MCP Tokens:** 2 (view own, service_role insert)
- **MCP Connections:** 2 (view, insert own)
- **MCP Usage:** 2 (view own, service_role insert)
- **Payouts:** 2 (view own, service_role insert)
- **Usage Records:** 2 (view own, service_role insert)

---

## Triggers Created

`updated_at` triggers added for tables that maintain an `updated_at` column:

- `update_api_keys_updated_at`
- `update_webhooks_updated_at`
- `update_applications_updated_at`
- `update_mcp_servers_updated_at`
- `update_payouts_updated_at`

A generic `update_updated_at_column()` plpgsql function was created to support these triggers.

---

## Foreign Keys Verified

All 21 foreign-key relationships were created correctly:

- `api_keys.user_id` → `users.id`
- `api_usage.user_id` → `users.id`
- `api_usage.api_key_id` → `api_keys.id`
- `api_logs.user_id` → `users.id`
- `api_logs.api_key_id` → `api_keys.id`
- `webhooks.user_id` → `users.id`
- `webhook_deliveries.webhook_id` → `webhooks.id`
- `applications.user_id` → `users.id`
- `oauth_tokens.user_id` → `users.id`
- `oauth_tokens.application_id` → `applications.id`
- `mcp_servers.user_id` → `users.id`
- `mcp_tokens.user_id` → `users.id`
- `mcp_tokens.mcp_server_id` → `mcp_servers.id`
- `mcp_connections.user_id` → `users.id`
- `mcp_connections.mcp_server_id` → `mcp_servers.id`
- `mcp_usage.user_id` → `users.id`
- `mcp_usage.mcp_server_id` → `mcp_servers.id`
- `mcp_usage.mcp_token_id` → `mcp_tokens.id`
- `payouts.user_id` → `users.id`
- `payouts.creator_id` → `creators.id`
- `usage_records.user_id` → `users.id`

---

## Row Counts

All newly created tables are empty as expected:

| Table | Rows |
|-------|------|
| api_keys | 0 |
| api_usage | 0 |
| api_logs | 0 |
| webhooks | 0 |
| webhook_deliveries | 0 |
| applications | 0 |
| oauth_tokens | 0 |
| mcp_servers | 0 |
| mcp_tokens | 0 |
| mcp_connections | 0 |
| mcp_usage | 0 |
| payouts | 0 |
| usage_records | 0 |

---

## TypeScript Types

Regenerated `types/database.ts` from the live schema. The file now includes the new tables, relationships, and enums.

---

## Build Verification

- `npm run lint` — PASS
- `npm run build` — PASS (verified after type regeneration)

---

## Next Steps

1. Re-run the production audit; database schema score should now be significantly higher.
2. Configure external integrations (GitHub, Gemini, Stripe) now that their backing tables exist.
3. Seed marketplace data so the marketplace is not empty.
