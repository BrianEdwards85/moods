from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import jwt

from moods.config import settings
from tests.conftest import auth_header, gql

H = auth_header("00000000-0000-0000-0000-000000000000")

CREATE_USER = """
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) { id name email }
}
"""

SEND_LOGIN_CODE = """
mutation SendLoginCode($email: String!) {
  sendLoginCode(email: $email) { success }
}
"""

VERIFY_LOGIN_CODE = """
mutation VerifyLoginCode($email: String!, $code: String!) {
  verifyLoginCode(email: $email, code: $code) {
    token
    user { id name email }
  }
}
"""

MOOD_ENTRIES_QUERY = """
query MoodEntries {
  moodEntries { edges { node { id } } pageInfo { hasNextPage endCursor } }
}
"""

USERS_QUERY = "{ users { id name } }"


async def _create_user(client, name="Alice", email="alice@test.com"):
    body = await gql(client, CREATE_USER, {"input": {"name": name, "email": email}}, headers=H)
    return body["data"]["createUser"]


@patch("moods.orchestration.auth.send_code_email", new_callable=AsyncMock)
async def test_send_login_code(mock_send, client, pool):
    user = await _create_user(client)
    body = await gql(client, SEND_LOGIN_CODE, {"email": user["email"]})
    assert body["data"]["sendLoginCode"]["success"] is True

    # Verify code was created in DB
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT code, expires_at, used_at FROM auth_codes WHERE user_id = $1",
            user["id"],
        )
        assert row is not None
        assert len(row["code"]) == 6
        assert row["used_at"] is None

    mock_send.assert_called_once()


@patch("moods.orchestration.auth.send_code_email", new_callable=AsyncMock)
async def test_verify_login_code(mock_send, client, pool):
    user = await _create_user(client)
    await gql(client, SEND_LOGIN_CODE, {"email": user["email"]})

    # Get the code from DB
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT code FROM auth_codes WHERE user_id = $1", user["id"]
        )

    body = await gql(client, VERIFY_LOGIN_CODE, {
        "email": user["email"],
        "code": row["code"],
    })
    result = body["data"]["verifyLoginCode"]
    assert result["token"]
    assert result["user"]["id"] == user["id"]
    assert result["user"]["email"] == user["email"]


@patch("moods.orchestration.auth.send_code_email", new_callable=AsyncMock)
async def test_verify_expired_code(mock_send, client, pool):
    user = await _create_user(client)
    await gql(client, SEND_LOGIN_CODE, {"email": user["email"]})

    # Expire the code by setting expires_at to the past
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE auth_codes SET expires_at = now() - interval '1 hour' WHERE user_id = $1",
            user["id"],
        )
        row = await conn.fetchrow(
            "SELECT code FROM auth_codes WHERE user_id = $1", user["id"]
        )

    body = await gql(
        client, VERIFY_LOGIN_CODE,
        {"email": user["email"], "code": row["code"]},
        expect_errors=True,
    )
    assert "errors" in body


@patch("moods.orchestration.auth.send_code_email", new_callable=AsyncMock)
async def test_verify_wrong_code(mock_send, client):
    user = await _create_user(client)
    await gql(client, SEND_LOGIN_CODE, {"email": user["email"]})

    body = await gql(
        client, VERIFY_LOGIN_CODE,
        {"email": user["email"], "code": "000000"},
        expect_errors=True,
    )
    assert "errors" in body


async def test_protected_query_without_token(client):
    body = await gql(client, MOOD_ENTRIES_QUERY, expect_errors=True)
    assert "errors" in body
    assert any("authentication" in e["message"].lower() for e in body["errors"])


async def test_protected_query_with_token(client):
    user = await _create_user(client)
    h = auth_header(user["id"])
    body = await gql(client, MOOD_ENTRIES_QUERY, headers=h)
    assert body["data"]["moodEntries"]["edges"] == []


async def test_users_query_is_public(client):
    body = await gql(client, USERS_QUERY)
    assert "errors" not in body
    assert isinstance(body["data"]["users"], list)


REFRESH_TOKEN = """
mutation RefreshToken {
  refreshToken { token }
}
"""


@patch("moods.orchestration.auth.send_code_email", new_callable=AsyncMock)
async def test_verify_login_code_has_refresh_after_claim(mock_send, client, pool):
    user = await _create_user(client)
    await gql(client, SEND_LOGIN_CODE, {"email": user["email"]})

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT code FROM auth_codes WHERE user_id = $1", user["id"]
        )

    body = await gql(client, VERIFY_LOGIN_CODE, {
        "email": user["email"],
        "code": row["code"],
    })
    token = body["data"]["verifyLoginCode"]["token"]
    payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    assert "refresh_after" in payload
    assert payload["refresh_after"] > int(datetime.now(timezone.utc).timestamp())


async def test_refresh_token_success(client):
    user = await _create_user(client)
    h = auth_header(user["id"])
    body = await gql(client, REFRESH_TOKEN, headers=h)
    new_token = body["data"]["refreshToken"]["token"]
    payload = jwt.decode(new_token, settings.jwt_secret, algorithms=["HS256"])
    assert payload["sub"] == user["id"]
    assert "refresh_after" in payload


async def test_refresh_token_expired_fails(client):
    user = await _create_user(client)
    now = datetime.now(timezone.utc)
    expired_token = jwt.encode(
        {"sub": user["id"], "exp": now - timedelta(hours=1)},
        settings.jwt_secret,
        algorithm="HS256",
    )
    body = await gql(
        client, REFRESH_TOKEN,
        headers={"Authorization": f"Bearer {expired_token}"},
        expect_errors=True,
    )
    assert "errors" in body


async def test_refresh_token_without_auth_fails(client):
    body = await gql(client, REFRESH_TOKEN, expect_errors=True)
    assert "errors" in body
