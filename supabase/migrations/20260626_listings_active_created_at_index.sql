-- Speed up public API listing queries: ACTIVE listings sorted by created_at
CREATE INDEX IF NOT EXISTS idx_listings_active_created_at
  ON public.listings (created_at DESC)
  WHERE status = 'ACTIVE';
