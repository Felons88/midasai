-- Add AI-generated SEO fields to listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT;

-- Enforce 250-character limit for short_description
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_short_description_max_length;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_short_description_max_length
  CHECK (length(short_description) <= 250);

-- Optional: index for SEO-oriented search
CREATE INDEX IF NOT EXISTS idx_listings_seo_title
  ON public.listings (seo_title)
  WHERE seo_title IS NOT NULL;
