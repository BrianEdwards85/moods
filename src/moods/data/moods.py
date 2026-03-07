from asyncpg import Pool

from moods.errors import NotFoundError

from .utils import (
    DEFAULT_PAGE_SIZE,
    build_connection,
    decode_cursor,
    queries,
)


class Moods:
    def __init__(self, pool: Pool):
        self.pool = pool

    async def get_mood_entries(
        self,
        *,
        user_ids: list[str] | None = None,
        include_archived: bool = False,
        first: int | None = None,
        after: str | None = None,
        viewer_id: str | None = None,
    ) -> dict:
        limit = first or DEFAULT_PAGE_SIZE
        after_id = decode_cursor(after) if after else None

        rows = [
            dict(r)
            async for r in queries.get_mood_entries(
                self.pool,
                user_ids=user_ids,
                include_archived=include_archived,
                after_id=after_id,
                page_limit=limit + 1,
                viewer_id=viewer_id,
            )
        ]
        return build_connection(rows, "id", limit)

    async def create_mood_entry(
        self, *, user_id: str, mood: int, notes: str, tags: list[str] | None = None
    ) -> dict:
        async with self.pool.acquire() as conn, conn.transaction():
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

    async def archive_mood_entry(self, entry_id: str, user_id: str) -> dict:
        row = await queries.archive_mood_entry(self.pool, id=entry_id, user_id=user_id)
        if not row:
            raise NotFoundError("Mood entry not found or already archived")
        return dict(row)
