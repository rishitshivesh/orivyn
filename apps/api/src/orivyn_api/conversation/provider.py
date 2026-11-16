"""OpenAI-compatible chat adapter with HTTP streaming and no provider-specific SDK."""
import json
from collections.abc import AsyncIterator
from urllib.parse import urlsplit

import httpx

from orivyn_api.conversation.schemas import ChatRequest
from orivyn_api.settings import Settings


class ConversationUnavailable(Exception):
    """Provider unavailable or not configured."""


class ConversationProvider:
    def __init__(self, settings: Settings):
        self.settings = settings

    @property
    def enabled(self) -> bool:
        return bool(
            self.settings.orivyn_chat_provider == "openai-compatible"
            and self.settings.orivyn_chat_api_key
            and self.settings.orivyn_chat_model
        )

    def _endpoint(self) -> str:
        base = self.settings.orivyn_chat_base_url.rstrip("/")
        parsed = urlsplit(base)
        is_https = parsed.scheme == "https" and bool(parsed.hostname)
        is_local_http = (
            self.settings.orivyn_chat_allow_insecure_local
            and parsed.scheme == "http"
            and parsed.hostname in {"localhost", "127.0.0.1"}
        )
        if not (is_https or is_local_http) or parsed.username or parsed.password:
            raise ConversationUnavailable("Provider URL must use HTTPS or explicitly allowed localhost HTTP")
        return f"{base}/chat/completions"

    def _request(self, request: ChatRequest, stream: bool) -> dict:
        messages = []
        if request.instructions:
            messages.append({"role": "system", "content": request.instructions})
        messages.extend(message.model_dump() for message in request.messages)
        token_parameter = self.settings.orivyn_chat_token_parameter
        if token_parameter not in {"max_tokens", "max_completion_tokens"}:
            raise ConversationUnavailable("Unsupported chat token parameter")
        return {
            "model": self.settings.orivyn_chat_model,
            "messages": messages,
            "stream": stream,
            token_parameter: self.settings.orivyn_chat_max_output_tokens,
        }

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.settings.orivyn_chat_api_key}",
            "Content-Type": "application/json",
        }

    async def complete(self, request: ChatRequest) -> tuple[str, str | None]:
        if not self.enabled:
            raise ConversationUnavailable("Conversational provider is not configured")
        async with httpx.AsyncClient(timeout=self.settings.orivyn_chat_timeout_seconds) as client:
            try:
                response = await client.post(
                    self._endpoint(), headers=self._headers(),
                    json=self._request(request, stream=False),
                )
                response.raise_for_status()
                payload = response.json()
                choice = payload["choices"][0]
                content = choice["message"]["content"]
                if not isinstance(content, str):
                    raise TypeError("Provider returned non-text content")
                return content, choice.get("finish_reason")
            except (httpx.HTTPError, ValueError, KeyError, IndexError, TypeError) as exc:
                raise ConversationUnavailable("Conversational provider failed; inspect server logs") from exc

    async def stream(self, request: ChatRequest) -> AsyncIterator[str]:
        if not self.enabled:
            raise ConversationUnavailable("Conversational provider is not configured")
        timeout = httpx.Timeout(self.settings.orivyn_chat_timeout_seconds)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client, client.stream(
                    "POST", self._endpoint(), headers=self._headers(),
                    json=self._request(request, stream=True),
                ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    chunk = line[6:]
                    if chunk == "[DONE]":
                        return
                    try:
                        payload = json.loads(chunk)
                        delta = payload["choices"][0].get("delta", {}).get("content")
                        if isinstance(delta, str) and delta:
                            yield delta
                    except (ValueError, KeyError, TypeError, IndexError):
                        continue
        except httpx.HTTPError as exc:
            raise ConversationUnavailable("Conversational provider stream failed") from exc
