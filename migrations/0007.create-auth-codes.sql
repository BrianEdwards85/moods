-- depends: 0006.tags-trgm-search

CREATE TABLE IF NOT EXISTS auth_codes (
    id          uuid        PRIMARY KEY DEFAULT uuidv7(),
    user_id     uuid        NOT NULL REFERENCES users (id),
    code        text        NOT NULL,
    expires_at  timestamptz NOT NULL,
    used_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_auth_codes_lookup
    ON auth_codes (user_id, code) WHERE used_at IS NULL;
