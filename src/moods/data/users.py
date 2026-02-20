import json

from asyncpg import Pool

from moods.data import queries


async def get_users(pool: Pool) -> list[dict]:
    return [dict(r) async for r in queries.get_users(pool)]


async def create_user(pool: Pool, name: str, email: str) -> dict:
    row = await queries.create_user(pool, name=name, email=email)
    return dict(row)


async def update_user_settings(pool: Pool, id: str, settings: dict) -> dict:
    row = await queries.update_user_settings(
        pool, id=id, settings=json.dumps(settings)
    )
    return dict(row)
