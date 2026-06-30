-- Platform-wide announcements (changelog popups, banners) and per-user dismissals

DO $$ BEGIN
  CREATE TYPE platform_announcement_kind AS ENUM ('CHANGELOG', 'BANNER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind platform_announcement_kind NOT NULL DEFAULT 'CHANGELOG',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  version TEXT,
  action_url TEXT,
  action_label TEXT,
  target_role role_enum,
  active BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_announcement_reads (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES platform_announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_announcements_active
  ON platform_announcements (active, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_announcement_reads_user
  ON platform_announcement_reads (user_id);

ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_announcement_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_announcements_read_active ON platform_announcements;
CREATE POLICY platform_announcements_read_active ON platform_announcements
  FOR SELECT TO authenticated
  USING (active = true);

DROP POLICY IF EXISTS platform_announcement_reads_select_own ON platform_announcement_reads;
CREATE POLICY platform_announcement_reads_select_own ON platform_announcement_reads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS platform_announcement_reads_insert_own ON platform_announcement_reads;
CREATE POLICY platform_announcement_reads_insert_own ON platform_announcement_reads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
