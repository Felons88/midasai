-- =============================================================================
-- MidasAI Marketplace - Complete Supabase Schema
-- =============================================================================
-- Production-ready schema for AI marketplace:
-- Claude Skills, Cursor Rules, Windsurf Workflows, MCP Servers,
-- AI Agents, Prompt Packs, Templates, Automations
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text trigram search

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE user_role AS ENUM ('user', 'creator', 'moderator', 'admin', 'owner');

CREATE TYPE listing_type AS ENUM (
  'claude_skill',
  'claude_code_skill',
  'cursor_rule',
  'windsurf_workflow',
  'mcp_server',
  'ai_agent',
  'prompt_pack',
  'template',
  'automation'
);

CREATE TYPE listing_status AS ENUM (
  'draft',
  'pending_review',
  'published',
  'rejected',
  'suspended',
  'archived'
);

CREATE TYPE transaction_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded',
  'disputed'
);

CREATE TYPE transaction_type AS ENUM (
  'purchase',
  'subscription',
  'payout',
  'refund',
  'fee'
);

CREATE TYPE pricing_model AS ENUM (
  'free',
  'one_time',
  'subscription',
  'pay_what_you_want'
);

CREATE TYPE platform AS ENUM (
  'claude',
  'claude_code',
  'cursor',
  'windsurf',
  'github_copilot',
  'bolt',
  'loveable',
  'openai',
  'gemini',
  'openrouter',
  'n8n',
  'make',
  'universal'
);

CREATE TYPE notification_type AS ENUM (
  'review',
  'download',
  'purchase',
  'follow',
  'listing_approved',
  'listing_rejected',
  'payout',
  'system'
);

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  github_url TEXT,
  twitter_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creator profiles (extended data for creators)
CREATE TABLE public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  tagline TEXT,
  long_description TEXT,
  specializations TEXT[] DEFAULT '{}',
  total_downloads BIGINT NOT NULL DEFAULT 0,
  total_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0,
  payout_email TEXT,
  stripe_account_id TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  follower_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- MARKETPLACE TABLES
-- =============================================================================

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  listing_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Listings (core marketplace entity)
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  long_description TEXT,
  type listing_type NOT NULL,
  status listing_status NOT NULL DEFAULT 'draft',
  pricing_model pricing_model NOT NULL DEFAULT 'free',
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  platforms platform[] NOT NULL DEFAULT '{}',
  -- Metadata
  version TEXT DEFAULT '1.0.0',
  license TEXT,
  repository_url TEXT,
  documentation_url TEXT,
  demo_url TEXT,
  -- Media
  thumbnail_url TEXT,
  images TEXT[] DEFAULT '{}',
  -- Content (the actual skill/rule/workflow content)
  content JSONB,
  installation_instructions TEXT,
  -- Stats (denormalized for read performance)
  view_count BIGINT NOT NULL DEFAULT 0,
  download_count BIGINT NOT NULL DEFAULT 0,
  bookmark_count INTEGER NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  -- Flags
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Listing tags (many-to-many)
CREATE TABLE public.listing_tags (
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, tag_id)
);

-- Listing versions (version history)
CREATE TABLE public.listing_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog TEXT,
  content JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INTERACTIONS
-- =============================================================================

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, user_id)
);

-- Bookmarks
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, listing_id)
);

-- Collections (user-created curated groups)
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  listing_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

-- Collection items (many-to-many)
CREATE TABLE public.collection_items (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, listing_id)
);

-- Downloads (track every download event)
CREATE TABLE public.downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_hash TEXT,
  user_agent TEXT,
  version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Follows (user follows creator)
CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- =============================================================================
-- TRANSACTIONS & PAYMENTS
-- =============================================================================

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_payment_id TEXT,
  stripe_transfer_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- User purchases (quick lookup for owned items)
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, listing_id)
);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PLATFORM CONFIGURATION
-- =============================================================================

CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Profiles
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Creator profiles
CREATE INDEX idx_creator_profiles_user_id ON public.creator_profiles(user_id);
CREATE INDEX idx_creator_profiles_featured ON public.creator_profiles(is_featured) WHERE is_featured = TRUE;

-- Categories
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);

-- Tags
CREATE INDEX idx_tags_slug ON public.tags(slug);
CREATE INDEX idx_tags_usage ON public.tags(usage_count DESC);

