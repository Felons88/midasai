-- Nexus Database Schema
-- AI-powered directory optimization and automation platform

-- Nexus Directories Table
CREATE TABLE IF NOT EXISTS nexus_directories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('skill','model','workflow','agent')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nexus Nodes Table
CREATE TABLE IF NOT EXISTS nexus_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  inputs INTEGER NOT NULL DEFAULT 0,
  outputs INTEGER NOT NULL DEFAULT 0,
  configuration_schema JSONB DEFAULT '{}',
  implementation TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nexus Connections Table
CREATE TABLE IF NOT EXISTS nexus_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- IDE, Browser, Desktop
  status TEXT NOT NULL DEFAULT 'disconnected', -- connected, disconnected, pending
  connection_config JSONB DEFAULT '{}',
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nexus Workflows Table
CREATE TABLE IF NOT EXISTS nexus_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  definition JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_execution_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nexus Workflow Executions Table
CREATE TABLE IF NOT EXISTS nexus_workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES nexus_workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','cancelled')),
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  node_results JSONB DEFAULT '[]',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nexus_dirs_user_id ON nexus_directories(user_id);
CREATE INDEX IF NOT EXISTS idx_nexus_dirs_org_id ON nexus_directories(organization_id);
CREATE INDEX IF NOT EXISTS idx_nexus_dirs_type ON nexus_directories(type);
CREATE INDEX IF NOT EXISTS idx_nexus_nodes_category ON nexus_nodes(category);
CREATE INDEX IF NOT EXISTS idx_nexus_connections_user_id ON nexus_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_nexus_workflows_user_id ON nexus_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_nexus_workflows_org_id ON nexus_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_nexus_executions_workflow_id ON nexus_workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_nexus_executions_user_id ON nexus_workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_nexus_executions_status ON nexus_workflow_executions(status);

-- RLS Policies
ALTER TABLE nexus_directories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_workflow_executions ENABLE ROW LEVEL SECURITY;

-- Directories RLS
CREATE POLICY "Users can view their own directories" ON nexus_directories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own directories" ON nexus_directories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own directories" ON nexus_directories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own directories" ON nexus_directories
  FOR DELETE USING (auth.uid() = user_id);

-- Nodes RLS (Public read, admin write)
CREATE POLICY "Anyone can view nodes" ON nexus_nodes
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert nodes" ON nexus_nodes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update nodes" ON nexus_nodes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete nodes" ON nexus_nodes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Connections RLS
CREATE POLICY "Users can view their own connections" ON nexus_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections" ON nexus_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" ON nexus_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" ON nexus_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Workflows RLS
CREATE POLICY "Users can view their own workflows" ON nexus_workflows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workflows" ON nexus_workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows" ON nexus_workflows
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows" ON nexus_workflows
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Organization members can view org workflows" ON nexus_workflows
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Workflow Executions RLS
CREATE POLICY "Users can view their own executions" ON nexus_workflow_executions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own executions" ON nexus_workflow_executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own executions" ON nexus_workflow_executions
  FOR UPDATE USING (auth.uid() = user_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_nexus_directories_updated_at BEFORE UPDATE ON nexus_directories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nexus_nodes_updated_at BEFORE UPDATE ON nexus_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nexus_connections_updated_at BEFORE UPDATE ON nexus_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nexus_workflows_updated_at BEFORE UPDATE ON nexus_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default nodes
INSERT INTO nexus_nodes (name, description, category, icon, inputs, outputs, implementation) VALUES
  ('AI Chat', 'Chat with AI models', 'ai', 'Cpu', 1, 1, 'ai_chat'),
  ('Image Generation', 'Generate images with AI', 'ai', 'Cpu', 1, 1, 'image_generation'),
  ('Database Query', 'Query PostgreSQL database', 'database', 'Database', 2, 1, 'database_query'),
  ('Cloud Storage', 'Upload to cloud storage', 'cloud', 'Cloud', 1, 1, 'cloud_storage'),
  ('Conditional Logic', 'Branch based on conditions', 'logic', 'GitBranch', 2, 2, 'conditional_logic'),
  ('HTTP Request', 'Make HTTP requests', 'developer', 'Globe', 1, 1, 'http_request'),
  ('File Read', 'Read file contents', 'files', 'FileCode', 1, 1, 'file_read'),
  ('Analytics', 'Track analytics events', 'analytics', 'BarChart3', 1, 0, 'analytics'),
  ('Midas API', 'Call Midas marketplace API', 'midas', 'Puzzle', 1, 1, 'midas_api')
ON CONFLICT DO NOTHING;
