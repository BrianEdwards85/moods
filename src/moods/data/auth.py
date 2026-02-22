import secrets
from datetime import datetime, timedelta, timezone

import jwt
from asyncpg import Pool

from moods.data import queries
from moods.data.email import send_code_email


def _generate_code() -> str:
    return f"{secrets.randbelow(1000000):06d}"


async def send_login_code(pool: Pool, email: str, settings) -> bool:
    row = await queries.get_user_by_email(pool, email=email)
    if not row:
        return True  # don't reveal whether email exists

    user = dict(row)
    code = _generate_code()
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.auth_code_expiry_minutes
    )

    await queries.create_auth_code(
        pool, user_id=user["id"], code=code, expires_at=expires_at
    )
    await send_code_email(email, code, settings)
    return True


async def verify_login_code(
    pool: Pool, email: str, code: str, jwt_secret: str, jwt_expiry_days: int
) -> dict | None:
    row = await queries.get_user_by_email(pool, email=email)
    if not row:
        return None

    user = dict(row)
    now = datetime.now(timezone.utc)
    verified = await queries.verify_auth_code(
        pool, user_id=user["id"], code=code, now=now
    )
    if not verified:
        return None

    token = jwt.encode(
        {"sub": str(user["id"]), "exp": now + timedelta(days=jwt_expiry_days)},
        jwt_secret,
        algorithm="HS256",
    )
    return {"token": token, "user": user}


def decode_token(token: str, jwt_secret: str) -> str | None:
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        return payload["sub"]
    except (jwt.InvalidTokenError, KeyError):
        return None