-- Listings (critical path - many query patterns)
CREATE INDEX idx_listings_creator ON public.listings(creator_id);
CREATE INDEX idx_listings_category ON public.listings(category_id);
CREATE INDEX idx_listings_type ON public.listings(type);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_slug ON public.listings(slug);
CREATE INDEX idx_listings_published ON public.listings(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_listings_featured ON public.listings(is_featured) WHERE is_featured = TRUE AND status = 'published';
CREATE INDEX idx_listings_downloads ON public.listings(download_count DESC) WHERE status = 'published';
CREATE INDEX idx_listings_rating ON public.listings(average_rating DESC) WHERE status = 'published';
-- GIN index for platform array search
CREATE INDEX idx_listings_platforms ON public.listings USING GIN(platforms);
-- Trigram index for full-text search on title
CREATE INDEX idx_listings_title_trgm ON public.listings USING GIN(title gin_trgm_ops);
CREATE INDEX idx_listings_short_desc_trgm ON public.listings USING GIN(short_description gin_trgm_ops);

-- Listing tags
CREATE INDEX idx_listing_tags_tag ON public.listing_tags(tag_id);

-- Reviews
CREATE INDEX idx_reviews_listing ON public.reviews(listing_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(listing_id, rating);

-- Bookmarks
CREATE INDEX idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_listing ON public.bookmarks(listing_id);

-- Collections
CREATE INDEX idx_collections_user ON public.collections(user_id);
CREATE INDEX idx_collections_public ON public.collections(is_public) WHERE is_public = TRUE;

-- Downloads
CREATE INDEX idx_downloads_listing ON public.downloads(listing_id);
CREATE INDEX idx_downloads_user ON public.downloads(user_id);
CREATE INDEX idx_downloads_created ON public.downloads(created_at DESC);

-- Follows
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Transactions
CREATE INDEX idx_transactions_buyer ON public.transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON public.transactions(seller_id);
CREATE INDEX idx_transactions_listing ON public.transactions(listing_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);

-- Purchases
CREATE INDEX idx_purchases_user ON public.purchases(user_id);
CREATE INDEX idx_purchases_listing ON public.purchases(listing_id);

-- Notifications
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Helper function: check if user has a specific role or higher
CREATE OR REPLACE FUNCTION public.has_role(required_role user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role >= required_role
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if user is admin or owner
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "Profiles are publicly viewable"
  ON public.profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- CREATOR PROFILES
CREATE POLICY "Creator profiles are publicly viewable"
  ON public.creator_profiles FOR SELECT USING (TRUE);

CREATE POLICY "Creators can update own creator profile"
  ON public.creator_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own creator profile"
  ON public.creator_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- CATEGORIES (public read, admin write)
CREATE POLICY "Categories are publicly viewable"
  ON public.categories FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL USING (public.is_admin());

-- TAGS (public read, admin write)
CREATE POLICY "Tags are publicly viewable"
  ON public.tags FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage tags"
  ON public.tags FOR ALL USING (public.is_admin());

-- LISTINGS
CREATE POLICY "Published listings are publicly viewable"
  ON public.listings FOR SELECT
  USING (status = 'published' OR creator_id = auth.uid() OR public.is_admin());

CREATE POLICY "Creators can insert own listings"
  ON public.listings FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update own listings"
  ON public.listings FOR UPDATE
  USING (creator_id = auth.uid() OR public.is_admin());

CREATE POLICY "Creators can delete own draft listings"
  ON public.listings FOR DELETE
  USING ((creator_id = auth.uid() AND status = 'draft') OR public.is_admin());

-- LISTING TAGS
CREATE POLICY "Listing tags are publicly viewable"
  ON public.listing_tags FOR SELECT USING (TRUE);

CREATE POLICY "Listing creators can manage tags"
  ON public.listing_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id AND creator_id = auth.uid()
    )
    OR public.is_admin()
  );

-- LISTING VERSIONS
CREATE POLICY "Listing versions are publicly viewable"
  ON public.listing_versions FOR SELECT USING (TRUE);

CREATE POLICY "Listing creators can manage versions"
  ON public.listing_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id AND creator_id = auth.uid()
    )
  );

-- REVIEWS
CREATE POLICY "Reviews are publicly viewable"
  ON public.reviews FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- BOOKMARKS
CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- COLLECTIONS
CREATE POLICY "Public collections are viewable by all"
  ON public.collections FOR SELECT
  USING (is_public = TRUE OR user_id = auth.uid());

CREATE POLICY "Users can create collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = user_id);

-- COLLECTION ITEMS
CREATE POLICY "Collection items follow collection visibility"
  ON public.collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE id = collection_id AND (is_public = TRUE OR user_id = auth.uid())
    )
  );

CREATE POLICY "Collection owners can manage items"
  ON public.collection_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE id = collection_id AND user_id = auth.uid()
    )
  );

-- DOWNLOADS
CREATE POLICY "Users can view own downloads"
  ON public.downloads FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Authenticated users can record downloads"
  ON public.downloads FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- FOLLOWS
CREATE POLICY "Follows are publicly viewable"
  ON public.follows FOR SELECT USING (TRUE);

CREATE POLICY "Users can follow"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- TRANSACTIONS
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());

CREATE POLICY "System can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- PURCHASES
CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- SITE SETTINGS
CREATE POLICY "Site settings are publicly viewable"
  ON public.site_settings FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL USING (public.is_admin());

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_creator_profiles_updated_at
  BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update listing stats when review is added/removed
CREATE OR REPLACE FUNCTION public.update_listing_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.listings SET
      review_count = (SELECT COUNT(*) FROM public.reviews WHERE listing_id = NEW.listing_id),
      average_rating = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE listing_id = NEW.listing_id)
    WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings SET
      review_count = (SELECT COUNT(*) FROM public.reviews WHERE listing_id = OLD.listing_id),
      average_rating = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE listing_id = OLD.listing_id)
    WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_review_stats();

-- Update bookmark count on listing
CREATE OR REPLACE FUNCTION public.update_listing_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings SET bookmark_count = bookmark_count + 1 WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings SET bookmark_count = bookmark_count - 1 WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_bookmark_change
  AFTER INSERT OR DELETE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_bookmark_count();

-- Update collection listing_count
CREATE OR REPLACE FUNCTION public.update_collection_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections SET listing_count = listing_count + 1 WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.collections SET listing_count = listing_count - 1 WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_collection_item_change
  AFTER INSERT OR DELETE ON public.collection_items
  FOR EACH ROW EXECUTE FUNCTION public.update_collection_count();

-- Update follower count
CREATE OR REPLACE FUNCTION public.update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.creator_profiles SET follower_count = follower_count + 1
    WHERE user_id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.creator_profiles SET follower_count = follower_count - 1
    WHERE user_id = OLD.following_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follower_count();

-- Increment download count on listing + creator
CREATE OR REPLACE FUNCTION public.handle_download()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.listings SET download_count = download_count + 1 WHERE id = NEW.listing_id;
  UPDATE public.creator_profiles SET total_downloads = total_downloads + 1
  WHERE user_id = (SELECT creator_id FROM public.listings WHERE id = NEW.listing_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_download_insert
  AFTER INSERT ON public.downloads
  FOR EACH ROW EXECUTE FUNCTION public.handle_download();

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('platform_name', '"MidasAI"'),
  ('platform_description', '"The premier marketplace for AI tools and skills"'),
  ('contact_email', '"hello@midasai.com"'),
  ('platform_fee_percent', '15'),
  ('minimum_payout', '50.00'),
  ('maintenance_mode', 'false');

-- Default categories
INSERT INTO public.categories (name, slug, description, icon, sort_order) VALUES
  ('Productivity', 'productivity', 'Tools that boost your workflow efficiency', 'Zap', 1),
  ('Development', 'development', 'Coding assistants and dev tools', 'Code', 2),
  ('Writing', 'writing', 'Content creation and editing tools', 'PenTool', 3),
  ('Data & Analytics', 'data-analytics', 'Data processing and analysis tools', 'BarChart', 4),
  ('Design', 'design', 'Creative and design automation tools', 'Palette', 5),
  ('Research', 'research', 'Research and knowledge tools', 'Search', 6),
  ('Communication', 'communication', 'Messaging and collaboration tools', 'MessageSquare', 7),
  ('Automation', 'automation', 'Workflow automation and integration', 'GitBranch', 8),
  ('Security', 'security', 'Security and compliance tools', 'Shield', 9),
  ('Education', 'education', 'Learning and training resources', 'GraduationCap', 10);
