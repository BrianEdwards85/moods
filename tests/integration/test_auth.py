from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import httpx
import jwt
from assertpy import assert_that

from moods.config import settings
from tests.integration.conftest import auth_cookie, auth_header, gql

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
    body = await gql(
        client, CREATE_USER, {"input": {"name": name, "email": email}}, headers=H
    )
    return body["data"]["createUser"]


@patch("moods.services.email.Email.send_code_email", new_callable=AsyncMock)
async def test_send_login_code(mock_send, client, pool):
    user = await _create_user(client)
    body = await gql(client, SEND_LOGIN_CODE, {"email": user["email"]})
    assert_that(body["data"]["sendLoginCode"]["success"]).is_true()

    # Verify code was created in DB
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT code, expires_at, used_at FROM auth_codes WHERE user_id = $1",
            user["id"],
        )
        assert_that(row).is_not_none()
        assert_that(row["code"]).is_length(6)
        assert_that(row["used_at"]).is_none()

    mock_send.assert_called_once()


@patch("moods.services.email.Email.send_code_email", new_callable=AsyncMock)
async def test_send_login_code_rate_limited(mock_send, client, pool):
    user = await _create_user(client)
    # Send 3 codes — all should succeed and create codes
    for _ in range(3):
        await gql(client, SEND_LOGIN_CODE, {"email": user["email"]})
    assert_that(mock_send.call_count).is_equal_to(3)

    # 4th request should still return success but NOT create a new code or send email
    mock_send.reset_mock()
    body = await gql(client, SEND_LOGIN_CODE, {"email": user["email"]})
    assert_that(body["data"]["sendLoginCode"]["success"]).is_true()
    mock_send.assert_not_called()

    async with pool.acquire() as conn:
        count = await conn.fetchval(
            "SELECT count(*) FROM auth_codes WHERE user_id = $1"
            " AND used_at IS NULL AND expires_at > NOW()",
            user["id"],
        )
    assert_that(count).is_equal_to(3)


@patch("moods.services.email.Email.send_code_email", new_callable=AsyncMock)
async def test_verify_login_code(mock_send, client, pool):
    user = await _create_user(client)
    await gql(client, SEND_LOGIN_CODE, {"email": user["email"]})

    # Get the code from DB
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT code FROM auth_codes WHERE user_id = $1", user["id"]
        )

    body = await gql(
        client,
        VERIFY_LOGIN_CODE,
        {
            "email": user["email"],
            "code": row["code"],
        },
    )
    result = body["data"]["verifyLoginCode"]
    assert_that(result["token"]).is_not_empty()
    assert_that(result["user"]["id"]).is_equal_to(user["id"])
    assert_that(result["user"]["email"]).is_equal_to(user["email"])


@patch("moods.services.email.Email.send_code_email", new_callable=AsyncMock)
async def test_verify_locked_out_after_5_failures(mock_send, client, pool):
    user = await _create_user(client)
    await gql(client, SEND_LOGIN_CODE, {"email": user["email"]})

    # Get the real code
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT code FROM auth_codes WHERE user_id = $1", user["id"]
        )
    real_code = row["code"]

    # 5 wrong attempts
    for _ in range(5):
        body = await gql(
            client,
            VERIFY_LOGIN_CODE,
            {"email": user["email"], "code": "000000"},
            expect_errors=True,
        )
        assert_that(body).contains_key("errors")

    # 6th attempt with the REAL code should still fail (locked out)
    body = await gql(
        client,
        VERIFY_LOGIN_CODE,
        {"email": user["email"], "code": real_code},
        expect_errors=True,
    )
    assert_that(body).contains_key("errors")

    # Confirm failed_attempts was tracked in DB
    async with pool.acquire() as conn:
        total = await conn.fetchval(
            "SELECT sum(failed_attempts) FROM auth_codes"
            " WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()",
            user["id"],
        )
    assert_that(total).is_equal_to(5)


@patch("moods.services.email.Email.send_code_email", new_callable=AsyncMock)
async def test_verify_expired_code(mock_send, client, pool):
    user = await _create_user(client)
    await gql(client, SEND_LOGIN_CODE, {"email": user["email"]})

    # Expire the code by setting expires_at to the past
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE auth_codes SET expires_at = now() - interval '1 hour'"
            " WHERE user_id = $1",
            user["id"],
        )
        row = await conn.fetchrow(
            "SELECT code FROM auth_codes WHERE user_id = $1", user["id"]
        )

    body = await gql(
        client,
        VERIFY_LOGIN_CODE,
        {"email": user["email"], "code": row["code"]},
        expect_errors=True,
    )
    assert_that(body).contains_key("errors")


@patch("moods.services.email.Email.send_code_email", new_callable=AsyncMock)
async def test_verify_wrong_code(mock_send, client):
    user = await _create_user(client)
    await gql(client, SEND_LOGIN_CODE, {"email": user["email"]})

    body = await gql(
        client,
        VERIFY_LOGIN_CODE,
        {"email": user["email"], "code": "000000"},
        expect_errors=True,
    )
    assert_that(body).contains_key("errors")
    codes = [e.get("extensions", {}).get("code") for e in body["errors"]]
    assert_that(codes).contains("VALIDATION_ERROR")


async def test_protected_query_without_token(client):
    body = await gql(client, MOOD_ENTRIES_QUERY, expect_errors=True)
    assert_that(body).contains_key("errors")
    messages = [e["message"].lower() for e in body["errors"]]
    assert_that(any("authentication" in m for m in messages)).is_true()
    codes = [e.get("extensions", {}).get("code") for e in body["errors"]]
    assert_that(codes).contains("AUTHENTICATION_ERROR")


