from unittest.mock import AsyncMock, patch

from tests.conftest import auth_header, gql

H = auth_header("00000000-0000-0000-0000-000000000000")

CREATE_USER = """
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) { id name email settings }
}
"""

UPDATE_USER_SETTINGS = """
mutation UpdateUserSettings($input: UpdateUserSettingsInput!) {
  updateUserSettings(input: $input) { id settings }
}
"""

UPDATE_SHARING = """
mutation UpdateSharing($input: UpdateSharingInput!) {
  updateSharing(input: $input) {
    id sharedWith { id user { id name } filters { id pattern isInclude } }
  }
}
"""

REGISTER_TOKEN = """
mutation RegisterDeviceToken($input: RegisterDeviceTokenInput!) {
  registerDeviceToken(input: $input)
}
"""

UNREGISTER_TOKEN = """
mutation UnregisterDeviceToken($input: RegisterDeviceTokenInput!) {
  unregisterDeviceToken(input: $input)
}
"""

LOG_MOOD = """
mutation LogMood($input: LogMoodInput!) {
  logMood(input: $input) { id mood }
}
"""


async def _create_user(client, name, email):
    body = await gql(client, CREATE_USER, {"input": {"name": name, "email": email}}, headers=H)
    return body["data"]["createUser"]


async def test_register_device_token(client):
    alice = await _create_user(client, "Alice", "alice@example.com")

    body = await gql(
        client, REGISTER_TOKEN,
        {"input": {"token": "ExponentPushToken[abc123]"}},
        headers=auth_header(alice["id"]),
    )
    assert body["data"]["registerDeviceToken"] is True


async def test_register_device_token_upsert(client):
    alice = await _create_user(client, "Alice", "alice@example.com")
    h = auth_header(alice["id"])

    await gql(client, REGISTER_TOKEN, {"input": {"token": "ExponentPushToken[abc]"}}, headers=h)
    body = await gql(client, REGISTER_TOKEN, {"input": {"token": "ExponentPushToken[abc]"}}, headers=h)
    assert body["data"]["registerDeviceToken"] is True


async def test_unregister_device_token(client):
    alice = await _create_user(client, "Alice", "alice@example.com")
    h = auth_header(alice["id"])

    await gql(client, REGISTER_TOKEN, {"input": {"token": "ExponentPushToken[abc]"}}, headers=h)
    body = await gql(client, UNREGISTER_TOKEN, {"input": {"token": "ExponentPushToken[abc]"}}, headers=h)
    assert body["data"]["unregisterDeviceToken"] is True


async def test_register_requires_auth(client):
    body = await gql(
        client, REGISTER_TOKEN,
        {"input": {"token": "ExponentPushToken[abc]"}},
        expect_errors=True,
    )
    assert "errors" in body


@patch("moods.orchestration.notifications.send_push_notifications", new_callable=AsyncMock)
async def test_shared_mood_sends_notification(mock_send, client, pool):
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")

    mock_send.return_value = []

    # Bob enables shared_mood notifications
    await gql(
        client, UPDATE_USER_SETTINGS,
        {"input": {"id": bob["id"], "settings": {"notifications": ["shared_mood"]}}},
        headers=auth_header(bob["id"]),
    )

    # Alice shares with Bob
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": []}]}},
        headers=auth_header(alice["id"]),
    )

    # Register Bob's device token
    await gql(
        client, REGISTER_TOKEN,
        {"input": {"token": "ExponentPushToken[bob123]"}},
        headers=auth_header(bob["id"]),
    )

    # Alice logs a mood
    await gql(
        client, LOG_MOOD,
        {"input": {"userId": alice["id"], "mood": 8, "notes": "great day"}},
        headers=auth_header(alice["id"]),
    )

    # Give the fire-and-forget task a moment to run
    import asyncio
    await asyncio.sleep(0.2)

    mock_send.assert_called_once()
    messages = mock_send.call_args[0][0]
    assert len(messages) == 1
    assert messages[0]["to"] == "ExponentPushToken[bob123]"
    assert "Alice" in messages[0]["title"]
    assert "8/10" in messages[0]["body"]


@patch("moods.orchestration.notifications.send_push_notifications", new_callable=AsyncMock)
async def test_no_notification_without_setting(mock_send, client, pool):
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")

    mock_send.return_value = []

    # Alice shares with Bob (but Bob has no notification settings)
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": []}]}},
        headers=auth_header(alice["id"]),
    )

    # Register Bob's device token
    await gql(
        client, REGISTER_TOKEN,
        {"input": {"token": "ExponentPushToken[bob123]"}},
        headers=auth_header(bob["id"]),
    )

    # Alice logs a mood
    await gql(
        client, LOG_MOOD,
        {"input": {"userId": alice["id"], "mood": 5, "notes": "ok"}},
        headers=auth_header(alice["id"]),
    )

    import asyncio
    await asyncio.sleep(0.2)

    mock_send.assert_not_called()


@patch("moods.orchestration.notifications.send_push_notifications", new_callable=AsyncMock)
async def test_notification_respects_share_filters(mock_send, client, pool):
    alice = await _create_user(client, "Alice", "alice@example.com")
    bob = await _create_user(client, "Bob", "bob@example.com")

    mock_send.return_value = []

    # Bob enables notifications
    await gql(
        client, UPDATE_USER_SETTINGS,
        {"input": {"id": bob["id"], "settings": {"notifications": ["shared_mood"]}}},
        headers=auth_header(bob["id"]),
    )

    # Alice shares with Bob, include only "happy" tag
    await gql(
        client, UPDATE_SHARING,
        {"input": {"rules": [{"userId": bob["id"], "filters": [
            {"pattern": "happy", "isInclude": True}
        ]}]}},
        headers=auth_header(alice["id"]),
    )

    # Register Bob's device token
    await gql(
        client, REGISTER_TOKEN,
        {"input": {"token": "ExponentPushToken[bob123]"}},
        headers=auth_header(bob["id"]),
    )

    # Alice logs a mood with "sad" tag (doesn't match include filter)
    await gql(
        client, LOG_MOOD,
        {"input": {"userId": alice["id"], "mood": 3, "notes": "", "tags": ["sad"]}},
        headers=auth_header(alice["id"]),
    )

    import asyncio
    await asyncio.sleep(0.2)

    mock_send.assert_not_called()
