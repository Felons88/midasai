-- Model Performance Tracking Table
-- Tracks AI model performance metrics for continuous improvement

CREATE TABLE IF NOT EXISTS model_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT NOT NULL,
  version TEXT NOT NULL,
  accuracy FLOAT NOT NULL,
  precision FLOAT,
  recall FLOAT,
  f1_score FLOAT,
  loss FLOAT,
  training_samples INTEGER,
  inference_time_ms INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_model_performance_model ON model_performance(model_name);
CREATE INDEX IF NOT EXISTS idx_model_performance_version ON model_performance(version);
CREATE INDEX IF NOT EXISTS idx_model_performance_recorded_at ON model_performance(recorded_at);

COMMENT ON TABLE model_performance IS 'AI model performance metrics for continuous improvement tracking.';

-- RLS Policy
ALTER TABLE model_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_performance_public_read" ON model_performance
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "model_performance_system_write" ON model_performance
  FOR INSERT TO authenticated USING (created_by = auth.uid());