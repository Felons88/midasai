-- Restrict listing bucket uploads to paths owned by the listing creator.
DROP POLICY IF EXISTS "Authenticated insert listings" ON storage.objects;

CREATE POLICY "Creators upload listing media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listings'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1
    FROM public.listings
    WHERE id::text = (storage.foldername(name))[2]
      AND creator_id = auth.uid()
  )
);
