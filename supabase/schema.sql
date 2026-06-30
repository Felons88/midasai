-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE role_enum AS ENUM ('USER', 'CREATOR', 'ADMIN', 'MODERATOR', 'OWNER');
CREATE TYPE listing_type_enum AS ENUM ('SKILL', 'PLUGIN', 'MCP', 'AGENT', 'PROMPT', 'WORKFLOW', 'TEMPLATE', 'AUTOMATION', 'DEVELOPER_TOOL');
CREATE TYPE listing_status_enum AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED');
CREATE TYPE asset_type_enum AS ENUM ('THUMBNAIL', 'GALLERY', 'BANNER', 'DOCUMENTATION', 'AVATAR');
CREATE TYPE notification_type_enum AS ENUM ('REVIEW', 'BOOKMARK', 'DOWNLOAD', 'PURCHASE', 'SYSTEM', 'MODERATION');
CREATE TYPE subscription_tier_enum AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
CREATE TYPE subscription_status_enum AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING');
CREATE TYPE transaction_type_enum AS ENUM ('PURCHASE', 'PAYOUT', 'REFUND', 'COMMISSION');
CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE api_key_status_enum AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
CREATE TYPE webhook_status_enum AS ENUM ('ACTIVE', 'PAUSED', 'ERROR');
CREATE TYPE webhook_event_enum AS ENUM ('LISTING_CREATED', 'LISTING_UPDATED', 'LISTING_DELETED', 'PURCHASE_COMPLETED', 'PURCHASE_REFUNDED', 'REVIEW_CREATED', 'CREATOR_FOLLOWED', 'SUBSCRIPTION_UPDATED', 'MCP_CREATED', 'MCP_UPDATED', 'WORKFLOW_CREATED', 'WORKFLOW_UPDATED', 'AGENT_CREATED', 'AGENT_UPDATED');
CREATE TYPE delivery_status_enum AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING');
CREATE TYPE application_status_enum AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE mcp_server_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');
CREATE TYPE log_level_enum AS ENUM ('INFO', 'WARN', 'ERROR');

-- Create tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role role_enum DEFAULT 'USER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  seo_title TEXT,
  description TEXT NOT NULL,
  short_description TEXT CHECK (length(short_description) <= 250),
  type listing_type_enum NOT NULL,
  status listing_status_enum DEFAULT 'DRAFT',
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  files JSONB,
  images TEXT[],
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id, user_id)
);

CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name TEXT DEFAULT 'MidasAI',
  site_description TEXT,
  contact_email TEXT,
  platform_fee INTEGER DEFAULT 15,
  minimum_payout DECIMAL(10, 2) DEFAULT 50.00,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Additional tables for full marketplace functionality
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  bio TEXT,
  website TEXT,
  github TEXT,
  twitter TEXT,
  linkedin TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  bio TEXT,
  banner_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  total_listings INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE listing_tags (
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (listing_id, tag_id)
);

CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE collection_items (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (collection_id, listing_id)
);

CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  type transaction_type_enum NOT NULL,
  status transaction_status_enum DEFAULT 'PENDING',
  amount DECIMAL(10, 2) NOT NULL,
  fee DECIMAL(10, 2) DEFAULT 0.00,
  net_amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  tier subscription_tier_enum DEFAULT 'FREE',
  status subscription_status_enum DEFAULT 'ACTIVE',
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  type asset_type_enum NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  email_notifications BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Developer Platform Tables
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  key_value TEXT NOT NULL, -- Only shown once during creation
  status api_key_status_enum DEFAULT 'ACTIVE',
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  rate_limit INTEGER DEFAULT 1000,
  permissions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE api_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  level log_level_enum DEFAULT 'INFO',
  message TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events webhook_event_enum[] NOT NULL,
  status webhook_status_enum DEFAULT 'ACTIVE',
  last_delivery_at TIMESTAMP WITH TIME ZONE,
  total_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE NOT NULL,
  event webhook_event_enum NOT NULL,
  payload JSONB NOT NULL,
  status delivery_status_enum DEFAULT 'PENDING',
  response_code INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  callback_url TEXT,
  webhook_url TEXT,
  client_id TEXT UNIQUE NOT NULL,
  client_secret_hash TEXT NOT NULL,
  client_secret TEXT, -- Only shown once during creation
  scopes TEXT[],
  status application_status_enum DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[],
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE mcp_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  endpoint TEXT NOT NULL,
  version TEXT NOT NULL,
  status mcp_server_status_enum DEFAULT 'ACTIVE',
  health_check_url TEXT,
  last_health_check TIMESTAMP WITH TIME ZONE,
  total_requests INTEGER DEFAULT 0,
  avg_latency_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE mcp_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mcp_server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_value TEXT, -- Only shown once during creation
  permissions TEXT[],
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE mcp_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mcp_server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  connection_config JSONB,
  status TEXT DEFAULT 'ACTIVE',
  last_connected_at TIMESTAMP WITH TIME ZONE,
  total_requests INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE mcp_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mcp_server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  mcp_token_id UUID REFERENCES mcp_tokens(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  request_size INTEGER DEFAULT 0,
  response_size INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_listings_creator_id ON listings(creator_id);
CREATE INDEX idx_listings_category_id ON listings(category_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_listing_id ON bookmarks(listing_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_downloads_listing_id ON downloads(listing_id);
CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_analytics_listing_id ON analytics(listing_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_listing_id ON transactions(listing_id);
CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_creators_slug ON creators(slug);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_assets_listing_id ON assets(listing_id);
CREATE INDEX idx_assets_user_id ON assets(user_id);

-- Developer Platform Indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_status ON api_keys(status);
CREATE INDEX idx_api_usage_api_key_id ON api_usage(api_key_id);
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX idx_api_logs_api_key_id ON api_logs(api_key_id);
CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_status ON webhooks(status);
CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_client_id ON applications(client_id);
CREATE INDEX idx_oauth_tokens_application_id ON oauth_tokens(application_id);
CREATE INDEX idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX idx_mcp_servers_user_id ON mcp_servers(user_id);
CREATE INDEX idx_mcp_servers_status ON mcp_servers(status);
CREATE INDEX idx_mcp_tokens_mcp_server_id ON mcp_tokens(mcp_server_id);
CREATE INDEX idx_mcp_tokens_user_id ON mcp_tokens(user_id);
CREATE INDEX idx_mcp_connections_mcp_server_id ON mcp_connections(mcp_server_id);
CREATE INDEX idx_mcp_connections_user_id ON mcp_connections(user_id);
CREATE INDEX idx_mcp_usage_mcp_server_id ON mcp_usage(mcp_server_id);
CREATE INDEX idx_mcp_usage_user_id ON mcp_usage(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS for Developer Platform Tables
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Categories are publicly viewable, admins can manage
CREATE POLICY "Categories are publicly viewable" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert categories" ON categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'OWNER')
    )
  );

CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'OWNER')
    )
  );

CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'OWNER')
    )
  );

-- Listings are publicly readable, only creators can update their own
CREATE POLICY "Listings are publicly viewable" ON listings
  FOR SELECT USING (true);

CREATE POLICY "Creators can insert own listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = creator_id);

-- Reviews are publicly readable
CREATE POLICY "Reviews are publicly viewable" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Bookmarks are private to user
CREATE POLICY "Users can view own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications are private to user
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Profiles are private to user
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Creators are publicly viewable
CREATE POLICY "Creators are publicly viewable" ON creators
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own creator profile" ON creators
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own creator profile" ON creators
  FOR UPDATE USING (auth.uid() = user_id);

-- Tags are publicly viewable
CREATE POLICY "Tags are publicly viewable" ON tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tags" ON tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'OWNER')
    )
  );

-- Collections are private to user
CREATE POLICY "Users can view own collections" ON collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- Downloads are private to user
CREATE POLICY "Users can view own downloads" ON downloads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert downloads" ON downloads
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Messages are private to participants
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Analytics are service role only
CREATE POLICY "Service role can insert analytics" ON analytics
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can view analytics" ON analytics
  FOR SELECT USING (auth.role() = 'service_role');

-- Transactions are private to user
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert transactions" ON transactions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Subscriptions are private to user
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Assets are publicly viewable for listings
CREATE POLICY "Assets are publicly viewable" ON assets
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own assets" ON assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets" ON assets
  FOR UPDATE USING (auth.uid() = user_id);

-- User settings are private to user
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Audit logs are service role only
CREATE POLICY "Service role can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can view audit logs" ON audit_logs
  FOR SELECT USING (auth.role() = 'service_role');

-- Site settings are publicly readable, only admins can update
CREATE POLICY "Site settings are publicly viewable" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update site settings" ON site_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'OWNER')
    )
  );

-- Developer Platform RLS Policies
-- API Keys are private to user
CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- API Usage is private to user
CREATE POLICY "Users can view own API usage" ON api_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert API usage" ON api_usage
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- API Logs are private to user
CREATE POLICY "Users can view own API logs" ON api_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert API logs" ON api_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Webhooks are private to user
CREATE POLICY "Users can view own webhooks" ON webhooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own webhooks" ON webhooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhooks" ON webhooks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhooks" ON webhooks
  FOR DELETE USING (auth.uid() = user_id);

-- Webhook Deliveries are private to user
CREATE POLICY "Users can view own webhook deliveries" ON webhook_deliveries
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM webhooks WHERE webhooks.id = webhook_deliveries.webhook_id)
  );

CREATE POLICY "Service role can insert webhook deliveries" ON webhook_deliveries
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Applications are private to user
CREATE POLICY "Users can view own applications" ON applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON applications
  FOR UPDATE USING (auth.uid() = user_id);

-- OAuth Tokens are private to user
CREATE POLICY "Users can view own OAuth tokens" ON oauth_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert OAuth tokens" ON oauth_tokens
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- MCP Servers are private to user
CREATE POLICY "Users can view own MCP servers" ON mcp_servers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own MCP servers" ON mcp_servers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own MCP servers" ON mcp_servers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own MCP servers" ON mcp_servers
  FOR DELETE USING (auth.uid() = user_id);

-- MCP Tokens are private to user
CREATE POLICY "Users can view own MCP tokens" ON mcp_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert MCP tokens" ON mcp_tokens
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- MCP Connections are private to user
CREATE POLICY "Users can view own MCP connections" ON mcp_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own MCP connections" ON mcp_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- MCP Usage is private to user
CREATE POLICY "Users can view own MCP usage" ON mcp_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert MCP usage" ON mcp_usage
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Insert default site settings
INSERT INTO site_settings (site_name, site_description, contact_email)
VALUES ('MidasAI', 'The premier marketplace for AI tools', 'hello@midasai.tech');
