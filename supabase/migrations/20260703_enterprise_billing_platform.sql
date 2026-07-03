-- Enterprise Billing, Credit Engine & Subscription Platform
-- Migration: Phase 1 — Database schema
-- Created: 2026-07-03

-- ---------------------------------------------------------------------------
-- 1. Plan definitions (database-driven configuration)
-- PRECONDITION: migration 20260703_100000_add_team_tier_enum.sql must have run first.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS plan_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier subscription_tier_enum NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE plan_definitions IS 'Central source of truth for plan pricing and base configuration.';

-- ---------------------------------------------------------------------------
-- 3. Plan feature matrix (entitlements)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS plan_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES plan_definitions(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  limit_value INTEGER, -- -1 means unlimited, NULL means not applicable
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, feature_key)
);

COMMENT ON TABLE plan_features IS 'Feature entitlement matrix per plan. Limits are configurable without code changes.';

CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_key ON plan_features(feature_key);

-- ---------------------------------------------------------------------------
-- 4. Organizations (Team / Enterprise)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plan_definitions(id) ON DELETE SET NULL,
  billing_email TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE organizations IS 'Teams and enterprise accounts with shared billing and credits.';

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

COMMENT ON TABLE organization_members IS 'Membership linking users to organizations.';

CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

-- ---------------------------------------------------------------------------
-- 5. Credit system
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS credit_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  purchased_credits INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  lifetime_used INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE credit_balances IS 'Current credit balances per user.';

CREATE INDEX IF NOT EXISTS idx_credit_balances_user_id ON credit_balances(user_id);

CREATE TABLE IF NOT EXISTS organization_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  purchased_credits INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  lifetime_used INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE organization_credits IS 'Current credit balances per organization.';

CREATE INDEX IF NOT EXISTS idx_organization_credits_org_id ON organization_credits(organization_id);

CREATE TYPE credit_transaction_type_enum AS ENUM (
  'monthly_allocation',
  'purchase',
  'reservation',
  'capture',
  'release',
  'refund',
  'admin_adjustment',
  'bonus',
  'transfer'
);

