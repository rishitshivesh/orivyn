"""Bounded conversation contracts. Client owns ephemeral history; no server storage."""

from typing import Literal

from pydantic import BaseModel, Field, model_validator


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    app_id: str = Field(min_length=1, max_length=100, pattern=r"^[a-zA-Z0-9][\w.-]*$")
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)
    instructions: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def last_message_is_user(self) -> "ChatRequest":
        if self.messages[-1].role != "user":
            raise ValueError("The last message must be from the user")
        return self


class ChatResponse(BaseModel):
    request_id: str
    provider: str
    model: str
    content: str
    finish_reason: str | None = None
