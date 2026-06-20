-- Schema Alignment: updated_at triggers for developer platform tables
-- Creates the generic update_updated_at_column() function if needed.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  -- api_keys
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public' AND event_object_table = 'api_keys' AND trigger_name = 'update_api_keys_updated_at'
  ) THEN
    CREATE TRIGGER update_api_keys_updated_at
      BEFORE UPDATE ON api_keys
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- webhooks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public' AND event_object_table = 'webhooks' AND trigger_name = 'update_webhooks_updated_at'
  ) THEN
    CREATE TRIGGER update_webhooks_updated_at
      BEFORE UPDATE ON webhooks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- applications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public' AND event_object_table = 'applications' AND trigger_name = 'update_applications_updated_at'
  ) THEN
    CREATE TRIGGER update_applications_updated_at
      BEFORE UPDATE ON applications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- mcp_servers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public' AND event_object_table = 'mcp_servers' AND trigger_name = 'update_mcp_servers_updated_at'
  ) THEN
    CREATE TRIGGER update_mcp_servers_updated_at
      BEFORE UPDATE ON mcp_servers
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- payouts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public' AND event_object_table = 'payouts' AND trigger_name = 'update_payouts_updated_at'
  ) THEN
    CREATE TRIGGER update_payouts_updated_at
      BEFORE UPDATE ON payouts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
