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

CREATE INDEX notifications_user_id_idx      ON notifications(user_id);
CREATE INDEX notifications_user_read_idx    ON notifications(user_id, is_read);
CREATE INDEX notifications_created_at_idx   ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

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
