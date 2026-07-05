-- Notifications system
CREATE TYPE notification_category AS ENUM (
  'SYSTEM', 'BILLING', 'PROMOTIONS', 'MARKETPLACE',
  'MESSAGES', 'LEADS', 'JOBS', 'AI_ASSISTANT', 'ANNOUNCEMENTS'
);

CREATE TYPE notification_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TABLE IF NOT EXISTS notifications (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category     notification_category NOT NULL DEFAULT 'SYSTEM',
  priority     notification_priority NOT NULL DEFAULT 'NORMAL',
  title        text NOT NULL,
  body         text NOT NULL,
  action_url   text,
  action_label text,
  icon_name    text,
  image_url    text,
  is_read      boolean NOT NULL DEFAULT false,
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz,
  metadata     jsonb
);

-- Handle column name migration from 'read' to 'is_read' if table already exists
DO $$
BEGIN
  -- If table exists with old 'read' column, rename it
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
      ALTER TABLE notifications RENAME COLUMN read TO is_read;
    END IF;
    
    -- Ensure is_read column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
      ALTER TABLE notifications ADD COLUMN is_read boolean NOT NULL DEFAULT false;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS notifications_user_id_idx      ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx   ON notifications(created_at DESC);

-- Create read index only after ensuring column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
    CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, is_read);
  END IF;
END $$;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can read own notifications'
  ) THEN
    CREATE POLICY "Users can read own notifications"
      ON notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
      ON notifications FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Service can insert notifications'
  ) THEN
    CREATE POLICY "Service can insert notifications"
      ON notifications FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = now()
  WHERE user_id = p_user_id AND is_read = false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read(uuid) TO authenticated;
