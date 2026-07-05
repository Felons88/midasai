-- Extend existing notifications table with new columns
-- Existing: id, user_id, title, message, read, created_at, type (notification_type_enum)

-- Add new enum values to notification_type_enum
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'BILLING';
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'PROMOTIONS';
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'MARKETPLACE';
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'MESSAGES';
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'LEADS';
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'JOBS';
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'AI_ASSISTANT';
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'ANNOUNCEMENTS';

-- Add missing columns
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS action_url text,
  ADD COLUMN IF NOT EXISTS action_label text,
  ADD COLUMN IF NOT EXISTS icon_name text,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Index for fast unread counts
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

-- Mark all read function
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = now()
  WHERE user_id = p_user_id AND is_read = false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read(uuid) TO authenticated;

-- Helper to create a notification (used by edge functions / AI engine)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_priority text DEFAULT 'NORMAL',
  p_action_url text DEFAULT NULL,
  p_action_label text DEFAULT NULL,
  p_icon_name text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, priority, action_url, action_label, icon_name, metadata)
  VALUES (p_user_id, p_type::notification_type_enum, p_title, p_message, p_priority, p_action_url, p_action_label, p_icon_name, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, text, text, text, jsonb) TO service_role;
