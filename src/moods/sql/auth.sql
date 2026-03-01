-- name: create_auth_code(user_id, code, expires_at)^
insert into auth_codes (user_id, code, expires_at)
values (:user_id, :code, :expires_at)
returning id, user_id, code, expires_at, used_at;

-- name: verify_auth_code(user_id, code)^
update auth_codes
set used_at = NOW()
where user_id = :user_id
  and code = :code
  and used_at is null
  and expires_at > NOW()
returning id, user_id, code, expires_at, used_at;

