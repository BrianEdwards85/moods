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
returning id, user_id, shared_with, created_at, archived_at;

-- name: create_share_filter(mood_share_id, pattern, is_include)^
insert into mood_share_filters (mood_share_id, pattern, is_include)
values (:mood_share_id::uuid, :pattern, :is_include)
returning id, mood_share_id, pattern, is_include, created_at, archived_at;
