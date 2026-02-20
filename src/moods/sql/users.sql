-- name: get_users()
select id, name, email
from users
order by name;

-- name: get_users_by_ids(ids)
select id, name, email
from users
where id = ANY(:ids::uuid[]);

-- name: create_user(name, email)^
insert into users (name, email)
values (:name, :email)
returning id, name, email;
