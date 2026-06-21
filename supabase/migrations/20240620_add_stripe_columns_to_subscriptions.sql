-- Add stripe_price_id and stripe_customer_id columns to subscriptions table
-- This migration aligns schema.sql with the live database

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
