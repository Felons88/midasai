-- Schema Alignment Migration: Developer Platform Tables
-- Date: 2026-06-20
-- Purpose: Bring live database into alignment with schema.sql and codebase references

-- ============================================================
-- 1. Missing enum types from schema.sql
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'api_key_status_enum') THEN
    CREATE TYPE api_key_status_enum AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webhook_status_enum') THEN
    CREATE TYPE webhook_status_enum AS ENUM ('ACTIVE', 'PAUSED', 'ERROR');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webhook_event_enum') THEN
    CREATE TYPE webhook_event_enum AS ENUM (
      'LISTING_CREATED', 'LISTING_UPDATED', 'LISTING_DELETED',
      'PURCHASE_COMPLETED', 'PURCHASE_REFUNDED', 'REVIEW_CREATED',
      'CREATOR_FOLLOWED', 'SUBSCRIPTION_UPDATED',
      'MCP_CREATED', 'MCP_UPDATED',
      'WORKFLOW_CREATED', 'WORKFLOW_UPDATED',
      'AGENT_CREATED', 'AGENT_UPDATED'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status_enum') THEN
    CREATE TYPE delivery_status_enum AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status_enum') THEN
    CREATE TYPE application_status_enum AS ENUM ('ACTIVE', 'SUSPENDED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mcp_server_status_enum') THEN
    CREATE TYPE mcp_server_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'log_level_enum') THEN
    CREATE TYPE log_level_enum AS ENUM ('INFO', 'WARN', 'ERROR');
  END IF;
END $$;

