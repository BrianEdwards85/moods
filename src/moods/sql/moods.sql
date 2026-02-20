-- name: get_mood_entries(user_id, include_archived, after_id, page_limit)
select me.id, me.user_id, me.mood, me.notes, me.created_at, me.archived_at
from mood_entries me
where (:user_id::uuid IS NULL OR me.user_id = :user_id::uuid)
  and (:include_archived::boolean OR me.archived_at IS NULL)
  and (:after_id::uuid IS NULL OR me.id < :after_id::uuid)
order by me.id desc
limit :page_limit;

-- name: create_mood_entry(user_id, mood, notes)^
insert into mood_entries (user_id, mood, notes)
values (:user_id, :mood, :notes)
returning id, user_id, mood, notes, created_at, archived_at;

-- name: archive_mood_entry(id)^
update mood_entries
set archived_at = now()
where id = :id
  and archived_at is null
returning id, user_id, mood, notes, created_at, archived_at;

-- name: add_mood_entry_tag(mood_entry_id, tag_name)!
insert into mood_entry_tags (mood_entry_id, tag_name)
values (:mood_entry_id, lower(:tag_name));

-- name: get_tags_for_entries(mood_entry_ids)
select met.mood_entry_id, t.name, t.metadata, t.archived_at
from tags t
join mood_entry_tags met on met.tag_name = t.name
where met.mood_entry_id = ANY(:mood_entry_ids::uuid[]);
