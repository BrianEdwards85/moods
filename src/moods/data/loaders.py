from collections import defaultdict

from aiodataloader import DataLoader
from asyncpg import Pool

from moods.data import queries


class UserLoader(DataLoader):
    def __init__(self, pool: Pool):
        super().__init__()
        self.pool = pool

    async def batch_load_fn(self, user_ids):
        rows = [
            dict(r) async for r in queries.get_users_by_ids(self.pool, ids=list(user_ids))
        ]
        by_id = {str(r["id"]): r for r in rows}
        return [by_id.get(str(uid)) for uid in user_ids]


class MoodEntryTagsLoader(DataLoader):
    def __init__(self, pool: Pool):
        super().__init__()
        self.pool = pool

    async def batch_load_fn(self, entry_ids):
        rows = [
            dict(r) async for r in queries.get_tags_for_entries(
                self.pool, mood_entry_ids=list(entry_ids)
            )
        ]
        by_entry = defaultdict(list)
        for r in rows:
            by_entry[str(r["mood_entry_id"])].append(
                {"name": r["name"], "metadata": r["metadata"], "archived_at": r["archived_at"]}
            )
        return [by_entry.get(str(eid), []) for eid in entry_ids]


def create_loaders(pool: Pool) -> dict:
    return {
        "user_loader": UserLoader(pool),
        "mood_entry_tags_loader": MoodEntryTagsLoader(pool),
    }
