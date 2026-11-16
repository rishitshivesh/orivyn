"""Conversation provider config tests with no external calls."""
import pytest

from orivyn_api.conversation.provider import ConversationProvider, ConversationUnavailable
from orivyn_api.conversation.schemas import ChatMessage, ChatRequest
from orivyn_api.settings import Settings


def provider(**options) -> ConversationProvider:
    return ConversationProvider(Settings(
        orivyn_chat_provider="openai-compatible",
        orivyn_chat_api_key="test-key",
        orivyn_chat_model="test-model",
        **options,
    ))


def test_default_provider_uses_https() -> None:
    assert provider()._endpoint() == "https://api.openai.com/v1/chat/completions"


def test_http_remote_provider_is_rejected() -> None:
    with pytest.raises(ConversationUnavailable):
        provider(orivyn_chat_base_url="http://example.org/v1")._endpoint()


def test_local_http_requires_explicit_opt_in() -> None:
    with pytest.raises(ConversationUnavailable):
        provider(orivyn_chat_base_url="http://127.0.0.1:11434/v1")._endpoint()
    assert provider(
        orivyn_chat_base_url="http://127.0.0.1:11434/v1",
        orivyn_chat_allow_insecure_local=True,
    )._endpoint().endswith("/chat/completions")


def test_provider_does_not_persist_history() -> None:
    api = provider()
    request = ChatRequest(
        app_id="test", messages=[ChatMessage(role="user", content="Hello")],
    )
    assert api._request(request, stream=True)["messages"] == [{"role": "user", "content": "Hello"}]
    assert api._request(request, stream=True)["stream"] is True


def test_configurable_token_parameter() -> None:
    request = ChatRequest(
        app_id="test", messages=[ChatMessage(role="user", content="Hi")],
    )
    payload = provider(orivyn_chat_token_parameter="max_completion_tokens")._request(
        request, stream=False,
    )
    assert "max_completion_tokens" in payload
    assert "max_tokens" not in payload


def test_localhost_credential_url_cannot_bypass_host_check() -> None:
    with pytest.raises(ConversationUnavailable):
        provider(
            orivyn_chat_base_url="http://localhost:fake@evil.example/v1",
            orivyn_chat_allow_insecure_local=True,
        )._endpoint()
