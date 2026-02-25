import logging

import httpx

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push_notifications(messages: list[dict]) -> list[str]:
    """Send push notifications via Expo Push API.

    Returns a list of invalid tokens (DeviceNotRegistered) for cleanup.
    """
    if not messages:
        return []

    invalid_tokens = []
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json().get("data", [])

            for i, ticket in enumerate(data):
                if ticket.get("status") == "error":
                    details = ticket.get("details", {})
                    if details.get("error") == "DeviceNotRegistered":
                        invalid_tokens.append(messages[i]["to"])
                    logger.warning("Push error for %s: %s", messages[i]["to"], ticket.get("message"))

    except Exception:
        logger.exception("Failed to send push notifications")

    return invalid_tokens
