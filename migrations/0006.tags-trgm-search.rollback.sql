DROP INDEX IF EXISTS idx_tags_name_trgm;

ALTER TABLE tags ADD COLUMN IF NOT EXISTS search_vec tsvector
    GENERATED ALWAYS AS (to_tsvector('english', name)) STORED;

CREATE INDEX IF NOT EXISTS idx_tags_search_vec ON tags USING gin (search_vec);
