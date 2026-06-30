-- Remove overly permissive INSERT policies flagged by Supabase advisors.
-- service_role bypasses RLS for server-side writes.

DROP POLICY IF EXISTS "System can insert email logs" ON public.email_logs;

DROP POLICY IF EXISTS "System can create referrals" ON public.referrals;

CREATE POLICY "Users create referrals as referrer"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (referrer_id = auth.uid());

DROP POLICY IF EXISTS "Service inserts milestones" ON public.user_milestones;

CREATE POLICY "Users insert own milestones"
ON public.user_milestones
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
