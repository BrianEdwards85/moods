"""
Test fixtures for the moods GraphQL API.

Prerequisites:
  - PostgreSQL running on localhost:5433
  - A 'moods_test' database owned by the 'moods' user
"""

import os

os.environ["MOODS_ENV"] = "testing"

from datetime import datetime, timedelta, timezone

import httpx
import jwt
import pytest
from httpx import ASGITransport

from moods.app import create_app
from moods.config import settings
from moods.db import apply_migrations, create_pool

TABLES = ["mood_entry_tags", "mood_entries", "tags", "auth_codes", "users"]

apply_migrations()
_app = create_app()


@pytest.fixture
async def pool():
    p = await create_pool()
    yield p
    await p.close()


@pytest.fixture
async def client(pool):
    _app.state.pool = pool
    transport = ASGITransport(app=_app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture(autouse=True)
async def _clean_db(pool):
    """Truncate all application tables after each test."""
    yield
    async with pool.acquire() as conn:
        await conn.execute(f"TRUNCATE {', '.join(TABLES)} CASCADE")


def auth_header(user_id: str) -> dict:
    """Mint a JWT for test use and return an Authorization header dict."""
    token = jwt.encode(
        {
            "sub": str(user_id),
            "exp": datetime.now(timezone.utc) + timedelta(days=1),
        },
        settings.jwt_secret,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}


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

    resp = await client.post("/graphql", json=payload, headers=headers or {})
    assert resp.status_code == 200
    body = resp.json()

    if not expect_errors:
        assert "errors" not in body, body.get("errors")

    return body
