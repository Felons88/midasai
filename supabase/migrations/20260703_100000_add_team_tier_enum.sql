-- Add TEAM tier to subscription_tier_enum
-- Must run in its own transaction before any code uses the new value.

ALTER TYPE subscription_tier_enum ADD VALUE IF NOT EXISTS 'TEAM';
