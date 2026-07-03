-- AI Tool Pricing & centralized reservation engine schema

-- ---------------------------------------------------------------------------
-- 1. AI tool pricing configuration
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_tool_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  reserve_credits INTEGER NOT NULL DEFAULT 0,
  unit_label TEXT NOT NULL DEFAULT 'call',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ai_tool_pricing IS 'Configurable credit pricing for every AI tool/feature. Adjusted without code changes.';

CREATE INDEX IF NOT EXISTS idx_ai_tool_pricing_feature_key ON ai_tool_pricing(feature_key);
CREATE INDEX IF NOT EXISTS idx_ai_tool_pricing_active ON ai_tool_pricing(is_active);

-- ---------------------------------------------------------------------------
-- 2. Seed initial pricing (values are configurable via DB after deploy)
-- ---------------------------------------------------------------------------

INSERT INTO ai_tool_pricing (feature_key, name, description, reserve_credits, unit_label, is_active)
VALUES
  ('ai_chat', 'AI Chat', 'General AI chat conversation', 5, 'message', TRUE),
  ('ai_search', 'AI Search', 'AI-powered semantic search', 3, 'query', TRUE),
  ('prompt_analysis', 'Prompt Analysis', 'Analyze and improve a prompt', 8, 'request', TRUE),
  ('prompt_categorization', 'Prompt Categorization', 'Categorize a prompt into taxonomy', 10, 'request', TRUE),
  ('marketplace_ai_summary', 'Marketplace AI Summary', 'Generate marketplace listing summary', 5, 'listing', TRUE),
  ('architect_generation', 'Architect Generation', 'Generate full project architecture files', 50, 'file', TRUE),
  ('workflow_expansion', 'Workflow Expansion', 'Expand/improve workflow project files', 75, 'round', TRUE),
  ('project_intelligence_scan', 'Project Intelligence Scan', 'Deep project analysis and insights', 100, 'scan', TRUE),
  ('github_repository_analysis', 'GitHub Repository Analysis', 'Analyze a GitHub repository', 30, 'repo', TRUE),
  ('ai_project_builder', 'AI Project Builder', 'Build an entire project from scratch', 150, 'project', TRUE),
  ('ai_code_review', 'AI Code Review', 'Review code and provide feedback', 40, 'review', TRUE),
  ('ai_optimization', 'AI Optimization', 'Optimize existing code or docs', 25, 'request', TRUE),
  ('ai_debugging', 'AI Debugging', 'Debug an issue or error', 35, 'request', TRUE),
  ('deployment_assistant', 'Deployment Assistant', 'Generate deployment guidance', 20, 'request', TRUE),
  ('generate_description', 'Generate Description', 'Generate marketplace listing description', 5, 'request', TRUE),
  ('generate_tags', 'Generate Tags', 'Generate marketplace listing tags', 5, 'request', TRUE)
ON CONFLICT (feature_key)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  reserve_credits = EXCLUDED.reserve_credits,
  unit_label = EXCLUDED.unit_label,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------

ALTER TABLE ai_tool_pricing ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_tool_pricing' AND policyname = 'ai_tool_pricing_read_all'
  ) THEN
    CREATE POLICY ai_tool_pricing_read_all
      ON ai_tool_pricing
      FOR SELECT
      TO PUBLIC
      USING (is_active = TRUE);
  END IF;
END $$;
