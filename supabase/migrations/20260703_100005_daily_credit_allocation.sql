-- Daily credit allocation with monthly cap and no stacking

ALTER TABLE credit_balances
ADD COLUMN IF NOT EXISTS monthly_cap INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_allowance INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_allocation_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE organization_credits
ADD COLUMN IF NOT EXISTS monthly_cap INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_allowance INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_allocation_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN credit_balances.monthly_cap IS 'Maximum credits that can be allocated in the current monthly period.';
COMMENT ON COLUMN credit_balances.daily_allowance IS 'Credits to allocate each day, capped by monthly_cap remaining.';
COMMENT ON COLUMN credit_balances.last_daily_allocation_at IS 'Last day daily credits were allocated.';

-- ---------------------------------------------------------------------------
-- Ensure user daily credits
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION ensure_user_daily_credits(
  p_user_id UUID,
  p_monthly_cap INTEGER,
  p_daily_allowance INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  row_record RECORD;
  top_up INTEGER := 0;
  now_ts TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  SELECT * INTO row_record FROM credit_balances WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO credit_balances (
      user_id,
      monthly_credits,
      monthly_cap,
      daily_allowance,
      last_daily_allocation_at,
      reset_at,
      total_used,
      lifetime_used,
      purchased_credits,
      bonus_credits
    ) VALUES (
      p_user_id,
      LEAST(p_daily_allowance, p_monthly_cap),
      p_monthly_cap,
      p_daily_allowance,
      now_ts,
      now_ts,
      0,
      0,
      0,
      0
    )
    RETURNING monthly_credits INTO top_up;
    RETURN top_up;
  END IF;

  -- Monthly reset: if reset_at is from a previous month, clear monthly budget
  IF row_record.reset_at IS NULL OR DATE_TRUNC('month', row_record.reset_at) < DATE_TRUNC('month', now_ts) THEN
    row_record.total_used := 0;
    row_record.monthly_credits := 0;
    row_record.reset_at := now_ts;
  END IF;

  -- Daily allocation: only if not already allocated today
  IF row_record.last_daily_allocation_at IS NULL OR DATE(row_record.last_daily_allocation_at) < DATE(now_ts) THEN
    top_up := GREATEST(0, LEAST(
      p_daily_allowance - row_record.monthly_credits,
      p_monthly_cap - row_record.total_used
    ));

    IF top_up > 0 THEN
      row_record.monthly_credits := row_record.monthly_credits + top_up;
    END IF;

    row_record.last_daily_allocation_at := now_ts;
  END IF;

  UPDATE credit_balances
  SET
    monthly_credits = row_record.monthly_credits,
    total_used = row_record.total_used,
    monthly_cap = p_monthly_cap,
    daily_allowance = p_daily_allowance,
    last_daily_allocation_at = row_record.last_daily_allocation_at,
    reset_at = row_record.reset_at,
    updated_at = now_ts
  WHERE user_id = p_user_id;

  RETURN row_record.monthly_credits;
END;
$$;

-- ---------------------------------------------------------------------------
-- Ensure organization daily credits
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION ensure_org_daily_credits(
  p_organization_id UUID,
  p_monthly_cap INTEGER,
  p_daily_allowance INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  row_record RECORD;
  top_up INTEGER := 0;
  now_ts TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  SELECT * INTO row_record FROM organization_credits WHERE organization_id = p_organization_id;

  IF NOT FOUND THEN
    INSERT INTO organization_credits (
      organization_id,
      monthly_credits,
      monthly_cap,
      daily_allowance,
      last_daily_allocation_at,
      reset_at,
      total_used,
      lifetime_used,
      purchased_credits,
      bonus_credits
    ) VALUES (
      p_organization_id,
      LEAST(p_daily_allowance, p_monthly_cap),
      p_monthly_cap,
      p_daily_allowance,
      now_ts,
      now_ts,
      0,
      0,
      0,
      0
    )
    RETURNING monthly_credits INTO top_up;
    RETURN top_up;
  END IF;

  IF row_record.reset_at IS NULL OR DATE_TRUNC('month', row_record.reset_at) < DATE_TRUNC('month', now_ts) THEN
    row_record.total_used := 0;
    row_record.monthly_credits := 0;
    row_record.reset_at := now_ts;
  END IF;

  IF row_record.last_daily_allocation_at IS NULL OR DATE(row_record.last_daily_allocation_at) < DATE(now_ts) THEN
    top_up := GREATEST(0, LEAST(
      p_daily_allowance - row_record.monthly_credits,
      p_monthly_cap - row_record.total_used
    ));

    IF top_up > 0 THEN
      row_record.monthly_credits := row_record.monthly_credits + top_up;
    END IF;

    row_record.last_daily_allocation_at := now_ts;
  END IF;

  UPDATE organization_credits
  SET
    monthly_credits = row_record.monthly_credits,
    total_used = row_record.total_used,
    monthly_cap = p_monthly_cap,
    daily_allowance = p_daily_allowance,
    last_daily_allocation_at = row_record.last_daily_allocation_at,
    reset_at = row_record.reset_at,
    updated_at = now_ts
  WHERE organization_id = p_organization_id;

  RETURN row_record.monthly_credits;
END;
$$;

-- ---------------------------------------------------------------------------
-- Security
-- ---------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION ensure_user_daily_credits(UUID, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION ensure_org_daily_credits(UUID, INTEGER, INTEGER) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Backfill existing users with a free daily allowance
-- ---------------------------------------------------------------------------

UPDATE credit_balances
SET
  monthly_cap = GREATEST(monthly_cap, 600),
  daily_allowance = GREATEST(daily_allowance, 150),
  last_daily_allocation_at = COALESCE(last_daily_allocation_at, reset_at, NOW()),
  monthly_credits = CASE
    WHEN monthly_credits = 0 AND total_used = 0 THEN 150
    ELSE monthly_credits
  END,
  reset_at = COALESCE(reset_at, NOW())
WHERE monthly_cap = 0 AND daily_allowance = 0;

UPDATE organization_credits
SET
  monthly_cap = GREATEST(monthly_cap, 600),
  daily_allowance = GREATEST(daily_allowance, 150),
  last_daily_allocation_at = COALESCE(last_daily_allocation_at, reset_at, NOW()),
  monthly_credits = CASE
    WHEN monthly_credits = 0 AND total_used = 0 THEN 150
    ELSE monthly_credits
  END,
  reset_at = COALESCE(reset_at, NOW())
WHERE monthly_cap = 0 AND daily_allowance = 0;
