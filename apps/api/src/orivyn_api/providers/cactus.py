"""Optional Cactus model adapter. Never execute model-selected tools."""
from typing import Any

from orivyn_api.schemas import ToolDefinition, ToolProposal


class CactusProvider:
    name = "cactus"

    def propose(self, text: str, tools: list[ToolDefinition]) -> list[ToolProposal]:
        try:
            import cactus
        except ImportError as exc:
            raise RuntimeError("Install cactus-compute extra to enable Cactus inference") from exc

        # The SDK accepts raw tool schemas. We only request tool-call proposals,
        # never call run(), which executes registered Python tools.
        definitions = [
            {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters,
            }
            for tool in tools
        ]
        with cactus.Cactus(tools=definitions) as agent:
            outcome: dict[str, Any] = agent.complete(text)
        if not isinstance(outcome, dict):
            raise RuntimeError("Unexpected inference result")
        allowed = {tool.name for tool in tools}
        calls = outcome.get("function_calls", [])
        if not isinstance(calls, list):
            raise RuntimeError("Unexpected tool call response")
        proposals: list[ToolProposal] = []
        for call in calls:
            if not isinstance(call, dict):
                continue
            name = call.get("name")
            arguments = call.get("arguments")
            if name not in allowed or not isinstance(arguments, dict):
                continue
            proposals.append(
                ToolProposal(
                    name=name,
                    arguments=arguments,
                    confidence=outcome.get("confidence"),
                )
            )
        return proposals