async def test_protected_query_with_token(client):
    user = await _create_user(client)
    h = auth_header(user["id"])
    body = await gql(client, MOOD_ENTRIES_QUERY, headers=h)
    assert_that(body["data"]["moodEntries"]["edges"]).is_empty()


async def test_users_query_is_public(client):
    body = await gql(client, USERS_QUERY)
    assert_that(body).does_not_contain_key("errors")
    assert_that(body["data"]["users"]).is_instance_of(list)


REFRESH_TOKEN = """
mutation RefreshToken {
  refreshToken { token }
}
"""


@patch("moods.services.email.Email.send_code_email", new_callable=AsyncMock)
async def test_verify_login_code_has_refresh_after_claim(mock_send, client, pool):
    user = await _create_user(client)
    await gql(client, SEND_LOGIN_CODE, {"email": user["email"]})

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT code FROM auth_codes WHERE user_id = $1", user["id"]
        )

    body = await gql(
        client,
        VERIFY_LOGIN_CODE,
        {
            "email": user["email"],
            "code": row["code"],
        },
    )
    token = body["data"]["verifyLoginCode"]["token"]
    payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    assert_that(payload).contains_key("refresh_after")
    assert_that(payload["refresh_after"]).is_greater_than(
        int(datetime.now(UTC).timestamp())
    )


async def test_refresh_token_success(client):
    user = await _create_user(client)
    h = auth_header(user["id"])
    body = await gql(client, REFRESH_TOKEN, headers=h)
    new_token = body["data"]["refreshToken"]["token"]
    payload = jwt.decode(new_token, settings.jwt_secret, algorithms=["HS256"])
    assert_that(payload["sub"]).is_equal_to(user["id"])
    assert_that(payload).contains_key("refresh_after")


async def test_refresh_token_expired_fails(client):
    user = await _create_user(client)
    now = datetime.now(UTC)
    expired_token = jwt.encode(
        {"sub": user["id"], "exp": now - timedelta(hours=1)},
        settings.jwt_secret,
        algorithm="HS256",
    )
    body = await gql(
        client,
        REFRESH_TOKEN,
        headers={"Authorization": f"Bearer {expired_token}"},
        expect_errors=True,
    )
    assert_that(body).contains_key("errors")


async def test_refresh_token_without_auth_fails(client):
    body = await gql(client, REFRESH_TOKEN, expect_errors=True)
    assert_that(body).contains_key("errors")


# --- Cookie-based auth tests ---


@patch("moods.services.email.Email.send_code_email", new_callable=AsyncMock)
async def test_verify_login_code_sets_cookie(mock_send, client, pool):
    user = await _create_user(client)
    await gql(client, SEND_LOGIN_CODE, {"email": user["email"]})

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT code FROM auth_codes WHERE user_id = $1", user["id"]
        )

    resp = await client.post(
        "/graphql",
        json={
            "query": VERIFY_LOGIN_CODE,
            "variables": {"email": user["email"], "code": row["code"]},
        },
    )
    assert_that(resp.status_code).is_equal_to(200)
    cookie_header = resp.headers.get("set-cookie", "")
    assert_that(cookie_header).contains("moods_token=")
    assert_that(cookie_header.lower()).contains("httponly")
    assert_that(cookie_header.lower()).contains("samesite=lax")
    assert_that(cookie_header.lower()).contains("path=/")


async def test_cookie_auth_works(client):
    user = await _create_user(client)
    cookies = auth_cookie(user["id"])
    resp = await client.post(
        "/graphql",
        json={"query": MOOD_ENTRIES_QUERY},
        cookies=cookies,
    )
    assert_that(resp.status_code).is_equal_to(200)
    body = resp.json()
    assert_that(body).does_not_contain_key("errors")
    assert_that(body["data"]["moodEntries"]["edges"]).is_empty()


async def test_header_takes_precedence_over_cookie(client):
    user_a = await _create_user(client, name="Alice", email="alice@test.com")
    # Header authenticates as user_a, cookie has an invalid token
    h = auth_header(user_a["id"])
    bad_cookies = httpx.Cookies()
    bad_cookies.set("moods_token", "invalid-token")
    # If cookie took precedence, auth would fail; header wins so it succeeds
    resp = await client.post(
        "/graphql",
        json={"query": MOOD_ENTRIES_QUERY},
        headers=h,
        cookies=bad_cookies,
    )
    assert_that(resp.status_code).is_equal_to(200)
    body = resp.json()
    assert_that(body).does_not_contain_key("errors")
    assert_that(body["data"]["moodEntries"]["edges"]).is_empty()


async def test_refresh_token_from_cookie(client):
    user = await _create_user(client)
    cookies = auth_cookie(user["id"])
    resp = await client.post(
        "/graphql",
        json={"query": REFRESH_TOKEN},
        cookies=cookies,
    )
    assert_that(resp.status_code).is_equal_to(200)
    body = resp.json()
    assert_that(body).does_not_contain_key("errors")
    new_token = body["data"]["refreshToken"]["token"]
    payload = jwt.decode(new_token, settings.jwt_secret, algorithms=["HS256"])
    assert_that(payload["sub"]).is_equal_to(user["id"])
    # Should also set a cookie with the new token
    cookie_header = resp.headers.get("set-cookie", "")
    assert_that(cookie_header).contains("moods_token=")
