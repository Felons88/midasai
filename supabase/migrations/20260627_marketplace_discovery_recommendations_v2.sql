-- Migration: Marketplace discovery, recommendations, and search performance (v2)
-- Adds featured flags, collection curation, recommendation RPCs, and search indexes.

-- 1. Featured / discovery flags on listings
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS quality_score numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS search_rank_weight numeric(5,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings (featured) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_listings_quality_score ON public.listings (quality_score DESC) WHERE status = 'ACTIVE';

-- 2. Collection curation fields
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS curated_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_collections_featured ON public.collections (featured, is_active, sort_order);

-- 3. Seed featured collections for enterprise marketplace
INSERT INTO public.collections (name, slug, description, featured, is_active, public, sort_order, user_id)
SELECT name, slug, description, true, true, true, sort_order, (SELECT id FROM public.users ORDER BY created_at LIMIT 1)
FROM (VALUES
  ('AI Developer Starter Pack', 'ai-developer-starter-pack', 'Essential tools to supercharge your AI development workflow.', 1),
  ('Claude Essentials', 'claude-essentials', 'Hand-picked skills and prompts for Claude power users.', 2),
  ('Productivity Toolkit', 'productivity-toolkit', 'Automations and workflows that save hours every week.', 3),
  ('Security Collection', 'security-collection', 'AI-powered security tools, scanners, and guardrails.', 4),
  ('Browser Automation', 'browser-automation', 'Puppet, Playwright, and browser agent recipes.', 5)
) AS v(name, slug, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.collections WHERE slug = v.slug);

-- 4. Extend analytics table for recommendation events
ALTER TABLE public.analytics
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_analytics_user_session ON public.analytics (user_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_listing ON public.analytics (listing_id, event_type, created_at);

-- 5. Helper RPC: return listing_type_enum values
CREATE OR REPLACE FUNCTION public.get_listing_type_enum_values()
RETURNS TABLE (value text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unnest(enum_range(NULL::listing_type_enum))::text;
$$;

-- 6. Recommendation RPC: "Because you downloaded..."
CREATE OR REPLACE FUNCTION public.get_recommendations_because_you_downloaded(
  p_user_id uuid,
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  type listing_type_enum,
  price numeric,
  downloads integer,
  views integer,
  average_rating numeric,
  review_count integer,
  images text[],
  tags text[],
  updated_at timestamptz,
  created_at timestamptz,
  featured boolean,
  creator jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id,
    l.title,
    l.description,
    l.type,
    l.price,
    l.downloads,
    l.views,
    l.average_rating,
    l.review_count,
    l.images,
    l.tags,
    l.updated_at,
    l.created_at,
    l.featured,
    jsonb_build_object(
      'id', u.id,
      'name', u.name,
      'avatar_url', u.avatar_url,
      'verified', c.verified
    ) AS creator
  FROM public.listings l
  JOIN public.users u ON u.id = l.creator_id
  LEFT JOIN public.creators c ON c.user_id = l.creator_id
  WHERE l.status = 'ACTIVE'
    AND l.category_id IN (
      SELECT DISTINCT l2.category_id
      FROM public.downloads d
      JOIN public.listings l2 ON l2.id = d.listing_id
      WHERE d.user_id = p_user_id
        AND l2.category_id IS NOT NULL
    )
    AND l.id NOT IN (
      SELECT listing_id FROM public.downloads WHERE user_id = p_user_id
    )
  ORDER BY l.average_rating DESC NULLS LAST, l.downloads DESC NULLS LAST
  LIMIT p_limit;
$$;

-- 7. Recommendation RPC: recently viewed listings
CREATE OR REPLACE FUNCTION public.get_recently_viewed_listings(
  p_user_id uuid,
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  type listing_type_enum,
  price numeric,
  downloads integer,
  views integer,
  average_rating numeric,
  review_count integer,
  images text[],
  tags text[],
  updated_at timestamptz,
  created_at timestamptz,
  featured boolean,
  creator jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (l.id)
    l.id,
    l.title,
    l.description,
    l.type,
    l.price,
    l.downloads,
    l.views,
    l.average_rating,
    l.review_count,
    l.images,
    l.tags,
    l.updated_at,
    l.created_at,
    l.featured,
    jsonb_build_object(
      'id', u.id,
      'name', u.name,
      'avatar_url', u.avatar_url,
      'verified', c.verified
    ) AS creator
  FROM public.listings l
  JOIN public.users u ON u.id = l.creator_id
  LEFT JOIN public.creators c ON c.user_id = l.creator_id
  JOIN public.analytics a ON a.listing_id = l.id
  WHERE l.status = 'ACTIVE'
    AND a.user_id = p_user_id
    AND a.event_type IN ('listing_view', 'listing_detail_view')
  ORDER BY l.id, a.created_at DESC
  LIMIT p_limit;
$$;

-- 8. Full-text search performance indexes
CREATE INDEX IF NOT EXISTS idx_listings_search_vector ON public.listings USING gin (search_vector);
CREATE INDEX IF NOT EXISTS idx_listings_category_status ON public.listings (category_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_type_status ON public.listings (type, status);
CREATE INDEX IF NOT EXISTS idx_listings_downloads ON public.listings (downloads DESC NULLS LAST) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_listings_views ON public.listings (views DESC NULLS LAST) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings (created_at DESC) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_listings_updated_at ON public.listings (updated_at DESC NULLS LAST) WHERE status = 'ACTIVE';

-- 9. Revoke PUBLIC EXECUTE on new RPCs (follow project security policy)
REVOKE ALL ON FUNCTION public.get_listing_type_enum_values() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_recommendations_because_you_downloaded(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_recently_viewed_listings(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_listing_type_enum_values() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_recommendations_because_you_downloaded(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recently_viewed_listings(uuid, integer) TO authenticated;

-- 10. Trigger function to update quality_score from metadata, reviews, and engagement
CREATE OR REPLACE FUNCTION public.update_listing_quality_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.quality_score := (
    COALESCE(NEW.average_rating, 0) * 10
    + LEAST(COALESCE(NEW.downloads, 0), 1000) * 0.05
    + CASE WHEN NEW.readme IS NOT NULL AND length(NEW.readme) > 100 THEN 10 ELSE 0 END
    + CASE WHEN NEW.images IS NOT NULL AND array_length(NEW.images, 1) > 0 THEN 10 ELSE 0 END
    + CASE WHEN NEW.tags IS NOT NULL AND array_length(NEW.tags, 1) > 0 THEN 5 ELSE 0 END
    + CASE WHEN NEW.github_url IS NOT NULL THEN 5 ELSE 0 END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_listing_quality_score ON public.listings;
CREATE TRIGGER trg_update_listing_quality_score
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.update_listing_quality_score();
