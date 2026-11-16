"""Authenticated chat and Server-Sent Events endpoints."""
import json
import logging
import uuid
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from orivyn_api.conversation.provider import ConversationProvider, ConversationUnavailable
from orivyn_api.conversation.schemas import ChatRequest, ChatResponse
from orivyn_api.security import require_api_key
from orivyn_api.settings import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v1/chat", tags=["Conversation"], dependencies=[Depends(require_api_key)])


def get_provider() -> ConversationProvider:
    return ConversationProvider(get_settings())


@router.post(
    "",
    response_model=ChatResponse,
    summary="Complete a conversation",
    description="Private server-side provider call. Never executes tools or stores history.",
    responses={503: {"description": "No provider configured or provider unavailable"}},
)
async def chat(
    body: ChatRequest, provider: ConversationProvider = Depends(get_provider),
) -> ChatResponse:
    if not provider.enabled:
        raise HTTPException(status_code=503, detail="Conversational provider is disabled")
    try:
        content, reason = await provider.complete(body)
    except ConversationUnavailable as exc:
        logger.warning("Chat completion unavailable: %s", exc)
        raise HTTPException(status_code=502, detail="Conversational provider unavailable") from exc
    return ChatResponse(
        request_id=str(uuid.uuid4()), provider="openai-compatible",
        model=provider.settings.orivyn_chat_model, content=content,
        finish_reason=reason,
    )


def event(name: str, payload: dict) -> str:
    return f"event: {name}\ndata: {json.dumps(payload)}\n\n"


@router.post(
    "/stream",
    summary="Stream conversation text",
    description="Text/event-stream with meta, delta, done, and error events. No tool execution.",
    responses={
        200: {"content": {"text/event-stream": {"schema": {"type": "string"}}}},
        503: {"description": "Provider not configured"},
    },
)
async def chat_stream(
    body: ChatRequest, provider: ConversationProvider = Depends(get_provider),
) -> StreamingResponse:
    if not provider.enabled:
        raise HTTPException(status_code=503, detail="Conversational provider is disabled")
    request_id = str(uuid.uuid4())

    async def events() -> AsyncIterator[str]:
        yield event("meta", {
            "request_id": request_id, "provider": "openai-compatible",
            "model": provider.settings.orivyn_chat_model,
        })
        try:
            async for text in provider.stream(body):
                yield event("delta", {"text": text})
            yield event("done", {"request_id": request_id})
        except ConversationUnavailable:
            logger.warning("Chat stream unavailable for request %s", request_id)
            yield event("error", {"message": "Conversational provider unavailable"})

    return StreamingResponse(
        events(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )
