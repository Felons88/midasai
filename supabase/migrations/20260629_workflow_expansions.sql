-- Workflow Expansion Engine + Architecture History System
-- Migration: 20260629_workflow_expansions

-- Enum for workflow expansion lifecycle
DO $$ BEGIN
  CREATE TYPE public.workflow_expansion_status AS ENUM (
    'DRAFT',
    'INITIALIZING',
    'RUNNING',
    'PROCESSING_AI',
    'GENERATING_FILES',
    'COMPLETED',
    'FAILED',
    'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Main workflow expansions table
CREATE TABLE IF NOT EXISTS public.workflow_expansions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.architect_sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.workflow_expansion_status NOT NULL DEFAULT 'DRAFT',
  -- AI pipeline tracking
  pipeline_stage TEXT,
  pipeline_progress INTEGER DEFAULT 0,
  -- Source artifacts
  source_artifacts JSONB DEFAULT '[]'::jsonb,
  -- Generated output files
  generated_files JSONB DEFAULT '{}'::jsonb,
  file_count INTEGER DEFAULT 0,
  -- GitHub integration
  github_repo_url TEXT,
  github_commit_sha TEXT,
  github_push_status TEXT,
  -- Metadata
  expansion_config JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_expansions_user_id ON public.workflow_expansions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_expansions_status ON public.workflow_expansions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_expansions_user_status ON public.workflow_expansions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_expansions_created_at ON public.workflow_expansions(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_workflow_expansion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_workflow_expansions_updated_at ON public.workflow_expansions;
CREATE TRIGGER trg_workflow_expansions_updated_at
  BEFORE UPDATE ON public.workflow_expansions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_workflow_expansion_updated_at();

-- Revoke public execute on trigger function
REVOKE ALL ON FUNCTION public.handle_workflow_expansion_updated_at() FROM PUBLIC;

-- RLS
ALTER TABLE public.workflow_expansions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own workflow expansions
CREATE POLICY "workflow_expansions_select_own"
  ON public.workflow_expansions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own
CREATE POLICY "workflow_expansions_insert_own"
  ON public.workflow_expansions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own
CREATE POLICY "workflow_expansions_update_own"
  ON public.workflow_expansions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own DRAFT or FAILED expansions
CREATE POLICY "workflow_expansions_delete_own"
  ON public.workflow_expansions FOR DELETE
  USING (auth.uid() = user_id AND status IN ('DRAFT', 'FAILED'));

-- Workflow expansion pipeline steps tracking table
CREATE TABLE IF NOT EXISTS public.workflow_expansion_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expansion_id UUID NOT NULL REFERENCES public.workflow_expansions(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  output JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expansion_steps_expansion_id ON public.workflow_expansion_steps(expansion_id);

ALTER TABLE public.workflow_expansion_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expansion_steps_select_via_expansion"
  ON public.workflow_expansion_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workflow_expansions
    WHERE id = expansion_id AND user_id = auth.uid()
  ));

CREATE POLICY "expansion_steps_insert_via_expansion"
  ON public.workflow_expansion_steps FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workflow_expansions
    WHERE id = expansion_id AND user_id = auth.uid()
  ));

CREATE POLICY "expansion_steps_update_via_expansion"
  ON public.workflow_expansion_steps FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workflow_expansions
    WHERE id = expansion_id AND user_id = auth.uid()
  ));
