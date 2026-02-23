-- depends: 0007.create-auth-codes

CREATE TABLE IF NOT EXISTS mood_shares (
    id            uuid        PRIMARY KEY DEFAULT uuidv7(),
    user_id       uuid        NOT NULL REFERENCES users (id),
    shared_with   uuid        NOT NULL REFERENCES users (id),
    created_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, shared_with),
    CHECK (user_id != shared_with)
);

CREATE TABLE IF NOT EXISTS mood_share_filters (
    id            uuid        PRIMARY KEY DEFAULT uuidv7(),
    mood_share_id uuid        NOT NULL REFERENCES mood_shares (id) ON DELETE CASCADE,
    pattern       text        NOT NULL,
    is_include    boolean     NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mood_shares_lookup
    ON mood_shares (shared_with, user_id);