-- ============================================================
-- 2. Missing developer platform tables from schema.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  key_value TEXT NOT NULL,
  status api_key_status_enum DEFAULT 'ACTIVE',
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  rate_limit INTEGER DEFAULT 1000,
  permissions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  level log_level_enum DEFAULT 'INFO',
  message TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events webhook_event_enum[] NOT NULL,
  status webhook_status_enum DEFAULT 'ACTIVE',
  last_delivery_at TIMESTAMP WITH TIME ZONE,
  total_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE NOT NULL,
  event webhook_event_enum NOT NULL,
  payload JSONB NOT NULL,
  status delivery_status_enum DEFAULT 'PENDING',
  response_code INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  callback_url TEXT,
  webhook_url TEXT,
  client_id TEXT UNIQUE NOT NULL,
  client_secret_hash TEXT NOT NULL,
  client_secret TEXT,
  scopes TEXT[],
  status application_status_enum DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[],
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mcp_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  endpoint TEXT NOT NULL,
  version TEXT NOT NULL,
  status mcp_server_status_enum DEFAULT 'ACTIVE',
  health_check_url TEXT,
  last_health_check TIMESTAMP WITH TIME ZONE,
  total_requests INTEGER DEFAULT 0,
  avg_latency_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mcp_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mcp_server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_value TEXT,
  permissions TEXT[],
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mcp_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mcp_server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  connection_config JSONB,
  status TEXT DEFAULT 'ACTIVE',
  last_connected_at TIMESTAMP WITH TIME ZONE,
  total_requests INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mcp_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mcp_server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  mcp_token_id UUID REFERENCES mcp_tokens(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  request_size INTEGER DEFAULT 0,
  response_size INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. Additional tables required by codebase but not in schema.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'PENDING',
  stripe_payout_id TEXT,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  action TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. Indexes for developer platform tables
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_key_id ON api_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_api_key_id ON api_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_application_id ON oauth_tokens(application_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_user_id ON mcp_servers(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_status ON mcp_servers(status);
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_mcp_server_id ON mcp_tokens(mcp_server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_user_id ON mcp_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_connections_mcp_server_id ON mcp_connections(mcp_server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_connections_user_id ON mcp_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_usage_mcp_server_id ON mcp_usage(mcp_server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_usage_user_id ON mcp_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_resource_type ON usage_records(resource_type);

-- ============================================================
-- 5. Enable Row Level Security
-- ============================================================
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. Row Level Security Policies
-- ============================================================
DO $$
BEGIN
  -- API Keys
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'Users can view own API keys') THEN
    CREATE POLICY "Users can view own API keys" ON api_keys FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'Users can insert own API keys') THEN
    CREATE POLICY "Users can insert own API keys" ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'Users can update own API keys') THEN
    CREATE POLICY "Users can update own API keys" ON api_keys FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'Users can delete own API keys') THEN
    CREATE POLICY "Users can delete own API keys" ON api_keys FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- API Usage
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_usage' AND policyname = 'Users can view own API usage') THEN
    CREATE POLICY "Users can view own API usage" ON api_usage FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_usage' AND policyname = 'Service role can insert API usage') THEN
    CREATE POLICY "Service role can insert API usage" ON api_usage FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;

  -- API Logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_logs' AND policyname = 'Users can view own API logs') THEN
    CREATE POLICY "Users can view own API logs" ON api_logs FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_logs' AND policyname = 'Service role can insert API logs') THEN
    CREATE POLICY "Service role can insert API logs" ON api_logs FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;

  -- Webhooks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhooks' AND policyname = 'Users can view own webhooks') THEN
    CREATE POLICY "Users can view own webhooks" ON webhooks FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhooks' AND policyname = 'Users can insert own webhooks') THEN
    CREATE POLICY "Users can insert own webhooks" ON webhooks FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhooks' AND policyname = 'Users can update own webhooks') THEN
    CREATE POLICY "Users can update own webhooks" ON webhooks FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhooks' AND policyname = 'Users can delete own webhooks') THEN
    CREATE POLICY "Users can delete own webhooks" ON webhooks FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- Webhook Deliveries
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhook_deliveries' AND policyname = 'Users can view own webhook deliveries') THEN
    CREATE POLICY "Users can view own webhook deliveries" ON webhook_deliveries FOR SELECT USING (
      auth.uid() = (SELECT user_id FROM webhooks WHERE webhooks.id = webhook_deliveries.webhook_id)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhook_deliveries' AND policyname = 'Service role can insert webhook deliveries') THEN
    CREATE POLICY "Service role can insert webhook deliveries" ON webhook_deliveries FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;

  -- Applications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Users can view own applications') THEN
    CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Users can insert own applications') THEN
    CREATE POLICY "Users can insert own applications" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Users can update own applications') THEN
    CREATE POLICY "Users can update own applications" ON applications FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- OAuth Tokens
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'oauth_tokens' AND policyname = 'Users can view own OAuth tokens') THEN
    CREATE POLICY "Users can view own OAuth tokens" ON oauth_tokens FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'oauth_tokens' AND policyname = 'Service role can insert OAuth tokens') THEN
    CREATE POLICY "Service role can insert OAuth tokens" ON oauth_tokens FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;

  -- MCP Servers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mcp_servers' AND policyname = 'Users can view own MCP servers') THEN
    CREATE POLICY "Users can view own MCP servers" ON mcp_servers FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mcp_servers' AND policyname = 'Users can insert own MCP servers') THEN
    CREATE POLICY "Users can insert own MCP servers" ON mcp_servers FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mcp_servers' AND policyname = 'Users can update own MCP servers') THEN
    CREATE POLICY "Users can update own MCP servers" ON mcp_servers FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mcp_servers' AND policyname = 'Users can delete own MCP servers') THEN
    CREATE POLICY "Users can delete own MCP servers" ON mcp_servers FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- MCP Tokens
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mcp_tokens' AND policyname = 'Users can view own MCP tokens') THEN
    CREATE POLICY "Users can view own MCP tokens" ON mcp_tokens FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mcp_tokens' AND policyname = 'Service role can insert MCP tokens') THEN
    CREATE POLICY "Service role can insert MCP tokens" ON mcp_tokens FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;

  -- MCP Connections
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mcp_connections' AND policyname = 'Users can view own MCP connections') THEN
    CREATE POLICY "Users can view own MCP connections" ON mcp_connections FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mcp_connections' AND policyname = 'Users can insert own MCP connections') THEN
    CREATE POLICY "Users can insert own MCP connections" ON mcp_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- MCP Usage
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mcp_usage' AND policyname = 'Users can view own MCP usage') THEN
    CREATE POLICY "Users can view own MCP usage" ON mcp_usage FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mcp_usage' AND policyname = 'Service role can insert MCP usage') THEN
    CREATE POLICY "Service role can insert MCP usage" ON mcp_usage FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;

  -- Payouts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payouts' AND policyname = 'Users can view own payouts') THEN
    CREATE POLICY "Users can view own payouts" ON payouts FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payouts' AND policyname = 'Service role can insert payouts') THEN
    CREATE POLICY "Service role can insert payouts" ON payouts FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;

  -- Usage Records
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usage_records' AND policyname = 'Users can view own usage records') THEN
    CREATE POLICY "Users can view own usage records" ON usage_records FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usage_records' AND policyname = 'Service role can insert usage records') THEN
    CREATE POLICY "Service role can insert usage records" ON usage_records FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;
