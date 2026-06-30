-- Fix function search path security issues
-- Set search_path to public for all functions to prevent SQL injection

-- Fix update_github_connections_updated_at
CREATE OR REPLACE FUNCTION update_github_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix listings_search_vector_update
CREATE OR REPLACE FUNCTION listings_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, '') || ' ' || COALESCE(NEW.tags, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix set_transaction_creator_id
CREATE OR REPLACE FUNCTION set_transaction_creator_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.creator_id := (SELECT creator_id FROM listings WHERE listings.id = NEW.listing_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_listing_rating
CREATE OR REPLACE FUNCTION update_listing_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE listings
  SET average_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE reviews.listing_id = listings.id
  ),
  review_count = (
    SELECT COUNT(*)
    FROM reviews
    WHERE reviews.listing_id = listings.id
  )
  WHERE listings.id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);
  INSERT INTO feature_entitlements (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix generate_listing_slug
CREATE OR REPLACE FUNCTION generate_listing_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'));
    NEW.slug := regexp_replace(NEW.slug, '\s+', '-', 'g');
    NEW.slug := regexp_replace(NEW.slug, '-+', '-', 'g');
    NEW.slug := trim(NEW.slug, '-');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
