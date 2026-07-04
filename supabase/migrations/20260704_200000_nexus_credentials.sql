-- Nexus credential vault
-- Stores encrypted API keys / secrets per user per provider

CREATE TABLE IF NOT EXISTS nexus_credentials (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider    text NOT NULL,          -- e.g. "openai", "anthropic", "github"
  name        text NOT NULL,          -- display name, e.g. "OpenAI Production"
  value       text NOT NULL,          -- encrypted at app layer, stored as text
  masked      text GENERATED ALWAYS AS (
    CASE
      WHEN length(value) > 8 THEN repeat('*', length(value) - 4) || right(value, 4)
      ELSE repeat('*', length(value))
    END
  ) STORED,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Only the owning user can see their credentials
ALTER TABLE nexus_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own credentials"
  ON nexus_credentials
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER nexus_credentials_updated_at
  BEFORE UPDATE ON nexus_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for fast lookup by user + provider
CREATE INDEX IF NOT EXISTS idx_nexus_credentials_user_provider
  ON nexus_credentials(user_id, provider);

-- Nexus workflow schedules
CREATE TABLE IF NOT EXISTS nexus_workflow_schedules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES nexus_workflows(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cron_expr   text NOT NULL,          -- e.g. "0 9 * * 1-5"
  timezone    text NOT NULL DEFAULT 'UTC',
  enabled     boolean NOT NULL DEFAULT true,
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE nexus_workflow_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own schedules"
  ON nexus_workflow_schedules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nexus_schedules_workflow
  ON nexus_workflow_schedules(workflow_id);

-- Nexus webhook tokens (public webhook triggers)
CREATE TABLE IF NOT EXISTS nexus_webhook_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES nexus_workflows(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  secret      text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  enabled     boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE nexus_webhook_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own webhook tokens"
  ON nexus_webhook_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nexus_webhook_tokens_token
  ON nexus_webhook_tokens(token);
