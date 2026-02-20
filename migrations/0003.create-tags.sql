-- depends: 0002.create-mood-entries

CREATE TABLE IF NOT EXISTS tags (
    name        text        PRIMARY KEY,
    metadata    jsonb       NOT NULL DEFAULT '{}',
    archived_at timestamptz,
    search_vec  tsvector    GENERATED ALWAYS AS (to_tsvector('english', name)) STORED
);

CREATE INDEX IF NOT EXISTS idx_tags_search_vec ON tags USING gin (search_vec);

CREATE TABLE IF NOT EXISTS mood_entry_tags (
    mood_entry_id   uuid    NOT NULL REFERENCES mood_entries (id),
    tag_name        text    NOT NULL REFERENCES tags (name),
    PRIMARY KEY (mood_entry_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_mood_entry_tags_tag_name ON mood_entry_tags (tag_name);
