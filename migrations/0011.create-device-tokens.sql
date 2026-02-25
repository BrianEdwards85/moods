-- depends: 0010.users-trgm-search
CREATE TABLE IF NOT EXISTS user_device_tokens (
    id         uuid        PRIMARY KEY DEFAULT uuidv7(),
    user_id    uuid        NOT NULL REFERENCES users (id),
    token      text        NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, token)
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON user_device_tokens (user_id);
