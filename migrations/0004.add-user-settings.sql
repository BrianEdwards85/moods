-- Add settings JSON field to users
-- depends: 0001.create-users

ALTER TABLE users ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}';
