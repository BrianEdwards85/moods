-- depends: 0001.create-users

CREATE TABLE IF NOT EXISTS mood_entries (
    id          uuid            PRIMARY KEY DEFAULT uuidv7(),
    user_id     uuid            NOT NULL REFERENCES users (id),
    mood        integer         NOT NULL,
    notes       text            NOT NULL,
    created_at  timestamptz     NOT NULL DEFAULT now(),
    archived_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at ON mood_entries (created_at);
