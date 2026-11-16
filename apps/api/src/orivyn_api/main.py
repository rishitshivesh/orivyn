"""Public HTTP surface and server-side tool proposal endpoint."""
import asyncio
import uuid

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from scalar_fastapi import add_scalar_reference, Theme

from orivyn_api.conversation.routes import router as conversation_router
from orivyn_api.providers.factory import create_provider
from orivyn_api.schemas import ProposalRequest, ProposalResponse
from orivyn_api.security import require_api_key
from orivyn_api.settings import get_settings
from orivyn_api.validation import ToolSchemaError, validate_proposals, validate_tools

settings = get_settings()
app = FastAPI(
    title="Orivyn API",
    version="0.3.0",
    description=(
        "Frontend-first intelligence platform. Tool calls are **proposals**, never "
        "executed actions. Applications enforce their own authorization and validation."
    ),
    docs_url=None,
    redoc_url=None,
    openapi_tags=[
        {"name": "Health", "description": "Liveness and configuration checks."},
        {"name": "Platform", "description": "Discover available runtime capabilities."},
        {"name": "Inference", "description": "Schema-validated read-only tool proposals."},
        {"name": "Conversation", "description": "Authenticated, explicitly configured conversation APIs."},
    ],
)
add_scalar_reference(app, route="/docs", theme=Theme.KEPLER)
app.include_router(conversation_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Orivyn-Key"],
)
_inference_slots = asyncio.Semaphore(1)


@app.get(
    "/health/live",
    tags=["Health"],
    summary="Liveness",
    description="Does not load models or contact external services.",
)
def live() -> dict[str, str]:
    return {"status": "ok"}


@app.get(
    "/health/ready",
    tags=["Health"],
    summary="Configuration readiness",
    description="Shows configured inference provider. Does **not** imply weights are loaded.",
)
def ready() -> dict[str, str]:
    return {"status": "configured", "provider": settings.orivyn_inference_provider}


@app.get(
    "/v1/capabilities",
    tags=["Platform"],
    summary="Discover currently available platform capabilities",
    description="Public, non-sensitive metadata for console display and debugging.",
)
def capabilities() -> dict[str, object]:
    enabled = settings.orivyn_inference_provider != "disabled"
    return {
        "version": app.version,
        "provider": settings.orivyn_inference_provider,
        "server_inference_enabled": enabled,
        "browser_inference_available": False,
        "tool_execution_enabled": False,
        "max_input_chars": settings.orivyn_max_input_chars,
        "max_tools": settings.orivyn_max_tools,
        "features": ["tool-proposals", "schema-validation", "scalar-openapi", "conversation-api", "chat-sse"],
        "conversation_enabled": bool(settings.orivyn_chat_provider == "openai-compatible" and settings.orivyn_chat_api_key and settings.orivyn_chat_model),
    }


@app.post(
    "/v1/proposals",
    response_model=ProposalResponse,
    dependencies=[Depends(require_api_key)],
    tags=["Inference"],
    summary="Generate validated tool proposals",
    description=(
        "Requires private X-Orivyn-Key service credential. The server permits only "
        "read-only browser tools in this foundation build. **No tool is executed.**"
    ),
    responses={
        401: {"description": "Invalid service credentials"},
        403: {"description": "Requested tool has disallowed execution or risk level"},
        413: {"description": "Input or tool count exceeded server limit"},
        422: {"description": "Invalid tool schema or request"},
        503: {"description": "Service not configured or inference unavailable"},
        504: {"description": "Inference timed out"},
    },
)
async def proposals(body: ProposalRequest) -> ProposalResponse:
    if len(body.input) > settings.orivyn_max_input_chars:
        raise HTTPException(status_code=413, detail="Input too long")
    if len(body.tools) > settings.orivyn_max_tools:
        raise HTTPException(status_code=413, detail="Too many tools")
    if len({tool.name for tool in body.tools}) != len(body.tools):
        raise HTTPException(status_code=422, detail="Duplicate tools")
    if any(tool.execution != "browser" or tool.risk != "read" for tool in body.tools):
        raise HTTPException(status_code=403, detail="Only read-only browser tools supported")
    try:
        validate_tools(body.tools)
    except ToolSchemaError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    try:
        provider = create_provider(settings.orivyn_inference_provider)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    try:
        async with _inference_slots:
            selected = await asyncio.wait_for(
                asyncio.to_thread(provider.propose, body.input, body.tools),
                timeout=30.0,
            )
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail="Inference timed out") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    validated = validate_proposals(body.tools, selected)
    return ProposalResponse(
        request_id=str(uuid.uuid4()),
        provider=provider.name,
        status="proposed" if validated else "no_match",
        proposals=validated,
    )
