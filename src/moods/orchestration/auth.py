import secrets
from datetime import datetime, timedelta, timezone

import jwt
from asyncpg import Pool

from moods.data import queries
from moods.services.email import send_code_email


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


def _create_token(user_id: str, jwt_secret: str, jwt_expiry_days: int) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user_id),
            "exp": now + timedelta(days=jwt_expiry_days),
            "refresh_after": int(
                (now + timedelta(days=jwt_expiry_days / 2)).timestamp()
            ),
        },
        jwt_secret,
        algorithm="HS256",
    )


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

    token = _create_token(str(user["id"]), jwt_secret, jwt_expiry_days)
    return {"token": token, "user": user}


def refresh_token(
    current_token: str, jwt_secret: str, jwt_expiry_days: int
) -> str | None:
    try:
        payload = jwt.decode(current_token, jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    return _create_token(payload["sub"], jwt_secret, jwt_expiry_days)
