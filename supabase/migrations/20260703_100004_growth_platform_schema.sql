-- Growth, Monetization & Upgrade Experience Platform
-- Phase 2+ schema additions

-- ---------------------------------------------------------------------------
-- 1. Dismissed prompts (prevents spam)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS dismissed_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_key TEXT NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  UNIQUE(user_id, prompt_key)
);

CREATE INDEX IF NOT EXISTS idx_dismissed_prompts_user_id ON dismissed_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_dismissed_prompts_expires ON dismissed_prompts(expires_at);

COMMENT ON TABLE dismissed_prompts IS 'Tracks user dismissals of upgrade/credit prompts for anti-spam.';

-- ---------------------------------------------------------------------------
-- 2. Upgrade events analytics
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS upgrade_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'trigger_threshold',
    'prompt_shown',
    'prompt_dismissed',
    'prompt_accepted',
    'feature_locked',
    'plan_changed',
    'payment_failed',
    'payment_recovered'
  )),
  trigger TEXT,
  current_tier TEXT,
  recommended_tier TEXT,
  converted BOOLEAN DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upgrade_events_user_id ON upgrade_events(user_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_events_org_id ON upgrade_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_events_type ON upgrade_events(event_type);
CREATE INDEX IF NOT EXISTS idx_upgrade_events_created_at ON upgrade_events(created_at);

COMMENT ON TABLE upgrade_events IS 'Tracks every upgrade-related event for optimization.';

-- ---------------------------------------------------------------------------
-- 3. Feature usage summary (for recommendations & forecasting)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feature_usage_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly')),
  count INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_key, period)
);

