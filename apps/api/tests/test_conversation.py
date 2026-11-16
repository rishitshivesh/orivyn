"""Provider boundaries and streaming contract without remote network calls."""
from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from orivyn_api.conversation.provider import ConversationProvider
from orivyn_api.conversation.routes import get_provider
from orivyn_api.main import app
from orivyn_api.security import require_api_key
from orivyn_api.settings import Settings

client = TestClient(app)
GOOD = {"app_id": "test", "messages": [{"role": "user", "content": "Hello"}]}


def fake_provider() -> ConversationProvider:
    provider = ConversationProvider(Settings(
        orivyn_chat_provider="openai-compatible",
        orivyn_chat_api_key="test-only",
        orivyn_chat_model="example-model",
    ))
    provider.complete = AsyncMock(return_value=("Hello back", "stop"))
    return provider


def test_chat_requires_service_key():
    response = client.post("/v1/chat", json=GOOD)
    assert response.status_code in (401, 503)


def test_empty_history_is_rejected():
    response = client.post("/v1/chat", json={"app_id": "test", "messages": []})
    assert response.status_code in (401, 503)


def test_chat_returns_provider_response():
    app.dependency_overrides[require_api_key] = lambda: None
    app.dependency_overrides[get_provider] = fake_provider
    try:
        response = client.post("/v1/chat", json=GOOD)
        assert response.status_code == 200
        assert response.json()["content"] == "Hello back"
        assert response.json()["model"] == "example-model"
    finally:
        app.dependency_overrides.clear()


def test_stream_events_are_parseable():
    async def fake_stream(_request):
        yield "Hello"
        yield " world"

    provider = fake_provider()
    provider.stream = fake_stream
    app.dependency_overrides[require_api_key] = lambda: None
    app.dependency_overrides[get_provider] = lambda: provider
    try:
        response = client.post("/v1/chat/stream", json=GOOD)
        assert response.status_code == 200
        assert "event: meta" in response.text
        assert "event: delta" in response.text
        assert '"text": "Hello"' in response.text
        assert "event: done" in response.text
    finally:
        app.dependency_overrides.clear()


def test_openapi_includes_chat_routes():
    paths = client.get("/openapi.json").json()["paths"]
    assert "/v1/chat" in paths
    assert "/v1/chat/stream" in paths


def test_invalid_turn_sequence_is_rejected() -> None:
    app.dependency_overrides[require_api_key] = lambda: None
    try:
        response = client.post(
            "/v1/chat",
            json={
                "app_id": "test",
                "messages": [{"role": "assistant", "content": "Only assistant"}],
            },
        )
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_disabled_provider_fails_closed() -> None:
    app.dependency_overrides[require_api_key] = lambda: None
    app.dependency_overrides[get_provider] = lambda: ConversationProvider(Settings(
        orivyn_chat_provider="disabled",
        orivyn_chat_api_key="",
        orivyn_chat_model="",
    ))
    try:
        response = client.post("/v1/chat", json=GOOD)
        assert response.status_code == 503
    finally:
        app.dependency_overrides.clear()
