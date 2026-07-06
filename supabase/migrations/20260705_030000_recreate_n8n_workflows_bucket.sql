-- Recreate the n8n-workflows storage bucket if it was deleted
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'n8n-workflows',
  'n8n-workflows',
  false,
  5242880,
  ARRAY['application/json']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read raw n8n workflow JSON files
DROP POLICY IF EXISTS "Authenticated read n8n workflows" ON storage.objects;
CREATE POLICY "Authenticated read n8n workflows"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'n8n-workflows');
