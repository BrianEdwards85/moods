-- name: get_mood_entries(user_ids, include_archived, after_id, page_limit, viewer_id)
with entries as (
  select me.id, me.user_id, me.mood, me.notes, me.created_at, me.archived_at,
         me.mood - lag(me.mood) over (partition by me.user_id order by me.id) as delta
  from mood_entries me
  where (:user_ids::uuid[] IS NULL OR me.user_id = ANY(:user_ids::uuid[]))
    and (:include_archived::boolean OR me.archived_at IS NULL)
    and (
        :viewer_id::uuid IS NULL
        OR me.user_id = :viewer_id::uuid
        OR EXISTS (
            SELECT 1 FROM mood_shares ms
            WHERE ms.user_id = me.user_id
              AND ms.shared_with = :viewer_id::uuid
              AND ms.archived_at IS NULL
              AND (
                  NOT EXISTS (
                      SELECT 1 FROM mood_share_filters f
                      WHERE f.mood_share_id = ms.id AND f.is_include = true
                        AND f.archived_at IS NULL
                  )
                  OR EXISTS (
                      SELECT 1 FROM mood_share_filters f
                      JOIN mood_entry_tags met ON met.mood_entry_id = me.id
                      WHERE f.mood_share_id = ms.id
                        AND f.is_include = true
                        AND f.archived_at IS NULL
                        AND met.tag_name ~ f.pattern
                  )
              )
              AND NOT EXISTS (
                  SELECT 1 FROM mood_share_filters f
                  JOIN mood_entry_tags met ON met.mood_entry_id = me.id
                  WHERE f.mood_share_id = ms.id
                    AND f.is_include = false
                    AND f.archived_at IS NULL
                    AND met.tag_name ~ f.pattern
              )
        )
    )
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