CREATE INDEX IF NOT EXISTS idx_feature_usage_summary_user_id ON feature_usage_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_summary_feature ON feature_usage_summary(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_usage_summary_period ON feature_usage_summary(period);

COMMENT ON TABLE feature_usage_summary IS 'Aggregated feature usage for recommendations and forecasts.';

-- ---------------------------------------------------------------------------
-- 4. Reward programs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reward_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE reward_programs IS 'Configuration for reward programs (daily login, streaks, referrals, etc.).';

CREATE TABLE IF NOT EXISTS reward_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  program_id UUID REFERENCES reward_programs(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_history_user_id ON reward_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_history_org_id ON reward_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_reward_history_program_id ON reward_history(program_id);

COMMENT ON TABLE reward_history IS 'Record of all reward credits granted.';

-- ---------------------------------------------------------------------------
-- 5. Usage predictions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS usage_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL,
  value JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_predictions_user_id ON usage_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_predictions_type ON usage_predictions(prediction_type);

COMMENT ON TABLE usage_predictions IS 'Usage forecasts and plan recommendations.';

-- ---------------------------------------------------------------------------
-- 6. Plan recommendations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS plan_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  recommended_tier TEXT NOT NULL,
  score INTEGER NOT NULL,
  reasons JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_recommendations_user_id ON plan_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_recommendations_org_id ON plan_recommendations(organization_id);

COMMENT ON TABLE plan_recommendations IS 'Recommendation engine output for upgrade prompts.';

-- ---------------------------------------------------------------------------
-- 7. Organization wallets
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organization_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  total_credits INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_wallets_org_id ON organization_wallets(organization_id);

COMMENT ON TABLE organization_wallets IS 'Aggregated organization wallet summary.';

-- ---------------------------------------------------------------------------
-- 8. Referral rewards
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  amount INTEGER,
  source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referee ON referral_rewards(referee_id);

COMMENT ON TABLE referral_rewards IS 'Referral program reward tracking.';

-- ---------------------------------------------------------------------------
-- 9. Credit refunds
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS credit_refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES credit_reservations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'full' CHECK (status IN ('full', 'partial', 'none')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_refunds_reservation ON credit_refunds(reservation_id);
CREATE INDEX IF NOT EXISTS idx_credit_refunds_user_id ON credit_refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_refunds_org_id ON credit_refunds(organization_id);

COMMENT ON TABLE credit_refunds IS 'Detailed credit refund records for post-operation UX.';

-- ---------------------------------------------------------------------------
-- 10. Promotion campaigns
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS promotion_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_to TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_code ON promotion_campaigns(code);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_active ON promotion_campaigns(is_active);

COMMENT ON TABLE promotion_campaigns IS 'Bonus credit promotion campaigns.';

CREATE TABLE IF NOT EXISTS promotion_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES promotion_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_promotion_redemptions_campaign ON promotion_redemptions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_promotion_redemptions_user ON promotion_redemptions(user_id);

-- ---------------------------------------------------------------------------
-- 11. RLS Policies
-- ---------------------------------------------------------------------------

ALTER TABLE dismissed_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dismissed_prompts_user_own" ON dismissed_prompts
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "upgrade_events_user_read" ON upgrade_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "feature_usage_summary_user_own" ON feature_usage_summary
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "reward_programs_public_read" ON reward_programs
  FOR SELECT TO authenticated, anon USING (is_active = true);

CREATE POLICY "reward_history_user_read" ON reward_history
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "usage_predictions_user_read" ON usage_predictions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "plan_recommendations_user_read" ON plan_recommendations
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "organization_wallets_member_read" ON organization_wallets
  FOR SELECT TO authenticated USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "referral_rewards_user_read" ON referral_rewards
  FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE POLICY "credit_refunds_user_read" ON credit_refunds
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "promotion_campaigns_public_read" ON promotion_campaigns
  FOR SELECT TO authenticated, anon USING (is_active = true);

CREATE POLICY "promotion_redemptions_user_read" ON promotion_redemptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 12. Seed reward programs
-- ---------------------------------------------------------------------------

INSERT INTO reward_programs (key, name, description, rules)
VALUES
  ('daily_login', 'Daily Login Bonus', 'Claim bonus credits every day you log in.', '{"base": 10, "streak_multiplier": 5, "max_streak": 7}'::jsonb),
  ('weekly_streak', 'Weekly Streak', 'Bonus for 7-day login streak.', '{"credits": 50}'::jsonb),
  ('monthly_streak', 'Monthly Streak', 'Bonus for 30-day login streak.', '{"credits": 200}'::jsonb),
  ('referral', 'Referral Reward', 'Credits for referring new users.', '{"referrer": 100, "referee": 50}'::jsonb),
  ('first_listing', 'First Listing', 'Credits for publishing your first listing.', '{"credits": 25}'::jsonb),
  ('first_download', 'First Download', 'Credits for your first download.', '{"credits": 10}'::jsonb),
  ('power_user', 'Power User', 'Credits for heavy platform usage.', '{"threshold": 100, "credits": 50}'::jsonb),
  ('admin_grant', 'Administrative Grant', 'Manual credit grant by admin.', '{}'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 13. Helper function: summarize feature usage
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION summarize_feature_usage(
  p_user_id UUID,
  p_feature_key TEXT,
  p_period TEXT DEFAULT 'monthly'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start TIMESTAMP WITH TIME ZONE;
  v_count INTEGER;
  v_credits INTEGER;
BEGIN
  IF p_period = 'daily' THEN
    v_start := NOW() - INTERVAL '1 day';
  ELSIF p_period = 'weekly' THEN
    v_start := NOW() - INTERVAL '7 days';
  ELSE
    v_start := NOW() - INTERVAL '30 days';
  END IF;

  SELECT COUNT(*), COALESCE(SUM(credits_charged), 0)
  INTO v_count, v_credits
  FROM usage_events
  WHERE user_id = p_user_id
    AND feature_key = p_feature_key
    AND created_at >= v_start;

  INSERT INTO feature_usage_summary (user_id, feature_key, period, count, credits_used, updated_at)
  VALUES (p_user_id, p_feature_key, p_period, v_count, v_credits, NOW())
  ON CONFLICT (user_id, feature_key, period)
  DO UPDATE SET
    count = EXCLUDED.count,
    credits_used = EXCLUDED.credits_used,
    updated_at = NOW();
END;
$$;

REVOKE EXECUTE ON FUNCTION summarize_feature_usage(UUID, TEXT, TEXT) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 14. Helper function: record upgrade event
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_upgrade_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_trigger TEXT,
  p_current_tier TEXT,
  p_recommended_tier TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO upgrade_events (user_id, event_type, trigger, current_tier, recommended_tier, metadata)
  VALUES (p_user_id, p_event_type, p_trigger, p_current_tier, p_recommended_tier, p_metadata);
END;
$$;

REVOKE EXECUTE ON FUNCTION record_upgrade_event(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
