from asyncpg import Pool

from moods.data import queries


async def upsert_device_token(pool: Pool, user_id: str, token: str) -> dict:
    row = await queries.upsert_device_token(pool, user_id=user_id, token=token)
    return dict(row)


async def delete_device_token(pool: Pool, user_id: str, token: str) -> None:
    await queries.delete_device_token(pool, user_id=user_id, token=token)


async def get_device_tokens_for_user(pool: Pool, user_id: str) -> list[dict]:
    return [
        dict(r) async for r in queries.get_device_tokens_for_user(pool, user_id=user_id)
    ]


async def delete_device_tokens_by_tokens(pool: Pool, tokens: list[str]) -> None:
    await queries.delete_device_tokens_by_tokens(pool, tokens=tokens)
