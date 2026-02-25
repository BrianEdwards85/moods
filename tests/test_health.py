from unittest.mock import AsyncMock, patch


async def test_health_endpoint_healthy(client):
    with patch("moods.app.httpx.AsyncClient") as mock_client_cls:
        mock_resp = AsyncMock()
        mock_resp.status_code = 200
        mock_ctx = AsyncMock()
        mock_ctx.__aenter__.return_value.get = AsyncMock(return_value=mock_resp)
        mock_client_cls.return_value = mock_ctx

        resp = await client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "healthy"
        assert body["checks"]["db"] == "ok"
        assert body["checks"]["mailgun"] == "ok"


async def test_health_endpoint_mailgun_down(client):
    with patch("moods.app.httpx.AsyncClient") as mock_client_cls:
        mock_ctx = AsyncMock()
        mock_ctx.__aenter__.return_value.get = AsyncMock(
            side_effect=Exception("connection refused")
        )
        mock_client_cls.return_value = mock_ctx

        resp = await client.get("/health")
        assert resp.status_code == 503
        body = resp.json()
        assert body["status"] == "degraded"
        assert body["checks"]["db"] == "ok"
        assert body["checks"]["mailgun"] == "connection refused"
