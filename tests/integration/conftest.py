"""
Test fixtures for the moods GraphQL API.

Prerequisites (in-process mode, the default):
  - PostgreSQL running on localhost:5433
  - A 'moods_test' database owned by the 'moods' user

External server mode (--server-url):
  - A running moods instance at the given URL
  - PostgreSQL accessible via MOODS_DB__* env vars for test cleanup
"""

from datetime import UTC, datetime, timedelta

import httpx
import jwt
import pytest
from httpx import ASGITransport

from moods.config import settings
from moods.db import create_pool

TABLES = [
    "mood_share_filters",
    "mood_shares",
    "mood_entry_tags",
    "mood_entries",
    "tags",
    "auth_codes",
    "users",
]


@pytest.fixture(scope="session")
def server_url(request):
    return request.config.getoption("--server-url")


@pytest.fixture(scope="session", autouse=True)
def _migrations(server_url):
    if server_url:
        return
    from moods.db import apply_migrations

    apply_migrations()


@pytest.fixture
async def pool(_migrations):
    p = await create_pool()
    yield p
    await p.close()


@pytest.fixture
async def client(pool, server_url):
    if server_url:
        async with httpx.AsyncClient(base_url=server_url) as c:
            yield c
    else:
        from moods.app import app as _app
        from moods.resolvers import create_gql

        _app.state.pool = pool
        _app.state.graphql = create_gql(pool, settings)
        transport = ASGITransport(app=_app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            yield c


@pytest.fixture(autouse=True)
async def _clean_db(pool):
    """Truncate all application tables after each test."""
    yield
    async with pool.acquire() as conn:
        await conn.execute(f"TRUNCATE {', '.join(TABLES)} CASCADE")


def _mint_token(user_id: str, email: str = "test@test.com") -> str:
    """Mint a JWT for test use."""
    now = datetime.now(UTC)
    return jwt.encode(
        {
            "sub": str(user_id),
            "email": email,
            "exp": now + timedelta(days=1),
            "refresh_after": int((now + timedelta(hours=12)).timestamp()),
        },
        settings.jwt_secret,
        algorithm="HS256",
    )


def auth_header(user_id: str) -> dict:
    """Mint a JWT for test use and return an Authorization header dict."""
    return {"Authorization": f"Bearer {_mint_token(user_id)}"}


def auth_cookie(user_id: str) -> httpx.Cookies:
    """Mint a JWT for test use and return it as a cookies jar."""
    cookies = httpx.Cookies()
    cookies.set("moods_token", _mint_token(user_id))
    return cookies


async def gql(
    client: httpx.AsyncClient,
    query: str,
    variables: dict | None = None,
    *,
    expect_errors: bool = False,
    headers: dict | None = None,
):
    """Send a GraphQL request and return the parsed response body.

    Asserts no errors unless expect_errors is True.
    """
    payload = {"query": query}
    if variables:
        payload["variables"] = variables

    from assertpy import assert_that

    resp = await client.post("/graphql", json=payload, headers=headers or {})
    assert_that(resp.status_code).described_as("GraphQL response status").is_equal_to(200)
    body = resp.json()

    if not expect_errors:
        assert_that(body).described_as("GraphQL response body").does_not_contain_key("errors")

    return body
