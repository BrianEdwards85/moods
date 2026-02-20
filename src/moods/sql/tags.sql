-- name: get_tags(include_archived, after_name, page_limit)
select name, metadata, archived_at
from tags
where (:include_archived::boolean OR archived_at IS NULL)
  and (:after_name::text IS NULL OR name > :after_name)
order by name
limit :page_limit;

-- name: search_tags(query, include_archived, after_name, page_limit)
select name, metadata, archived_at
from tags
where name % :query
  and (:include_archived::boolean OR archived_at IS NULL)
  and (:after_name::text IS NULL OR name > :after_name)
order by similarity(name, :query) desc, name
limit :page_limit;

-- name: ensure_tag(name)!
insert into tags (name)
values (lower(:name))
on conflict do nothing;

-- name: update_tag_metadata(name, metadata)^
update tags
set metadata = :metadata::jsonb
where name = :name
returning name, metadata, archived_at;

-- name: archive_tag(name)^
update tags
set archived_at = now()
where name = :name
  and archived_at is null
returning name, metadata, archived_at;

-- name: unarchive_tag(name)^
update tags
set archived_at = null
where name = :name
  and archived_at is not null
returning name, metadata, archived_at;
