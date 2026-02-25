-- name: get_shares_for_user(user_id)
select ms.id, ms.user_id, ms.shared_with, ms.created_at, ms.archived_at
from mood_shares ms
where ms.user_id = :user_id::uuid
  and ms.archived_at is null
order by ms.created_at;

-- name: get_filters_for_shares(share_ids)
select msf.id, msf.mood_share_id, msf.pattern, msf.is_include, msf.created_at, msf.archived_at
from mood_share_filters msf
where msf.mood_share_id = ANY(:share_ids::uuid[])
  and msf.archived_at is null;

-- name: archive_shares_for_user(user_id)!
update mood_shares
set archived_at = now()
where user_id = :user_id::uuid
  and archived_at is null;

-- name: archive_filters_for_shares(share_ids)!
update mood_share_filters
set archived_at = now()
where mood_share_id = ANY(:share_ids::uuid[])
  and archived_at is null;

-- name: create_share(user_id, shared_with)^
insert into mood_shares (user_id, shared_with)
values (:user_id::uuid, :shared_with::uuid)
on conflict (user_id, shared_with) do update
  set archived_at = null
returning id, user_id, shared_with, created_at, archived_at;

-- name: create_share_filter(mood_share_id, pattern, is_include)^
insert into mood_share_filters (mood_share_id, pattern, is_include)
values (:mood_share_id::uuid, :pattern, :is_include)
returning id, mood_share_id, pattern, is_include, created_at, archived_at;

-- name: get_push_recipients_for_entry(entry_user_id, mood_entry_id)
SELECT dt.token, u.id AS user_id, u.name, u.settings
FROM mood_shares ms
JOIN users u ON u.id = ms.shared_with AND u.archived_at IS NULL
JOIN user_device_tokens dt ON dt.user_id = u.id
WHERE ms.user_id = :entry_user_id::uuid
  AND ms.archived_at IS NULL
  AND (
      NOT EXISTS (
          SELECT 1 FROM mood_share_filters f
          WHERE f.mood_share_id = ms.id AND f.is_include = true
            AND f.archived_at IS NULL
      )
      OR EXISTS (
          SELECT 1 FROM mood_share_filters f
          JOIN mood_entry_tags met ON met.mood_entry_id = :mood_entry_id::uuid
          WHERE f.mood_share_id = ms.id
            AND f.is_include = true
            AND f.archived_at IS NULL
            AND met.tag_name ~ f.pattern
      )
  )
  AND NOT EXISTS (
      SELECT 1 FROM mood_share_filters f
      JOIN mood_entry_tags met ON met.mood_entry_id = :mood_entry_id::uuid
      WHERE f.mood_share_id = ms.id
        AND f.is_include = false
        AND f.archived_at IS NULL
        AND met.tag_name ~ f.pattern
  );
