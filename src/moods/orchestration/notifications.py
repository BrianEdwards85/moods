import json
import logging

from asyncpg import Pool

from moods.data import queries
from moods.data.device_tokens import delete_device_tokens_by_tokens
from moods.services.push import send_push_notifications

logger = logging.getLogger(__name__)


async def notify_shared_mood(
    pool: Pool,
    entry_user_id: str,
    entry_user_name: str,
    mood_entry_id: str,
    mood: int,
) -> None:
    """Send push notifications for a new mood entry to shared-with users."""
    try:
        rows = [
            dict(r)
            async for r in queries.get_push_recipients_for_entry(
                pool, entry_user_id=entry_user_id, mood_entry_id=mood_entry_id
            )
        ]

        messages = []
        for row in rows:
            settings = row["settings"] or {}
            if isinstance(settings, str):
                settings = json.loads(settings)
            notifications = settings.get("notifications", [])
            if "shared_mood" not in notifications:
                continue

            messages.append({
                "to": row["token"],
                "title": f"{entry_user_name} logged a mood",
                "body": f"Mood: {mood}/10",
                "data": {"type": "shared_mood", "entry_user_id": str(entry_user_id)},
            })

        if not messages:
            return

        invalid_tokens = await send_push_notifications(messages)
        if invalid_tokens:
            await delete_device_tokens_by_tokens(pool, invalid_tokens)

    except Exception:
        logger.exception("Failed to notify shared mood")
