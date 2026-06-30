-- Fix listings_search_vector_update trigger
-- BUG: COALESCE(NEW.tags, '') tries to coalesce a text[] array with an empty
-- string, which Postgres casts to text[] and fails with:
--   "malformed array literal: \"\"" (SQLSTATE 22P02)
-- This fired on EVERY insert into listings.
-- FIX: use array_to_string() to flatten the tags array into searchable text.

CREATE OR REPLACE FUNCTION listings_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
