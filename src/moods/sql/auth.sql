-- name: count_valid_auth_codes(user_id)$
select count(*) as cnt from auth_codes
where user_id = :user_id
  and used_at is null
  and expires_at > NOW();

-- name: create_auth_code(user_id, code, expires_at)^
insert into auth_codes (user_id, code, expires_at)
values (:user_id, :code, :expires_at)
returning id, user_id, code, expires_at, used_at;

-- name: increment_failed_attempts(user_id)!
update auth_codes
set failed_attempts = failed_attempts + 1
where user_id = :user_id
  and used_at is null
  and expires_at > NOW();

-- name: verify_auth_code(user_id, code)^
update auth_codes
set used_at = NOW()
where user_id = :user_id
  and code = :code
  and used_at is null
  and expires_at > NOW()
  and failed_attempts < 5
returning id, user_id, code, expires_at, used_at;

