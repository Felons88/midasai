-- Add current_file tracking for workflow analysis progress
-- Migration: 20260702_workflow_expansions_current_file

ALTER TABLE public.workflow_expansions
ADD COLUMN IF NOT EXISTS current_file TEXT;

CREATE INDEX IF NOT EXISTS idx_workflow_expansions_current_file
  ON public.workflow_expansions(current_file)
  WHERE current_file IS NOT NULL;
