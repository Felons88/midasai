-- Storage bucket for raw n8n workflow JSON files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'n8n-workflows',
  'n8n-workflows',
  false,
  5242880,
  ARRAY['application/json']
)
ON CONFLICT (id) DO NOTHING;

-- Add storage columns to track where raw n8n JSON is stored
ALTER TABLE nexus_workflow_templates
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS storage_url TEXT;

-- Index for looking up templates by storage path
CREATE INDEX IF NOT EXISTS idx_nexus_workflow_templates_storage_path
ON nexus_workflow_templates(storage_path)
WHERE storage_path IS NOT NULL;
