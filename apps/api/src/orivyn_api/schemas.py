"""Versioned HTTP contracts."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class ToolDefinition(BaseModel):
    name: str = Field(min_length=1, max_length=100, pattern=r"^[a-zA-Z][\w.:-]*$")
    description: str = Field(min_length=1, max_length=500)
    parameters: dict[str, Any] = Field(default_factory=dict)
    execution: Literal["browser", "server"] = "browser"
    risk: Literal["read", "write", "sensitive"] = "read"


class ProposalRequest(BaseModel):
    app_id: str = Field(min_length=1, max_length=100, pattern=r"^[a-zA-Z0-9][\w.-]*$")
    input: str = Field(min_length=1)
    tools: list[ToolDefinition] = Field(min_length=1)


class ToolProposal(BaseModel):
    name: str
    arguments: dict[str, Any]
    confidence: float | None = None


class ProposalResponse(BaseModel):
    request_id: str
    provider: str
    status: Literal["proposed", "no_match"]
    proposals: list[ToolProposal]
