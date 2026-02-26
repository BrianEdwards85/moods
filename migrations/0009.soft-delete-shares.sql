-- depends: 0008.create-mood-shares
ALTER TABLE mood_shares ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE mood_share_filters ADD COLUMN IF NOT EXISTS archived_at timestamptz;
