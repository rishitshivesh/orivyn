"""Inference provider abstraction."""
from typing import Protocol

from orivyn_api.schemas import ToolDefinition, ToolProposal


class ProposalProvider(Protocol):
    name: str

    def propose(self, text: str, tools: list[ToolDefinition]) -> list[ToolProposal]:
        """Return proposals; do not execute tools."""
        ...
