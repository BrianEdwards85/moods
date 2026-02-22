-- name: get_mood_entries(user_ids, include_archived, after_id, page_limit)
with entries as (
  select me.id, me.user_id, me.mood, me.notes, me.created_at, me.archived_at,
         me.mood - lag(me.mood) over (partition by me.user_id order by me.id) as delta
  from mood_entries me
  where (:user_ids::uuid[] IS NULL OR me.user_id = ANY(:user_ids::uuid[]))
    and (:include_archived::boolean OR me.archived_at IS NULL)
)
select id, user_id, mood, notes, created_at, archived_at, delta
from entries
where (:after_id::uuid IS NULL OR id < :after_id::uuid)
order by id desc
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
