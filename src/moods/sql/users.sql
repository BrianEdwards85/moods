-- name: get_users()
select id, name, email, settings
from users
order by name;

-- name: get_users_by_ids(ids)
select id, name, email, settings
from users
where id = ANY(:ids::uuid[]);

-- name: create_user(name, email)^
insert into users (name, email)
values (:name, :email)
returning id, name, email, settings;

-- name: update_user_settings(id, settings)^
update users
set settings = :settings
where id = :id::uuid
returning id, name, email, settings;
