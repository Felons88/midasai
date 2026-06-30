-- Remove broad storage SELECT policies on public buckets.
-- Public buckets still serve direct object URLs; listing enumeration is blocked.
DROP POLICY IF EXISTS "Public read assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read listings" ON storage.objects;

-- Tighten activity_feed inserts (service_role bypasses RLS for server-side logging).
DROP POLICY IF EXISTS "Service can insert activity" ON public.activity_feed;

CREATE POLICY "Authenticated users insert own activity"
ON public.activity_feed
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());
