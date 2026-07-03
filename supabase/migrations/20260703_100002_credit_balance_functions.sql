-- Credit balance atomic increment/decrement functions

CREATE OR REPLACE FUNCTION increment_user_credit_balance(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO credit_balances (user_id, monthly_credits, purchased_credits, bonus_credits, total_used, lifetime_used)
  VALUES (p_user_id, p_amount, 0, 0, 0, 0)
  ON CONFLICT (user_id)
  DO UPDATE SET
    purchased_credits = credit_balances.purchased_credits + p_amount,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION decrement_user_credit_balance(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE credit_balances
  SET
    monthly_credits = GREATEST(0, monthly_credits - LEAST(p_amount, monthly_credits)),
    purchased_credits = GREATEST(0, purchased_credits - GREATEST(0, p_amount - monthly_credits_before)),
    bonus_credits = GREATEST(0, bonus_credits - GREATEST(0, p_amount - monthly_credits_before - purchased_credits_before)),
    updated_at = NOW()
  FROM (
    SELECT monthly_credits AS monthly_credits_before, purchased_credits AS purchased_credits_before, bonus_credits AS bonus_credits_before
    FROM credit_balances
    WHERE user_id = p_user_id
  ) AS current
  WHERE credit_balances.user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_org_credit_balance(p_organization_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO organization_credits (organization_id, monthly_credits, purchased_credits, bonus_credits, total_used, lifetime_used)
  VALUES (p_organization_id, p_amount, 0, 0, 0, 0)
  ON CONFLICT (organization_id)
  DO UPDATE SET
    purchased_credits = organization_credits.purchased_credits + p_amount,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION decrement_org_credit_balance(p_organization_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE organization_credits
  SET
    monthly_credits = GREATEST(0, monthly_credits - LEAST(p_amount, monthly_credits)),
    purchased_credits = GREATEST(0, purchased_credits - GREATEST(0, p_amount - monthly_credits_before)),
    bonus_credits = GREATEST(0, bonus_credits - GREATEST(0, p_amount - monthly_credits_before - purchased_credits_before)),
    updated_at = NOW()
  FROM (
    SELECT monthly_credits AS monthly_credits_before, purchased_credits AS purchased_credits_before, bonus_credits AS bonus_credits_before
    FROM organization_credits
    WHERE organization_id = p_organization_id
  ) AS current
  WHERE organization_credits.organization_id = p_organization_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_user_credit_used(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE credit_balances
  SET total_used = total_used + p_amount,
      lifetime_used = lifetime_used + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_org_credit_used(p_organization_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE organization_credits
  SET total_used = total_used + p_amount,
      lifetime_used = lifetime_used + p_amount,
      updated_at = NOW()
  WHERE organization_id = p_organization_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_user_credit_balance(UUID, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION decrement_user_credit_balance(UUID, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION increment_org_credit_balance(UUID, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION decrement_org_credit_balance(UUID, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION increment_user_credit_used(UUID, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION increment_org_credit_used(UUID, INTEGER) FROM PUBLIC;
