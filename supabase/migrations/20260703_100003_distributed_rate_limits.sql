-- Distributed rate limit state (Redis alternative for Vercel/serverless)

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_key ON rate_limit_buckets(key);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_reset ON rate_limit_buckets(reset_at);

-- Atomic rate limit check using advisory locks
CREATE OR REPLACE FUNCTION check_rate_limit_bucket(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER DEFAULT 3600
)
RETURNS TABLE(allowed BOOLEAN, limit_value INTEGER, remaining INTEGER, reset_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE;
  v_reset_at TIMESTAMP WITH TIME ZONE;
  v_count INTEGER;
BEGIN
  v_now := NOW();

  -- Clean expired bucket
  DELETE FROM rate_limit_buckets
  WHERE rate_limit_buckets.key = p_key AND rate_limit_buckets.reset_at <= v_now;

  -- Get or create bucket
  INSERT INTO rate_limit_buckets (key, count, reset_at)
  VALUES (p_key, 1, v_now + (p_window_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (key)
  DO UPDATE SET
    count = rate_limit_buckets.count + 1,
    updated_at = v_now
  RETURNING rate_limit_buckets.count, rate_limit_buckets.reset_at
  INTO v_count, v_reset_at;

  IF v_count > p_limit THEN
    RETURN QUERY SELECT FALSE, p_limit, GREATEST(0, p_limit - v_count), v_reset_at;
  ELSE
    RETURN QUERY SELECT TRUE, p_limit, GREATEST(0, p_limit - v_count), v_reset_at;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION check_rate_limit_bucket(TEXT, INTEGER, INTEGER) FROM PUBLIC;

-- Periodic cleanup of expired buckets
CREATE OR REPLACE FUNCTION cleanup_rate_limit_buckets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limit_buckets WHERE reset_at <= NOW();
END;
$$;

REVOKE EXECUTE ON FUNCTION cleanup_rate_limit_buckets() FROM PUBLIC;

ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- No user policies; rate limit state is managed by service role
