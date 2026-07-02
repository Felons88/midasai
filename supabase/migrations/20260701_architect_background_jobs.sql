-- Background Jobs table for Architect workshop processing
-- Migration: 20260701_architect_background_jobs

-- Create background jobs table
CREATE TABLE IF NOT EXISTS public.architect_background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'architect_generate' CHECK (type IN ('architect_generate', 'architect_analyze')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_file TEXT,
  current_step TEXT,
  file_queue JSONB, -- Array of files: [{name: string, status: 'pending'|'processing'|'completed'|'failed'}]
  completed_files JSONB DEFAULT '[]'::jsonb,
  failed_files JSONB DEFAULT '[]'::jsonb,
  error TEXT,
  session_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_architect_background_jobs_user_id
  ON public.architect_background_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_architect_background_jobs_session_id
  ON public.architect_background_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_architect_background_jobs_status
  ON public.architect_background_jobs(status);
CREATE INDEX IF NOT EXISTS idx_architect_background_jobs_job_id
  ON public.architect_background_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_architect_background_jobs_created_at
  ON public.architect_background_jobs(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_architect_background_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_architect_background_jobs_updated_at ON public.architect_background_jobs;
CREATE TRIGGER trg_architect_background_jobs_updated_at
  BEFORE UPDATE ON public.architect_background_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_architect_background_jobs_updated_at();

-- Revoke public execute on trigger function
REVOKE ALL ON FUNCTION public.handle_architect_background_jobs_updated_at() FROM PUBLIC;

-- RLS Policies
ALTER TABLE public.architect_background_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own jobs
CREATE POLICY "architect_background_jobs_select_own"
  ON public.architect_background_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "architect_background_jobs_insert_own"
  ON public.architect_background_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "architect_background_jobs_update_own"
  ON public.architect_background_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all jobs (for background workers)
CREATE POLICY "architect_background_jobs_service_role"
  ON public.architect_background_jobs FOR ALL
  TO service_role
  USING (true);

-- Soft delete for workflows - add deleted_at column
ALTER TABLE public.workflow_expansions
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Index for soft deleted workflows
CREATE INDEX IF NOT EXISTS idx_workflow_expansions_deleted_at
  ON public.workflow_expansions(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Index for archived workflows
CREATE INDEX IF NOT EXISTS idx_workflow_expansions_archived_at
  ON public.workflow_expansions(archived_at)
  WHERE archived_at IS NOT NULL;