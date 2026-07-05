-- Add SEO title to workflow templates for better discoverability
ALTER TABLE nexus_workflow_templates ADD COLUMN IF NOT EXISTS seo_title TEXT;

-- Backfill n8n templates from the original workflow name stored in source_metadata
UPDATE nexus_workflow_templates
SET seo_title = source_metadata->>'original_name'
WHERE source = 'n8n' AND seo_title IS NULL AND source_metadata->>'original_name' IS NOT NULL;

-- Backfill any remaining templates with their display name as fallback
UPDATE nexus_workflow_templates
SET seo_title = name
WHERE seo_title IS NULL;
