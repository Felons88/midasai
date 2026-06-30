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
CREATE POLICY "Users manage own saved searches" ON saved_searches USING (auth.uid() = user_id);
CREATE INDEX saved_searches_user_idx ON saved_searches(user_id);

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
CREATE POLICY "Users manage own watchlist" ON watchlist_items USING (auth.uid() = user_id);
CREATE INDEX watchlist_user_idx ON watchlist_items(user_id);

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
CREATE POLICY "Users read own milestones" ON user_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service inserts milestones" ON user_milestones FOR INSERT WITH CHECK (true);

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
CREATE POLICY "Public activity is readable by all" ON activity_feed FOR SELECT USING (is_public = true);
CREATE POLICY "Service can insert activity" ON activity_feed FOR INSERT WITH CHECK (true);
CREATE INDEX activity_feed_created_idx ON activity_feed(created_at DESC);
CREATE INDEX activity_feed_actor_idx ON activity_feed(actor_id);
CREATE INDEX activity_feed_entity_idx ON activity_feed(entity_type, entity_id);
