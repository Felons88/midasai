-- Workflow Conversation Memory & File Change History System
-- Migration: 20260630_workflow_conversation_memory

-- Conversation memory history for each workflow (internal, not shown to user)
CREATE TABLE IF NOT EXISTS public.workflow_conversation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expansion_id UUID NOT NULL REFERENCES public.workflow_expansions(id) ON DELETE CASCADE,
  -- Internal conversation messages (AI assistant internal reasoning)
  conversation_history JSONB DEFAULT '[]'::jsonb,
  -- File modification tracking: { filename: { purpose: "...", timestamp: "...", round: N } }
  file_change_purposes JSONB DEFAULT '{}'::jsonb,
  -- Additional context for future rounds
  context_snapshot JSONB DEFAULT '{}'::jsonb,
  -- Track last interaction round
  last_round INTEGER DEFAULT 0,
  -- Track total interactions
  total_interactions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_conversation_memory_expansion_id
  ON public.workflow_conversation_memory(expansion_id);
CREATE INDEX IF NOT EXISTS idx_workflow_conversation_memory_updated_at
  ON public.workflow_conversation_memory(updated_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_workflow_conversation_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_workflow_conversation_memory_updated_at ON public.workflow_conversation_memory;
CREATE TRIGGER trg_workflow_conversation_memory_updated_at
  BEFORE UPDATE ON public.workflow_conversation_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_workflow_conversation_memory_updated_at();

-- Revoke public execute on trigger function
REVOKE ALL ON FUNCTION public.handle_workflow_conversation_memory_updated_at() FROM PUBLIC;

-- RLS
ALTER TABLE public.workflow_conversation_memory ENABLE ROW LEVEL SECURITY;

-- Users can only see their own workflow memory via the expansion
CREATE POLICY "workflow_conversation_memory_select_via_expansion"
  ON public.workflow_conversation_memory FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workflow_expansions
    WHERE id = expansion_id AND user_id = auth.uid()
  ));

CREATE POLICY "workflow_conversation_memory_insert_via_expansion"
  ON public.workflow_conversation_memory FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workflow_expansions
    WHERE id = expansion_id AND user_id = auth.uid()
  ));

CREATE POLICY "workflow_conversation_memory_update_via_expansion"
  ON public.workflow_conversation_memory FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workflow_expansions
    WHERE id = expansion_id AND user_id = auth.uid()
  ));

CREATE POLICY "workflow_conversation_memory_delete_via_expansion"
  ON public.workflow_conversation_memory FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workflow_expansions
    WHERE id = expansion_id AND user_id = auth.uid()
  ));

-- Modify workflow_expansions to add memory reference
-- This allows quick lookup without joining
ALTER TABLE public.workflow_expansions
  ADD COLUMN IF NOT EXISTS latest_memory_id UUID REFERENCES public.workflow_conversation_memory(id) ON DELETE SET NULL;