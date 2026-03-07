from collections import defaultdict

from aiodataloader import DataLoader
from asyncpg import Pool

from .utils import queries


class _ByIdLoader(DataLoader):
    """Batch loader: id -> single row. Subclasses set query_fn."""

    query_fn = None

    def __init__(self, pool: Pool):
        super().__init__()
        self.pool = pool

    async def batch_load_fn(self, ids):
        rows = [dict(r) async for r in self.query_fn(self.pool, ids=list(ids))]
        by_id = {str(r["id"]): r for r in rows}
        return [by_id.get(str(i)) for i in ids]


class _OneToManyLoader(DataLoader):
    """Batch loader: parent_id -> list of child rows.

    Subclasses set query_fn, parent_key, and optionally ids_param.
    """

    query_fn = None
    parent_key = None
    ids_param = "ids"

    def __init__(self, pool: Pool):
        super().__init__()
        self.pool = pool

    async def batch_load_fn(self, parent_ids):
        by_parent = defaultdict(list)
        async for r in self.query_fn(
            self.pool, **{self.ids_param: list(parent_ids)}
        ):
            d = dict(r)
            by_parent[str(d[self.parent_key])].append(d)
        return [by_parent.get(str(pid), []) for pid in parent_ids]


class UserLoader(_ByIdLoader):
    query_fn = queries.get_users_by_ids


class MoodEntryTagsLoader(_OneToManyLoader):
    query_fn = queries.get_tags_for_entries
    parent_key = "mood_entry_id"
    ids_param = "mood_entry_ids"


def create_loaders(pool: Pool) -> dict:
    return {
        "user_loader": UserLoader(pool),
        "mood_entry_tags_loader": MoodEntryTagsLoader(pool),
    }
