-- Avatar uploads: users may write only to their own folder in the avatars bucket.
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;

CREATE POLICY "Users upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;

CREATE POLICY "Users update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Listing asset uploads share the same creator-scoped path rules as gallery media.
DROP POLICY IF EXISTS "Creators upload listing assets" ON storage.objects;

CREATE POLICY "Creators upload listing assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listings'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (storage.foldername(name))[3] = 'assets'
  AND EXISTS (
    SELECT 1
    FROM public.listings
    WHERE id::text = (storage.foldername(name))[2]
      AND creator_id = auth.uid()
  )
);
