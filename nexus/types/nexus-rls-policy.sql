CREATE POLICY public nexus_read_policy ON listings FOR SELECT
TO public
USING (type = ANY ARRAY['skill', 'agent']);

CREATE POLICY public nexus_write_policy ON listings FOR INSERT, UPDATE, DELETE
TO "owner"
USING (owner = current_user);