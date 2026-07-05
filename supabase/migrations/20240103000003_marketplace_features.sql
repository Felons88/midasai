-- ── Saved Searches ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_searches (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  query       text,
  filters     jsonb NOT NULL DEFAULT '{}',
  alert_email boolean NOT NULL DEFAULT false,
  alert_push  boolean NOT NULL DEFAULT true,
  last_alerted_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'saved_searches' AND policyname = 'Users manage own saved searches'
  ) THEN
    CREATE POLICY "Users manage own saved searches" ON saved_searches USING (auth.uid() = user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS saved_searches_user_idx ON saved_searches(user_id);

-- ── Watchlists ─────────────────────────────────────────────────────────────
CREATE TYPE watchlist_item_type AS ENUM ('LISTING', 'CREATOR', 'SEARCH');

CREATE TABLE IF NOT EXISTS watchlist_items (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type   watchlist_item_type NOT NULL,
  item_id     uuid NOT NULL,
  label       text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'watchlist_items' AND policyname = 'Users manage own watchlist'
  ) THEN
    CREATE POLICY "Users manage own watchlist" ON watchlist_items USING (auth.uid() = user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS watchlist_user_idx ON watchlist_items(user_id);

-- ── Milestones / Gamification ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_milestones (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_key text NOT NULL,
  achieved_at  timestamptz NOT NULL DEFAULT now(),
  metadata     jsonb,
  UNIQUE (user_id, milestone_key)
);
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_milestones' AND policyname = 'Users read own milestones'
  ) THEN
    CREATE POLICY "Users read own milestones" ON user_milestones FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_milestones' AND policyname = 'Service inserts milestones'
  ) THEN
    CREATE POLICY "Service inserts milestones" ON user_milestones FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ── Activity Feed ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_feed (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type  text NOT NULL,
  entity_type text NOT NULL,
  entity_id   uuid,
  entity_title text,
  metadata    jsonb,
  is_public   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'activity_feed' AND policyname = 'Public activity is readable by all'
  ) THEN
    CREATE POLICY "Public activity is readable by all" ON activity_feed FOR SELECT USING (is_public = true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'activity_feed' AND policyname = 'Service can insert activity'
  ) THEN
    CREATE POLICY "Service can insert activity" ON activity_feed FOR INSERT WITH CHECK (true);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS activity_feed_created_idx ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_feed_actor_idx ON activity_feed(actor_id);
CREATE INDEX IF NOT EXISTS activity_feed_entity_idx ON activity_feed(entity_type, entity_id);
