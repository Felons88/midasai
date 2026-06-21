CREATE OR REPLACE FUNCTION public.create_webhook(
  p_user_id uuid,
  p_name text,
  p_url text,
  p_events text[],
  p_secret text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO webhooks (user_id, name, url, events, secret, status, total_deliveries, failed_deliveries)
  VALUES (
    p_user_id,
    p_name,
    p_url,
    p_events::webhook_event_enum[],
    p_secret,
    'ACTIVE',
    0,
    0
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_webhook(uuid, text, text, text[], text) TO authenticated;
