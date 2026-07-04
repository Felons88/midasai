-- Nexus E2E audit fixes
-- 1. Add trigger column to executions (for webhook/schedule/manual tracking)
-- 2. Add duration_ms if missing (safe IF NOT EXISTS)
-- 3. Ensure node_results column exists as JSONB

ALTER TABLE nexus_workflow_executions
  ADD COLUMN IF NOT EXISTS trigger TEXT DEFAULT 'manual';

-- Ensure duration_ms exists (was in original schema but confirming)
ALTER TABLE nexus_workflow_executions
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

-- Index for filtering by trigger type
CREATE INDEX IF NOT EXISTS idx_nexus_executions_trigger
  ON nexus_workflow_executions(trigger);

-- Ensure nexus_connections has a unique constraint for upsert (user_id, name)
-- NexusService.upsertConnection uses onConflict: "user_id,name"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'nexus_connections_user_id_name_key'
  ) THEN
    ALTER TABLE nexus_connections ADD CONSTRAINT nexus_connections_user_id_name_key UNIQUE (user_id, name);
  END IF;
END$$;
