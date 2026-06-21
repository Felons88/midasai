-- Replaces create_webhook with a limit-aware version.
-- Reads the user's max_webhooks from feature_entitlements (populated by Stripe webhook).
-- Falls back to FREE limit (1) if no entitlement row exists.
-- Also removes the p_secret parameter — secrets are now generated server-side only.

CREATE OR REPLACE FUNCTION public.create_webhook(
  p_user_id uuid,
  p_name text,
  p_url text,
  p_events text[],
  p_secret text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_webhooks integer;
  v_current_count integer;
  v_new_id uuid;
BEGIN
  -- Get plan limit from entitlements (-1 = unlimited)
  SELECT COALESCE(max_webhooks, 1)
  INTO v_max_webhooks
  FROM feature_entitlements
  WHERE user_id = p_user_id;

  -- Default to FREE limit if no row found
  IF NOT FOUND THEN
    v_max_webhooks := 1;
  END IF;

  -- Count existing webhooks
  SELECT COUNT(*) INTO v_current_count
  FROM webhooks
  WHERE user_id = p_user_id;

  -- Enforce limit (-1 = unlimited)
  IF v_max_webhooks <> -1 AND v_current_count >= v_max_webhooks THEN
    RAISE EXCEPTION 'LIMIT_EXCEEDED: % of % webhooks used', v_current_count, v_max_webhooks
      USING ERRCODE = 'P0001';
  END IF;

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
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_webhook(uuid, text, text, text[], text) TO authenticated;
