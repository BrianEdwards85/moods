import secrets
from datetime import UTC, datetime, timedelta

import jwt

from moods.data.users import Users
from moods.services.email import Email


def _generate_code() -> str:
    return f"{secrets.randbelow(1000000):06d}"


class Auth:
    def __init__(self, users: Users, email: Email, settings):
        self.users = users
        self.email = email
        self.auth_code_expiry_minutes = settings.auth_code_expiry_minutes
        self.jwt_secret = settings.jwt_secret
        self.jwt_expiry_days = settings.jwt_expiry_days

    async def send_login_code(self, email: str) -> bool:
        user = await self.users.get_user_by_email(email)
        if user:
            code = _generate_code()
            expires_at = datetime.now(UTC) + timedelta(
                minutes=self.auth_code_expiry_minutes
            )
            await self.users.create_auth_code(user["id"], code, expires_at)
            await self.email.send_code_email(email, code)
        return True

    def _create_token(self, id: str, email: str) -> str:
        now = datetime.now(UTC)
        return jwt.encode(
            {
                "sub": str(id),
                "email": str(email),
                "exp": now + timedelta(days=self.jwt_expiry_days),
                "refresh_after": int(
                    (now + timedelta(days=self.jwt_expiry_days / 2)).timestamp()
                ),
            },
            self.jwt_secret,
            algorithm="HS256",
        )

    async def verify_login_code(self, email: str, code: str) -> dict | None:
        user = await self.users.get_user_by_email(email)
        if user:
            verified = await self.users.verify_auth_code(user["id"], code)
            if verified:
                token = self._create_token(user["id"], user["email"])
                return {"token": token, "user": user}
            else:
                return None
        else:
            return None

    def refresh_token(self, current_token: str) -> str | None:
        try:
            payload = jwt.decode(current_token, self.jwt_secret, algorithms=["HS256"])
            return self._create_token(payload["sub"], payload["email"])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None

    def decode_token(self, token: str) -> str | None:
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            return payload["sub"]
        except (jwt.InvalidTokenError, KeyError):
            return None
