"""Orivyn FastAPI application."""
import asyncio
import uuid

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from orivyn_api.providers.factory import create_provider
from orivyn_api.schemas import ProposalRequest, ProposalResponse
from orivyn_api.security import require_api_key
from orivyn_api.settings import get_settings
from orivyn_api.validation import ToolSchemaError, validate_proposals, validate_tools

settings = get_settings()
app = FastAPI(title="Orivyn API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Orivyn-Key"],
)
_inference_slots = asyncio.Semaphore(1)


@app.get("/health/live")
def live() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready")
def ready() -> dict[str, str]:
    return {"status": "configured", "provider": settings.orivyn_inference_provider}


@app.post("/v1/proposals", response_model=ProposalResponse, dependencies=[Depends(require_api_key)])
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
