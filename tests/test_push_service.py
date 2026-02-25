from unittest.mock import AsyncMock, MagicMock, patch

from moods.services.push import send_push_notifications


def _mock_response(json_data):
    resp = MagicMock()
    resp.raise_for_status = MagicMock()
    resp.json.return_value = json_data
    return resp


@patch("moods.services.push.httpx.AsyncClient")
async def test_send_push_notifications_success(mock_client_cls):
    mock_client = AsyncMock()
    mock_client_cls.return_value.__aenter__.return_value = mock_client
    mock_client.post.return_value = _mock_response(
        {"data": [{"status": "ok", "id": "abc123"}]}
    )

    messages = [
        {"to": "ExponentPushToken[abc]", "title": "Test", "body": "Hello"},
    ]
    invalid = await send_push_notifications(messages)

    assert invalid == []
    mock_client.post.assert_called_once()


@patch("moods.services.push.httpx.AsyncClient")
async def test_send_push_detects_invalid_tokens(mock_client_cls):
    mock_client = AsyncMock()
    mock_client_cls.return_value.__aenter__.return_value = mock_client
    mock_client.post.return_value = _mock_response({
        "data": [
            {"status": "ok", "id": "abc123"},
            {
                "status": "error",
                "message": "token not registered",
                "details": {"error": "DeviceNotRegistered"},
            },
        ]
    })

    messages = [
        {"to": "ExponentPushToken[valid]", "title": "Test", "body": "Hello"},
        {"to": "ExponentPushToken[invalid]", "title": "Test", "body": "Hello"},
    ]
    invalid = await send_push_notifications(messages)

    assert invalid == ["ExponentPushToken[invalid]"]


async def test_send_push_empty_list():
    result = await send_push_notifications([])
    assert result == []


@patch("moods.services.push.httpx.AsyncClient")
async def test_send_push_handles_network_error(mock_client_cls):
    mock_client = AsyncMock()
    mock_client_cls.return_value.__aenter__.return_value = mock_client
    mock_client.post.side_effect = Exception("Network error")

    messages = [
        {"to": "ExponentPushToken[abc]", "title": "Test", "body": "Hello"},
    ]
    invalid = await send_push_notifications(messages)

    assert invalid == []
