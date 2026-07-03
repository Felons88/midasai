-- Update plan pricing to match current go-to-market pricing
-- Pro: $19/month, Team: $59/month (up to 10 seats)

UPDATE plan_definitions
SET
  price_monthly = 1900,
  price_yearly = 19000,
  name = 'Pro',
  metadata = jsonb_build_object(
    'description', 'For individual developers and creators'
  ) || COALESCE(metadata, '{}'::jsonb),
  updated_at = NOW()
WHERE tier = 'PRO';

UPDATE plan_definitions
SET
  price_monthly = 5900,
  price_yearly = 59000,
  name = 'Team',
  metadata = jsonb_build_object(
    'description', 'For teams and growing businesses (up to 10 seats)'
  ) || COALESCE(metadata, '{}'::jsonb),
  updated_at = NOW()
WHERE tier = 'TEAM';

-- Ensure Enterprise remains contact-sales
UPDATE plan_definitions
SET
  price_monthly = 0,
  price_yearly = 0,
  metadata = jsonb_build_object(
    'description', 'Custom enterprise contracts',
    'contact_sales', true
  ) || COALESCE(metadata, '{}'::jsonb),
  updated_at = NOW()
WHERE tier = 'ENTERPRISE';
