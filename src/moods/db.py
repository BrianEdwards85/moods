import logging
from pathlib import Path

import asyncpg
from yoyo import get_backend, read_migrations

from moods.config import settings

log = logging.getLogger(__name__)

MIGRATIONS_DIR = Path(__file__).parent.parent.parent / "migrations"


def get_dsn() -> str:
    return (
        f"postgresql://{settings.db.user}"
        f":{settings.db.password}"
        f"@{settings.db.host}"
        f":{settings.db.port}"
        f"/{settings.db.name}"
    )


def apply_migrations() -> None:
    dsn = get_dsn()
    backend = get_backend(dsn)
    migrations = read_migrations(str(MIGRATIONS_DIR))
    with backend.lock():
        to_apply = backend.to_apply(migrations)
        if to_apply:
            log.info("Applying %d migration(s)", len(to_apply))
            backend.apply_migrations(to_apply)
        else:
            log.info("Database is up to date")


async def create_pool() -> asyncpg.Pool:
    return await asyncpg.create_pool(get_dsn())