CREATE TYPE credit_transaction_status_enum AS ENUM (
  'pending',
  'completed',
  'failed',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  type credit_transaction_type_enum NOT NULL,
  status credit_transaction_status_enum NOT NULL DEFAULT 'completed',
  amount INTEGER NOT NULL, -- positive = credit added, negative = debited
  balance_after INTEGER,
  reference_id TEXT, -- Stripe payment intent, reservation id, etc.
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE credit_transactions IS 'Immutable ledger of all credit changes.';

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_org_id ON credit_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference ON credit_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

CREATE TYPE credit_reservation_status_enum AS ENUM (
  'reserved',
  'captured',
  'partially_refunded',
  'released'
);

CREATE TABLE IF NOT EXISTS credit_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  operation_id TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  amount INTEGER NOT NULL,
  captured_amount INTEGER NOT NULL DEFAULT 0,
  refunded_amount INTEGER NOT NULL DEFAULT 0,
  status credit_reservation_status_enum NOT NULL DEFAULT 'reserved',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE credit_reservations IS 'Pending credit reservations for transaction-based billing.';

CREATE INDEX IF NOT EXISTS idx_credit_reservations_user_id ON credit_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_reservations_org_id ON credit_reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_credit_reservations_operation ON credit_reservations(operation_id);
CREATE INDEX IF NOT EXISTS idx_credit_reservations_status ON credit_reservations(status);
CREATE INDEX IF NOT EXISTS idx_credit_reservations_expires ON credit_reservations(expires_at);

-- ---------------------------------------------------------------------------
-- 6. Usage tracking
-- ---------------------------------------------------------------------------

CREATE TYPE usage_event_status_enum AS ENUM (
  'success',
  'partial',
  'failure'
);

CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  feature_key TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  model TEXT,
  provider TEXT,
  credits_reserved INTEGER NOT NULL DEFAULT 0,
  credits_charged INTEGER NOT NULL DEFAULT 0,
  credits_refunded INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  status usage_event_status_enum NOT NULL DEFAULT 'success',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE usage_events IS 'Every AI operation, marketplace search, and metered feature.';

CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_org_id ON usage_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_feature ON usage_events(feature_key);
CREATE INDEX IF NOT EXISTS idx_usage_events_operation ON usage_events(operation_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at);

-- ---------------------------------------------------------------------------
-- 7. Billing records
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  amount INTEGER NOT NULL DEFAULT 0, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE billing_invoices IS 'Mirror of Stripe invoices for embedded billing history.';

CREATE INDEX IF NOT EXISTS idx_billing_invoices_user_id ON billing_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_org_id ON billing_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_stripe ON billing_invoices(stripe_invoice_id);

CREATE TABLE IF NOT EXISTS credit_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL,
  price INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE credit_packs IS 'Pre-defined credit packs available for purchase.';

CREATE INDEX IF NOT EXISTS idx_credit_packs_active ON credit_packs(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_packs_name ON credit_packs(name);

CREATE TABLE IF NOT EXISTS credit_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE credit_adjustments IS 'Admin-initiated credit adjustments with audit trail.';

CREATE INDEX IF NOT EXISTS idx_credit_adjustments_user_id ON credit_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_adjustments_org_id ON credit_adjustments(organization_id);
CREATE INDEX IF NOT EXISTS idx_credit_adjustments_admin ON credit_adjustments(admin_id);

-- ---------------------------------------------------------------------------
-- 8. Update feature_entitlements to reference plan_definitions
-- ---------------------------------------------------------------------------

ALTER TABLE feature_entitlements
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plan_definitions(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 9. Helper functions
-- ---------------------------------------------------------------------------

-- Reset monthly credits on first of month
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE credit_balances
  SET monthly_credits = 0,
      total_used = 0,
      reset_at = NOW(),
      updated_at = NOW()
  WHERE reset_at IS NULL OR reset_at < date_trunc('month', NOW());

  UPDATE organization_credits
  SET monthly_credits = 0,
      total_used = 0,
      reset_at = NOW(),
      updated_at = NOW()
  WHERE reset_at IS NULL OR reset_at < date_trunc('month', NOW());
END;
$$;

-- Revoke public execute on trigger functions
REVOKE EXECUTE ON FUNCTION reset_monthly_credits() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 10. Seed default plan definitions
-- ---------------------------------------------------------------------------

INSERT INTO plan_definitions (tier, name, price_monthly, price_yearly, metadata)
VALUES
  ('FREE', 'Free', 0, 0, '{"description": "For individuals exploring the platform"}'::jsonb),
  ('PRO', 'Pro', 2900, 29000, '{"description": "For serious creators and professionals"}'::jsonb),
  ('TEAM', 'Team', 7900, 79000, '{"description": "For teams building together"}'::jsonb),
  ('ENTERPRISE', 'Enterprise', 0, 0, '{"description": "Custom enterprise contracts", "contact_sales": true}'::jsonb)
ON CONFLICT (tier) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Seed default features per plan
WITH plans AS (SELECT id, tier FROM plan_definitions)
INSERT INTO plan_features (plan_id, feature_key, enabled, limit_value, metadata)
SELECT p.id, f.feature_key, f.enabled, f.limit_value, f.metadata
FROM plans p
CROSS JOIN LATERAL (
  VALUES
    ('ai_chat', true, 50, '{}'::jsonb),
    ('ai_architect', true, 5, '{}'::jsonb),
    ('ai_workflow', true, 10, '{}'::jsonb),
    ('ai_search', true, 100, '{}'::jsonb),
    ('ai_upload', false, 0, '{}'::jsonb),
    ('listings', true, 3, '{}'::jsonb),
    ('webhooks', true, 1, '{}'::jsonb),
    ('api_keys', true, 2, '{}'::jsonb),
    ('mcp_servers', true, 1, '{}'::jsonb),
    ('applications', true, 1, '{}'::jsonb),
    ('downloads_monthly', true, 10, '{}'::jsonb),
    ('storage_gb', true, 1, '{}'::jsonb),
    ('api_rate_limit', true, 100, '{}'::jsonb),
    ('featured_listings', true, 0, '{}'::jsonb),
    ('creator_verification', false, 0, '{}'::jsonb),
    ('custom_domain', false, 0, '{}'::jsonb),
    ('analytics_tier', true, 0, '{}'::jsonb),
    ('support_tier', true, 0, '{}'::jsonb),
    ('platform_fee_pct', true, 15, '{}'::jsonb),
    ('team_members', false, 0, '{}'::jsonb)
) AS f(feature_key, enabled, limit_value, metadata)
WHERE p.tier = 'FREE'
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  limit_value = EXCLUDED.limit_value,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

WITH plans AS (SELECT id, tier FROM plan_definitions)
INSERT INTO plan_features (plan_id, feature_key, enabled, limit_value, metadata)
SELECT p.id, f.feature_key, f.enabled, f.limit_value, f.metadata
FROM plans p
CROSS JOIN LATERAL (
  VALUES
    ('ai_chat', true, 500, '{}'::jsonb),
    ('ai_architect', true, 100, '{}'::jsonb),
    ('ai_workflow', true, 200, '{}'::jsonb),
    ('ai_search', true, 1000, '{}'::jsonb),
    ('ai_upload', true, -1, '{}'::jsonb),
    ('listings', true, -1, '{}'::jsonb),
    ('webhooks', true, 10, '{}'::jsonb),
    ('api_keys', true, 10, '{}'::jsonb),
    ('mcp_servers', true, 5, '{}'::jsonb),
    ('applications', true, 5, '{}'::jsonb),
    ('downloads_monthly', true, -1, '{}'::jsonb),
    ('storage_gb', true, 100, '{}'::jsonb),
    ('api_rate_limit', true, 2000, '{}'::jsonb),
    ('featured_listings', true, 5, '{}'::jsonb),
    ('creator_verification', true, -1, '{}'::jsonb),
    ('custom_domain', true, -1, '{}'::jsonb),
    ('analytics_tier', true, 1, '{}'::jsonb),
    ('support_tier', true, 1, '{}'::jsonb),
    ('platform_fee_pct', true, 8, '{}'::jsonb),
    ('team_members', false, 0, '{}'::jsonb)
) AS f(feature_key, enabled, limit_value, metadata)
WHERE p.tier = 'PRO'
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  limit_value = EXCLUDED.limit_value,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

WITH plans AS (SELECT id, tier FROM plan_definitions)
INSERT INTO plan_features (plan_id, feature_key, enabled, limit_value, metadata)
SELECT p.id, f.feature_key, f.enabled, f.limit_value, f.metadata
FROM plans p
CROSS JOIN LATERAL (
  VALUES
    ('ai_chat', true, 2000, '{}'::jsonb),
    ('ai_architect', true, 500, '{}'::jsonb),
    ('ai_workflow', true, 1000, '{}'::jsonb),
    ('ai_search', true, 5000, '{}'::jsonb),
    ('ai_upload', true, -1, '{}'::jsonb),
    ('listings', true, -1, '{}'::jsonb),
    ('webhooks', true, 50, '{}'::jsonb),
    ('api_keys', true, 50, '{}'::jsonb),
    ('mcp_servers', true, 25, '{}'::jsonb),
    ('applications', true, 25, '{}'::jsonb),
    ('downloads_monthly', true, -1, '{}'::jsonb),
    ('storage_gb', true, 500, '{}'::jsonb),
    ('api_rate_limit', true, 10000, '{}'::jsonb),
    ('featured_listings', true, -1, '{}'::jsonb),
    ('creator_verification', true, -1, '{}'::jsonb),
    ('custom_domain', true, -1, '{}'::jsonb),
    ('analytics_tier', true, 2, '{}'::jsonb),
    ('support_tier', true, 2, '{}'::jsonb),
    ('platform_fee_pct', true, 5, '{}'::jsonb),
    ('team_members', true, 10, '{}'::jsonb)
) AS f(feature_key, enabled, limit_value, metadata)
WHERE p.tier = 'TEAM'
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  limit_value = EXCLUDED.limit_value,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

WITH plans AS (SELECT id, tier FROM plan_definitions)
INSERT INTO plan_features (plan_id, feature_key, enabled, limit_value, metadata)
SELECT p.id, f.feature_key, f.enabled, f.limit_value, f.metadata
FROM plans p
CROSS JOIN LATERAL (
  VALUES
    ('ai_chat', true, -1, '{}'::jsonb),
    ('ai_architect', true, -1, '{}'::jsonb),
    ('ai_workflow', true, -1, '{}'::jsonb),
    ('ai_search', true, -1, '{}'::jsonb),
    ('ai_upload', true, -1, '{}'::jsonb),
    ('listings', true, -1, '{}'::jsonb),
    ('webhooks', true, -1, '{}'::jsonb),
    ('api_keys', true, -1, '{}'::jsonb),
    ('mcp_servers', true, -1, '{}'::jsonb),
    ('applications', true, -1, '{}'::jsonb),
    ('downloads_monthly', true, -1, '{}'::jsonb),
    ('storage_gb', true, -1, '{}'::jsonb),
    ('api_rate_limit', true, -1, '{}'::jsonb),
    ('featured_listings', true, -1, '{}'::jsonb),
    ('creator_verification', true, -1, '{}'::jsonb),
    ('custom_domain', true, -1, '{}'::jsonb),
    ('analytics_tier', true, 3, '{}'::jsonb),
    ('support_tier', true, 3, '{}'::jsonb),
    ('platform_fee_pct', true, 3, '{}'::jsonb),
    ('team_members', true, -1, '{}'::jsonb)
) AS f(feature_key, enabled, limit_value, metadata)
WHERE p.tier = 'ENTERPRISE'
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  limit_value = EXCLUDED.limit_value,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 11. Seed default credit packs
-- ---------------------------------------------------------------------------

INSERT INTO credit_packs (name, description, credits, price, currency, metadata)
VALUES
  ('Starter Pack', '500 AI credits', 500, 500, 'usd', '{"popular": false}'::jsonb),
  ('Pro Pack', '2,500 AI credits — best value', 2500, 2000, 'usd', '{"popular": true}'::jsonb),
  ('Enterprise Pack', '10,000 AI credits', 10000, 7000, 'usd', '{"popular": false}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 12. RLS Policies
-- ---------------------------------------------------------------------------

ALTER TABLE plan_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_adjustments ENABLE ROW LEVEL SECURITY;

-- Plan definitions: public read
CREATE POLICY "plan_definitions_public_read" ON plan_definitions
  FOR SELECT TO authenticated, anon USING (true);

-- Plan features: public read
CREATE POLICY "plan_features_public_read" ON plan_features
  FOR SELECT TO authenticated, anon USING (true);

-- Credit packs: public read
CREATE POLICY "credit_packs_public_read" ON credit_packs
  FOR SELECT TO authenticated, anon USING (is_active = true);

-- Organizations: members can read their own org
CREATE POLICY "organizations_members_read" ON organizations
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id AND user_id = auth.uid()
    )
  );

-- Organizations: owners can update
CREATE POLICY "organizations_owner_update" ON organizations
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Organization members: members can read
CREATE POLICY "organization_members_read" ON organization_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid()
    )
  );

-- Organization members: owner/admin can manage
CREATE POLICY "organization_members_owner_manage" ON organization_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Credit balances: users can read their own
CREATE POLICY "credit_balances_user_read" ON credit_balances
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Organization credits: members can read
CREATE POLICY "organization_credits_member_read" ON organization_credits
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_credits.organization_id AND user_id = auth.uid()
    )
  );

-- Credit transactions: users can read their own
CREATE POLICY "credit_transactions_user_read" ON credit_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Credit reservations: users can read their own
CREATE POLICY "credit_reservations_user_read" ON credit_reservations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Usage events: users can read their own
CREATE POLICY "usage_events_user_read" ON usage_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Billing invoices: users can read their own
CREATE POLICY "billing_invoices_user_read" ON billing_invoices
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Credit adjustments: users can read their own
CREATE POLICY "credit_adjustments_user_read" ON credit_adjustments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Admin policies: service role bypass via SECURITY DEFINER functions
-- No direct write policies for users; credit changes are made by backend service role.
