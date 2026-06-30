-- Changelog confirm tracking + upsert support on reads

ALTER TABLE platform_announcement_reads
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS action TEXT;

DROP POLICY IF EXISTS platform_announcement_reads_update_own ON platform_announcement_reads;
CREATE POLICY platform_announcement_reads_update_own ON platform_announcement_reads
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
