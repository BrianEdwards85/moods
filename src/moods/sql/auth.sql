-- name: create_auth_code(user_id, code, expires_at)^
insert into auth_codes (user_id, code, expires_at)
values (:user_id, :code, :expires_at)
returning id, user_id, code, expires_at, used_at;

-- name: verify_auth_code(user_id, code, now)^
update auth_codes
set used_at = :now
where user_id = :user_id
  and code = :code
  and used_at is null
  and expires_at > :now
returning id, user_id, code, expires_at, used_at;

-- name: get_user_by_email(email)^
select id, name, email, settings, archived_at
from users
where email = :email
  and archived_at is null;
