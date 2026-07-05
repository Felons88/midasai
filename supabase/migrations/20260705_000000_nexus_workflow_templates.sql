-- Workflow Templates table for storing pre-built workflows (including scraped n8n workflows)
CREATE TABLE IF NOT EXISTS nexus_workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  seo_title TEXT,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT DEFAULT '✨',
  color TEXT DEFAULT '#8b5cf6',
  tags TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  definition JSONB NOT NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'n8n', 'community')),
  source_url TEXT,
  source_metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint on name if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'nexus_workflow_templates_name_unique' AND conrelid = 'nexus_workflow_templates'::regclass
  ) THEN
    ALTER TABLE nexus_workflow_templates ADD CONSTRAINT nexus_workflow_templates_name_unique UNIQUE(name);
  END IF;
END $$;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_nexus_workflow_templates_category ON nexus_workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_nexus_workflow_templates_tags ON nexus_workflow_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_nexus_workflow_templates_source ON nexus_workflow_templates(source);
CREATE INDEX IF NOT EXISTS idx_nexus_workflow_templates_active ON nexus_workflow_templates(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE nexus_workflow_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'nexus_workflow_templates' AND policyname = 'Templates are readable by all authenticated users'
  ) THEN
    CREATE POLICY "Templates are readable by all authenticated users"
      ON nexus_workflow_templates FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'nexus_workflow_templates' AND policyname = 'Admins can manage templates'
  ) THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
      CREATE POLICY "Admins can manage templates"
        ON nexus_workflow_templates FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
          )
        );
    ELSE
      CREATE POLICY "Admins can manage templates"
        ON nexus_workflow_templates FOR ALL
        TO authenticated
        USING (true);
    END IF;
  END IF;
END $$;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_nexus_workflow_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS nexus_workflow_templates_updated_at ON nexus_workflow_templates;
CREATE TRIGGER nexus_workflow_templates_updated_at
  BEFORE UPDATE ON nexus_workflow_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_nexus_workflow_templates_updated_at();

