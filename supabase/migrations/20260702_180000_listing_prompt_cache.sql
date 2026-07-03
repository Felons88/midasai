CREATE TABLE IF NOT EXISTS listing_prompts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  github_url text NOT NULL,
  prompt text NOT NULL,
  skill_md_missing boolean DEFAULT false,
  skill_md_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(listing_id)
);

ALTER TABLE listing_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cached prompts"
  ON listing_prompts
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = listing_prompts.listing_id
      AND listings.status = 'ACTIVE'
  ));

CREATE POLICY "Service role manage cached prompts"
  ON listing_prompts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_listing_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS listing_prompts_updated_at
  BEFORE UPDATE ON listing_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_prompts_updated_at();
