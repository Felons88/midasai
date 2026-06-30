-- Update delete policy to allow IMPORTED workflows to be deleted
DROP POLICY IF EXISTS "workflow_expansions_delete_own" ON public.workflow_expansions;
CREATE POLICY "workflow_expansions_delete_own"
  ON public.workflow_expansions FOR DELETE
  USING (auth.uid() = user_id AND status IN ('DRAFT', 'FAILED', 'IMPORTED'));
