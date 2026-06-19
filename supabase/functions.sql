-- =============================================================================
-- MidasAI - Additional RPC Functions
-- =============================================================================
-- These are called from the application via supabase.rpc()
-- =============================================================================

-- Increment view count (non-blocking, fire-and-forget)
CREATE OR REPLACE FUNCTION public.increment_view_count(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings
  SET view_count = view_count + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment review helpful count atomically
CREATE OR REPLACE FUNCTION public.increment_review_helpful(review_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.reviews
  SET helpful_count = helpful_count + 1
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment creator earnings
CREATE OR REPLACE FUNCTION public.increment_creator_earnings(creator_user_id UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.creator_profiles
  SET total_earnings = total_earnings + amount
  WHERE user_id = creator_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get trending listings (most downloads in last 7 days)
CREATE OR REPLACE FUNCTION public.get_trending_listings(limit_count INTEGER DEFAULT 20)
RETURNS SETOF public.listings AS $$
BEGIN
  RETURN QUERY
  SELECT l.*
  FROM public.listings l
  INNER JOIN (
    SELECT listing_id, COUNT(*) as recent_downloads
    FROM public.downloads
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY listing_id
    ORDER BY recent_downloads DESC
    LIMIT limit_count
  ) d ON l.id = d.listing_id
  WHERE l.status = 'published'
  ORDER BY d.recent_downloads DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get personalized recommendations based on user's bookmarks/downloads
CREATE OR REPLACE FUNCTION public.get_recommendations(user_uuid UUID, limit_count INTEGER DEFAULT 12)
RETURNS SETOF public.listings AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT l.*
  FROM public.listings l
  WHERE l.status = 'published'
  AND l.id NOT IN (
    SELECT listing_id FROM public.bookmarks WHERE user_id = user_uuid
    UNION
    SELECT listing_id FROM public.downloads WHERE user_id = user_uuid
  )
  AND (
    l.type IN (
      SELECT DISTINCT type FROM public.listings
      WHERE id IN (SELECT listing_id FROM public.bookmarks WHERE user_id = user_uuid)
    )
    OR l.category_id IN (
      SELECT DISTINCT category_id FROM public.listings
      WHERE id IN (SELECT listing_id FROM public.bookmarks WHERE user_id = user_uuid)
    )
  )
  ORDER BY l.download_count DESC, l.average_rating DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Search listings with full-text + trigram support
CREATE OR REPLACE FUNCTION public.search_listings_full(
  search_query TEXT,
  type_filter listing_type DEFAULT NULL,
  category_filter UUID DEFAULT NULL,
  min_rating_filter DECIMAL DEFAULT NULL,
  sort_field TEXT DEFAULT 'relevance',
  page_num INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 24
)
RETURNS TABLE (
  listing_id UUID,
  relevance REAL
) AS $$
DECLARE
  offset_val INTEGER;
BEGIN
  offset_val := (page_num - 1) * page_size;

  RETURN QUERY
  SELECT
    l.id as listing_id,
    GREATEST(
      similarity(l.title, search_query),
      similarity(l.short_description, search_query) * 0.8
    ) as relevance
  FROM public.listings l
  WHERE l.status = 'published'
    AND (
      l.title ILIKE '%' || search_query || '%'
      OR l.short_description ILIKE '%' || search_query || '%'
      OR similarity(l.title, search_query) > 0.2
    )
    AND (type_filter IS NULL OR l.type = type_filter)
    AND (category_filter IS NULL OR l.category_id = category_filter)
    AND (min_rating_filter IS NULL OR l.average_rating >= min_rating_filter)
  ORDER BY
    CASE WHEN sort_field = 'relevance' THEN
      GREATEST(similarity(l.title, search_query), similarity(l.short_description, search_query) * 0.8)
    END DESC NULLS LAST,
    CASE WHEN sort_field = 'downloads' THEN l.download_count END DESC NULLS LAST,
    CASE WHEN sort_field = 'rating' THEN l.average_rating END DESC NULLS LAST,
    CASE WHEN sort_field = 'newest' THEN EXTRACT(EPOCH FROM l.published_at) END DESC NULLS LAST
  LIMIT page_size
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
