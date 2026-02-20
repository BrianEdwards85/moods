-- depends: 0003.create-tags

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP INDEX IF EXISTS idx_tags_search_vec;
ALTER TABLE tags DROP COLUMN IF EXISTS search_vec;

CREATE INDEX IF NOT EXISTS idx_tags_name_trgm ON tags USING gin (name gin_trgm_ops);
