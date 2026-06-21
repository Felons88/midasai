-- Schedule AI notification engine to run every 6 hours
-- Uses pg_cron + net extension to call the edge function

SELECT cron.schedule(
  'ai-notifications-batch',
  '0 */6 * * *',  -- every 6 hours
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/ai-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
