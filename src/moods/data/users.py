from asyncpg import Pool

from .utils import queries


class Users:
    def __init__(self, pool: Pool):
        self.pool = pool

    async def get_users(self, include_archived: bool = False) -> list[dict]:
        return [
            dict(r)
            async for r in queries.get_users(
                self.pool, include_archived=include_archived
            )
        ]

    async def create_user(self, name: str, email: str) -> dict:
        row = await queries.create_user(self.pool, name=name, email=email)
        return dict(row)

    async def update_user_settings(self, id: str, settings: dict) -> dict:
        row = await queries.update_user_settings(self.pool, id=id, settings=settings)
        return dict(row)

    async def archive_user(self, id: str) -> dict:
        row = await queries.archive_user(self.pool, id=id)
        return dict(row)

    async def search_users(self, query: str, page_limit: int = 20) -> list[dict]:
        return [
            dict(r)
            async for r in queries.search_users(
                self.pool, query=query, page_limit=page_limit
            )
        ]

    async def create_auth_code(self, id: str, code: str, expires_at: int):
        await queries.create_auth_code(
            self.pool, user_id=id, code=code, expires_at=expires_at
        )

    async def verify_auth_code(self, id: str, code: str) -> bool:
        verified = await queries.verify_auth_code(self.pool, user_id=id, code=code)
        return verified is not None

    async def get_user_by_email(self, email: str) -> dict | None:
        row = await queries.get_user_by_email(self.pool, email=email)
        return dict(row) if row else None
