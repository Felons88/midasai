-- Migration: Add tags, full-text search, and trending support
-- AGENT-3: Search, Discovery, SEO

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for listings <-> tags (many-to-many)
CREATE TABLE IF NOT EXISTS listing_tags (
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (listing_id, tag_id)
);

-- Add slug column to listings for SEO-friendly URLs
ALTER TABLE listings ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add platform column to listings for platform-specific filtering
ALTER TABLE listings ADD COLUMN IF NOT EXISTS platform TEXT[];

-- Add average_rating computed column support
ALTER TABLE listings ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Add trending_score for trending algorithm
ALTER TABLE listings ADD COLUMN IF NOT EXISTS trending_score DECIMAL(10, 4) DEFAULT 0;

-- Full-text search: add tsvector column with GIN index
ALTER TABLE listings ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_listings_search_vector ON listings USING GIN(search_vector);

-- Create indexes for tags
CREATE INDEX IF NOT EXISTS idx_listing_tags_listing_id ON listing_tags(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_tags_tag_id ON listing_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

-- Index for trending and sorting
CREATE INDEX IF NOT EXISTS idx_listings_trending_score ON listings(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_downloads_desc ON listings(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_listings_average_rating ON listings(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_listings_created_at_desc ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_platform ON listings USING GIN(platform);

-- Function to update search_vector on insert/update
CREATE OR REPLACE FUNCTION listings_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search_vector
DROP TRIGGER IF EXISTS trg_listings_search_vector ON listings;
CREATE TRIGGER trg_listings_search_vector
  BEFORE INSERT OR UPDATE OF title, description ON listings
  FOR EACH ROW
  EXECUTE FUNCTION listings_search_vector_update();

-- Function to compute trending score (time-weighted popularity)
-- Score = (downloads * 2 + views + review_count * 3) / (age_in_hours + 2)^1.5
CREATE OR REPLACE FUNCTION compute_trending_score(
  p_downloads INTEGER,
  p_views INTEGER,
  p_review_count INTEGER,
  p_average_rating DECIMAL,
  p_created_at TIMESTAMP WITH TIME ZONE
) RETURNS DECIMAL AS $$
DECLARE
  age_hours DECIMAL;
  raw_score DECIMAL;
BEGIN
  age_hours := EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 3600.0;
  raw_score := (p_downloads * 2.0 + p_views + p_review_count * 3.0) * (1.0 + p_average_rating / 5.0);
  RETURN raw_score / POWER(age_hours + 2.0, 1.5);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to refresh trending scores (call periodically)
CREATE OR REPLACE FUNCTION refresh_trending_scores() RETURNS void AS $$
BEGIN
  UPDATE listings
  SET trending_score = compute_trending_score(downloads, views, review_count, average_rating, created_at)
  WHERE status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql;

-- Function to update listing average_rating and review_count
CREATE OR REPLACE FUNCTION update_listing_rating() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE listings SET
      average_rating = COALESCE((SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE listing_id = OLD.listing_id), 0),
      review_count = (SELECT COUNT(*) FROM reviews WHERE listing_id = OLD.listing_id)
    WHERE id = OLD.listing_id;
    RETURN OLD;
  ELSE
    UPDATE listings SET
      average_rating = COALESCE((SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE listing_id = NEW.listing_id), 0),
      review_count = (SELECT COUNT(*) FROM reviews WHERE listing_id = NEW.listing_id)
    WHERE id = NEW.listing_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_listing_rating ON reviews;
CREATE TRIGGER trg_update_listing_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_rating();

-- RLS for tags (publicly readable)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags are publicly viewable" ON tags FOR SELECT USING (true);

-- RLS for listing_tags (publicly readable)
ALTER TABLE listing_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listing tags are publicly viewable" ON listing_tags FOR SELECT USING (true);