-- Insert default templates from the hardcoded list
INSERT INTO nexus_workflow_templates (name, description, category, icon, color, tags, difficulty, definition, source)
VALUES
  ('AI Content Pipeline', 'Fetch a URL, summarize the content with AI, then post the summary to Slack', 'AI', '✨', '#8b5cf6', ARRAY['ai', 'slack', 'content', 'summarize'], 'beginner', '{
    "nodes": [
      {
        "id": "n1",
        "node_type_id": "http_request",
        "label": "Fetch URL",
        "position": { "x": 80, "y": 160 },
        "configuration": { "method": "GET", "url": "https://example.com/article" }
      },
      {
        "id": "n2",
        "node_type_id": "ai.summarize",
        "label": "Summarize",
        "position": { "x": 340, "y": 160 },
        "configuration": { "model": "gpt-4o-mini", "max_words": 150 }
      },
      {
        "id": "n3",
        "node_type_id": "slack",
        "label": "Post to Slack",
        "position": { "x": 600, "y": 160 },
        "configuration": { "channel": "#general" }
      }
    ],
    "edges": [
      { "id": "e1", "source_node_id": "n1", "source_output": "body", "target_node_id": "n2", "target_input": "text" },
      { "id": "e2", "source_node_id": "n2", "source_output": "summary", "target_node_id": "n3", "target_input": "message" }
    ]
  }', 'manual'),
  ('GitHub PR Notifier', 'Watch a GitHub repo for new PRs and send email + Slack alerts', 'Developer', '🔔', '#10b981', ARRAY['github', 'slack', 'email', 'notifications'], 'intermediate', '{
    "nodes": [
      {
        "id": "n1",
        "node_type_id": "schedule",
        "label": "Every 15 min",
        "position": { "x": 80, "y": 160 },
        "configuration": { "cron": "*/15 * * * *" }
      },
      {
        "id": "n2",
        "node_type_id": "github",
        "label": "List PRs",
        "position": { "x": 320, "y": 160 },
        "configuration": { "operation": "list_prs", "owner": "my-org", "repo": "my-repo", "state": "open" }
      },
      {
        "id": "n3",
        "node_type_id": "filter_array",
        "label": "New PRs Only",
        "position": { "x": 560, "y": 120 },
        "configuration": { "field": "draft", "operator": "equals", "value": "false" }
      },
      {
        "id": "n4",
        "node_type_id": "slack",
        "label": "Slack Alert",
        "position": { "x": 800, "y": 80 },
        "configuration": { "channel": "#engineering" }
      },
      {
        "id": "n5",
        "node_type_id": "email_send",
        "label": "Email Alert",
        "position": { "x": 800, "y": 220 },
        "configuration": { "to": "team@company.com", "subject": "New PR opened" }
      }
    ],
    "edges": [
      { "id": "e1", "source_node_id": "n1", "source_output": "trigger", "target_node_id": "n2", "target_input": "trigger" },
      { "id": "e2", "source_node_id": "n2", "source_output": "result", "target_node_id": "n3", "target_input": "array" },
      { "id": "e3", "source_node_id": "n3", "source_output": "result", "target_node_id": "n4", "target_input": "message" },
      { "id": "e4", "source_node_id": "n3", "source_output": "result", "target_node_id": "n5", "target_input": "body" }
    ]
  }', 'manual'),
  ('CSV ETL Pipeline', 'Load a CSV file, filter rows, transform data, and write cleaned output', 'Data', '🔄', '#f59e0b', ARRAY['csv', 'etl', 'transform', 'data'], 'beginner', '{
    "nodes": [
      {
        "id": "n1",
        "node_type_id": "files.parse_csv",
        "label": "Parse CSV",
        "position": { "x": 80, "y": 160 },
        "configuration": { "delimiter": ",", "has_header": true }
      },
      {
        "id": "n2",
        "node_type_id": "filter_array",
        "label": "Filter Rows",
        "position": { "x": 340, "y": 160 },
        "configuration": { "field": "status", "operator": "equals", "value": "active" }
      },
      {
        "id": "n3",
        "node_type_id": "sort_array",
        "label": "Sort by Date",
        "position": { "x": 580, "y": 160 },
        "configuration": { "field": "created_at", "direction": "desc" }
      },
      {
        "id": "n4",
        "node_type_id": "files.write",
        "label": "Write Output",
        "position": { "x": 820, "y": 160 },
        "configuration": { "path": "output/cleaned.json", "format": "json" }
      }
    ],
    "edges": [
      { "id": "e1", "source_node_id": "n1", "source_output": "rows", "target_node_id": "n2", "target_input": "array" },
      { "id": "e2", "source_node_id": "n2", "source_output": "result", "target_node_id": "n3", "target_input": "array" },
      { "id": "e3", "source_node_id": "n3", "source_output": "result", "target_node_id": "n4", "target_input": "data" }
    ]
  }', 'manual'),
  ('AI Support Triage', 'Classify incoming support tickets by sentiment and route to the right queue', 'AI', '🎯', '#ec4899', ARRAY['ai', 'support', 'classify', 'routing'], 'intermediate', '{
    "nodes": [
      {
        "id": "n1",
        "node_type_id": "webhook",
        "label": "Ticket Webhook",
        "position": { "x": 80, "y": 200 },
        "configuration": {}
      },
      {
        "id": "n2",
        "node_type_id": "ai.sentiment",
        "label": "Sentiment Analysis",
        "position": { "x": 320, "y": 200 },
        "configuration": {}
      },
      {
        "id": "n3",
        "node_type_id": "switch",
        "label": "Route by Sentiment",
        "position": { "x": 560, "y": 200 },
        "configuration": { "field": "sentiment", "cases": "positive,negative,neutral" }
      },
      {
        "id": "n4",
        "node_type_id": "slack",
        "label": "Urgent Queue",
        "position": { "x": 800, "y": 80 },
        "configuration": { "channel": "#urgent-support" }
      },
      {
        "id": "n5",
        "node_type_id": "slack",
        "label": "Standard Queue",
        "position": { "x": 800, "y": 320 },
        "configuration": { "channel": "#support-queue" }
      }
    ],
    "edges": [
      { "id": "e1", "source_node_id": "n1", "source_output": "body", "target_node_id": "n2", "target_input": "text" },
      { "id": "e2", "source_node_id": "n2", "source_output": "result", "target_node_id": "n3", "target_input": "input" },
      { "id": "e3", "source_node_id": "n3", "source_output": "negative", "target_node_id": "n4", "target_input": "message" },
      { "id": "e4", "source_node_id": "n3", "source_output": "positive", "target_node_id": "n5", "target_input": "message" }
    ]
  }', 'manual'),
  ('Daily Report Generator', 'Run on a schedule, collect metrics, generate AI summary, email the team', 'Reporting', '📊', '#06b6d4', ARRAY['schedule', 'ai', 'email', 'report'], 'intermediate', '{
    "nodes": [
      {
        "id": "n1",
        "node_type_id": "schedule",
        "label": "Daily at 9am",
        "position": { "x": 80, "y": 200 },
        "configuration": { "cron": "0 9 * * *" }
      },
      {
        "id": "n2",
        "node_type_id": "http_request",
        "label": "Fetch Metrics API",
        "position": { "x": 320, "y": 200 },
        "configuration": { "method": "GET", "url": "https://api.example.com/metrics" }
      },
      {
        "id": "n3",
        "node_type_id": "ai_chat",
        "label": "Generate Report",
        "position": { "x": 560, "y": 200 },
        "configuration": {
          "provider": "openai",
          "model": "gpt-4o",
          "system_prompt": "You are a business analyst. Generate a concise daily report from the metrics data provided."
        }
      },
      {
        "id": "n4",
        "node_type_id": "email_send",
        "label": "Email Team",
        "position": { "x": 800, "y": 200 },
        "configuration": {
          "to": "team@company.com",
          "subject": "Daily Report - {{date}}"
        }
      }
    ],
    "edges": [
      { "id": "e1", "source_node_id": "n1", "source_output": "trigger", "target_node_id": "n2", "target_input": "trigger" },
      { "id": "e2", "source_node_id": "n2", "source_output": "body", "target_node_id": "n3", "target_input": "message" },
      { "id": "e3", "source_node_id": "n3", "source_output": "reply", "target_node_id": "n4", "target_input": "body" }
    ]
  }', 'manual'),
  ('Multi-Step Approval', 'Submit a request via webhook, validate conditions, notify approvers, and log the decision', 'Operations', '✅', '#22c55e', ARRAY['approval', 'webhook', 'slack', 'conditional'], 'advanced', '{
    "nodes": [
      {
        "id": "n1",
        "node_type_id": "webhook",
        "label": "Request Webhook",
        "position": { "x": 80, "y": 240 },
        "configuration": {}
      },
      {
        "id": "n2",
        "node_type_id": "set_vars",
        "label": "Extract Fields",
        "position": { "x": 300, "y": 240 },
        "configuration": { "vars": "{\"requester\": \"{{body.requester}}\", \"amount\": \"{{body.amount}}\"}" }
      },
      {
        "id": "n3",
        "node_type_id": "if_condition",
        "label": "Amount > $1000?",
        "position": { "x": 520, "y": 240 },
        "configuration": { "field": "amount", "operator": "greater_than", "value": "1000" }
      },
      {
        "id": "n4",
        "node_type_id": "slack",
        "label": "Notify Senior Approver",
        "position": { "x": 760, "y": 140 },
        "configuration": { "channel": "#exec-approvals" }
      },
      {
        "id": "n5",
        "node_type_id": "slack",
        "label": "Notify Manager",
        "position": { "x": 760, "y": 340 },
        "configuration": { "channel": "#manager-approvals" }
      }
    ],
    "edges": [
      { "id": "e1", "source_node_id": "n1", "source_output": "body", "target_node_id": "n2", "target_input": "input" },
      { "id": "e2", "source_node_id": "n2", "source_output": "vars", "target_node_id": "n3", "target_input": "input" },
      { "id": "e3", "source_node_id": "n3", "source_output": "true", "target_node_id": "n4", "target_input": "message" },
      { "id": "e4", "source_node_id": "n3", "source_output": "false", "target_node_id": "n5", "target_input": "message" }
    ]
  }', 'manual'),
  ('AI Image Generation Pipeline', 'Take a text prompt, generate an image with AI, and upload it to storage', 'AI', '🎨', '#f97316', ARRAY['ai', 'image', 'generation', 'storage'], 'beginner', '{
    "nodes": [
      {
        "id": "n1",
        "node_type_id": "webhook",
        "label": "Prompt Input",
        "position": { "x": 80, "y": 200 },
        "configuration": {}
      },
      {
        "id": "n2",
        "node_type_id": "ai_image",
        "label": "Generate Image",
        "position": { "x": 320, "y": 200 },
        "configuration": { "provider": "openai", "size": "1024x1024", "quality": "standard", "model": "dall-e-3" }
      },
      {
        "id": "n3",
        "node_type_id": "supabase_db",
        "label": "Save to DB",
        "position": { "x": 580, "y": 200 },
        "configuration": { "operation": "insert", "table": "generated_images" }
      },
      {
        "id": "n4",
        "node_type_id": "slack",
        "label": "Share Result",
        "position": { "x": 820, "y": 200 },
        "configuration": { "channel": "#ai-outputs" }
      }
    ],
    "edges": [
      { "id": "e1", "source_node_id": "n1", "source_output": "body", "target_node_id": "n2", "target_input": "prompt" },
      { "id": "e2", "source_node_id": "n2", "source_output": "url", "target_node_id": "n3", "target_input": "data" },
      { "id": "e3", "source_node_id": "n2", "source_output": "url", "target_node_id": "n4", "target_input": "message" }
    ]
  }', 'manual')
ON CONFLICT DO NOTHING;

-- Ensure manual templates have an SEO title
UPDATE nexus_workflow_templates
SET seo_title = COALESCE(seo_title, name)
WHERE source = 'manual' AND seo_title IS NULL;
