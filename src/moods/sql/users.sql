-- name: get_users(include_archived)
select id, name, email, icon, settings, archived_at
from users
where (:include_archived::boolean IS TRUE OR archived_at IS NULL)
order by name;

-- name: get_users_by_ids(ids)
select id, name, email, icon, settings, archived_at
from users
where id = ANY(:ids::uuid[]);

-- name: create_user(name, email)^
insert into users (name, email, icon)
values (:name, :email, 'https://www.gravatar.com/avatar/' || md5(lower(trim(:email))) || '?s=80&d=retro')
returning id, name, email, icon, settings, archived_at;

-- name: update_user_settings(id, settings)^
update users
set settings = :settings
where id = :id::uuid
returning id, name, email, icon, settings, archived_at;

-- name: archive_user(id)^
update users
set archived_at = now()
where id = :id::uuid
returning id, name, email, icon, settings, archived_at;

-- name: search_users(query, page_limit)
select id, name, email, icon, settings, archived_at
from users
where (name % :query or email % :query)
  and archived_at is null
order by greatest(similarity(name, :query), similarity(email, :query)) desc, name
limit :page_limit;
