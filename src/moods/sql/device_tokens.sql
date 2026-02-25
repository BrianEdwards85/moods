-- name: upsert_device_token(user_id, token)^
INSERT INTO user_device_tokens (user_id, token)
VALUES (:user_id::uuid, :token)
ON CONFLICT (user_id, token) DO UPDATE
  SET created_at = now()
RETURNING id, user_id, token, created_at;

-- name: delete_device_token(user_id, token)!
DELETE FROM user_device_tokens
WHERE user_id = :user_id::uuid
  AND token = :token;

-- name: get_device_tokens_for_user(user_id)
SELECT id, user_id, token, created_at
FROM user_device_tokens
WHERE user_id = :user_id::uuid;

-- name: delete_device_tokens_by_tokens(tokens)!
DELETE FROM user_device_tokens
WHERE token = ANY(:tokens::text[]);
