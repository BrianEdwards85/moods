-- Add archived_at timestamp to users
-- depends: 0001.create-users

ALTER TABLE users ADD COLUMN IF NOT EXISTS archived_at timestamptz;
