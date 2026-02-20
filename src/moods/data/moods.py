from asyncpg import Pool

from moods.data import (
    DEFAULT_PAGE_SIZE,
    build_connection,
    decode_cursor,
    queries,
)


async def get_mood_entries(
    pool: Pool,
    *,
    user_id: str | None = None,
    include_archived: bool = False,
    first: int | None = None,
    after: str | None = None,
) -> dict:
    limit = first or DEFAULT_PAGE_SIZE
    after_id = decode_cursor(after) if after else None

    rows = [
        dict(r) async for r in queries.get_mood_entries(
            pool,
            user_id=user_id,
            include_archived=include_archived,
            after_id=after_id,
            page_limit=limit + 1,
        )
    ]
    return build_connection(rows, "id", limit)


async def create_mood_entry(
    pool: Pool, *, user_id: str, mood: int, notes: str, tags: list[str] | None = None
) -> dict:
    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await queries.create_mood_entry(
                conn, user_id=user_id, mood=mood, notes=notes
            )
            entry = dict(row)

            for tag_name in tags or []:
                await queries.ensure_tag(conn, name=tag_name)
                await queries.add_mood_entry_tag(
                    conn, mood_entry_id=entry["id"], tag_name=tag_name
                )

    return entry


async def archive_mood_entry(pool: Pool, entry_id: str) -> dict:
    row = await queries.archive_mood_entry(pool, id=entry_id)
    if not row:
        raise ValueError("Mood entry not found or already archived")
    return dict(row)


