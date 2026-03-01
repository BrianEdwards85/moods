from asyncpg import Pool

from .utils import DEFAULT_PAGE_SIZE, build_connection, decode_cursor, queries


class Tags:
    def __init__(self, pool: Pool):
        self.pool = pool

    async def get_tags(
        self,
        *,
        search: str | None = None,
        include_archived: bool = False,
        first: int | None = None,
        after: str | None = None,
    ) -> dict:
        limit = first or DEFAULT_PAGE_SIZE
        after_name = decode_cursor(after) if after else None

        if search:
            gen = queries.search_tags(
                self.pool,
                query=search,
                include_archived=include_archived,
                after_name=after_name,
                page_limit=limit + 1,
            )
        else:
            gen = queries.get_tags(
                self.pool,
                include_archived=include_archived,
                after_name=after_name,
                page_limit=limit + 1,
            )

        rows = [dict(r) async for r in gen]
        return build_connection(rows, "name", limit)

    async def update_tag_metadata(self, name: str, metadata: dict) -> dict:
        row = await queries.update_tag_metadata(self.pool, name=name, metadata=metadata)
        if not row:
            raise ValueError("Tag not found")
        return dict(row)

    async def archive_tag(self, name: str) -> dict:
        row = await queries.archive_tag(self.pool, name=name)
        if not row:
            raise ValueError("Tag not found or already archived")
        return dict(row)

    async def unarchive_tag(self, name: str) -> dict:
        row = await queries.unarchive_tag(self.pool, name=name)
        if not row:
            raise ValueError("Tag not found or not archived")
        return dict(row)
