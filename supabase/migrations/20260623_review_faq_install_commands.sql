-- Review responses, listing FAQs, and multi-platform install commands

DO $$ BEGIN
  CREATE TYPE install_platform_enum AS ENUM (
    'CURSOR',
    'CLAUDE_CODE',
    'CLAUDE_DESKTOP',
    'WINDSURF',
    'VSCODE',
    'GITHUB_COPILOT',
    'CLI',
    'NPM',
    'MANUAL',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id)
);

CREATE TABLE IF NOT EXISTS listing_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listing_install_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  platform install_platform_enum NOT NULL,
  command TEXT NOT NULL,
  description TEXT,
  prerequisites TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_creator_id ON review_responses(creator_id);
CREATE INDEX IF NOT EXISTS idx_listing_faqs_listing_id ON listing_faqs(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_faqs_sort_order ON listing_faqs(listing_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_listing_install_commands_listing_id ON listing_install_commands(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_install_commands_platform ON listing_install_commands(listing_id, platform);

ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_install_commands ENABLE ROW LEVEL SECURITY;

-- review_responses policies
CREATE POLICY "Review responses are publicly viewable"
  ON review_responses FOR SELECT
  USING (true);

CREATE POLICY "Creators can insert responses to their listing reviews"
  ON review_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM reviews r
      JOIN listings l ON l.id = r.listing_id
      WHERE r.id = review_id
        AND l.creator_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Creators can update own review responses"
  ON review_responses FOR UPDATE
  TO authenticated
  USING (creator_id = (SELECT auth.uid()))
  WITH CHECK (creator_id = (SELECT auth.uid()));

CREATE POLICY "Creators can delete own review responses"
  ON review_responses FOR DELETE
  TO authenticated
  USING (creator_id = (SELECT auth.uid()));

-- listing_faqs policies
CREATE POLICY "Published FAQs are publicly viewable"
  ON listing_faqs FOR SELECT
  USING (published = true);

CREATE POLICY "Creators can view all FAQs on own listings"
  ON listing_faqs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.creator_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Creators can insert FAQs on own listings"
  ON listing_faqs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.creator_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Creators can update FAQs on own listings"
  ON listing_faqs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.creator_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.creator_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Creators can delete FAQs on own listings"
  ON listing_faqs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.creator_id = (SELECT auth.uid())
    )
  );

-- listing_install_commands policies
CREATE POLICY "Install commands are publicly viewable"
  ON listing_install_commands FOR SELECT
  USING (true);

CREATE POLICY "Creators can insert install commands on own listings"
  ON listing_install_commands FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.creator_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Creators can update install commands on own listings"
  ON listing_install_commands FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.creator_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.creator_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Creators can delete install commands on own listings"
  ON listing_install_commands FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.creator_id = (SELECT auth.uid())
    )
  );

GRANT ALL ON review_responses TO anon, authenticated, service_role;
GRANT ALL ON listing_faqs TO anon, authenticated, service_role;
GRANT ALL ON listing_install_commands TO anon, authenticated, service_role;
