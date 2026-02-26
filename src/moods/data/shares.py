from asyncpg import Pool

from moods.data import queries


async def get_shares(pool: Pool, user_id: str) -> list[dict]:
    shares = [dict(r) async for r in queries.get_shares_for_user(pool, user_id=user_id)]
    if not shares:
        return []

    share_ids = [s["id"] for s in shares]
    filters = [
        dict(r) async for r in queries.get_filters_for_shares(pool, share_ids=share_ids)
    ]

    filters_by_share = {}
    for f in filters:
        filters_by_share.setdefault(f["mood_share_id"], []).append(f)

    for share in shares:
        share["filters"] = filters_by_share.get(share["id"], [])

    return shares


async def set_shares(pool: Pool, user_id: str, rules: list[dict]) -> list[dict]:
    async with pool.acquire() as conn, conn.transaction():
        # Get existing active shares to archive their filters too
        existing = [
            dict(r) async for r in queries.get_shares_for_user(conn, user_id=user_id)
        ]
        if existing:
            share_ids = [s["id"] for s in existing]
            await queries.archive_filters_for_shares(conn, share_ids=share_ids)
        await queries.archive_shares_for_user(conn, user_id=user_id)

        results = []
        for rule in rules:
            share = dict(
                await queries.create_share(
                    conn,
                    user_id=user_id,
                    shared_with=rule["user_id"],
                )
            )

            share["filters"] = []
            for f in rule.get("filters", []):
                filter_row = dict(
                    await queries.create_share_filter(
                        conn,
                        mood_share_id=share["id"],
                        pattern=f["pattern"],
                        is_include=f["is_include"],
                    )
                )
                share["filters"].append(filter_row)

            results.append(share)

    return results
