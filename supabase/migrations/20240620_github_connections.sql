-- Create GitHub connections table
CREATE TABLE IF NOT EXISTS github_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  github_user_id TEXT NOT NULL,
  github_username TEXT NOT NULL,
  github_access_token TEXT NOT NULL,
  github_refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  avatar_url TEXT,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Constraints
  UNIQUE(user_id),
  UNIQUE(github_user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_github_connections_user_id ON github_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_github_connections_github_user_id ON github_connections(github_user_id);

-- RLS Policies
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own GitHub connections
CREATE POLICY "Users can view own GitHub connections" ON github_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own GitHub connections" ON github_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own GitHub connections" ON github_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own GitHub connections" ON github_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_github_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_github_connections_updated_at
  BEFORE UPDATE ON github_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_github_connections_updated_at();
