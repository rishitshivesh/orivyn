"""Validate untrusted model-selected tools with application-defined JSON schemas."""
from jsonschema import Draft202012Validator, SchemaError

from orivyn_api.schemas import ToolDefinition, ToolProposal


class ToolSchemaError(ValueError):
    """Invalid registered tool or invalid proposed call."""


def validate_tools(tools: list[ToolDefinition]) -> None:
    for tool in tools:
        schema = tool.parameters
        if schema.get("type") != "object":
            raise ToolSchemaError(f"Tool '{tool.name}' must declare an object schema")
        try:
            Draft202012Validator.check_schema(schema)
        except SchemaError as exc:
            raise ToolSchemaError(f"Tool '{tool.name}' has an invalid schema") from exc


def validate_proposals(
    tools: list[ToolDefinition], proposals: list[ToolProposal]
) -> list[ToolProposal]:
    allowed = {tool.name: tool for tool in tools}
    validated: list[ToolProposal] = []
    for proposal in proposals:
        tool = allowed.get(proposal.name)
        if tool is None:
            continue
        if Draft202012Validator(tool.parameters).is_valid(proposal.arguments):
            validated.append(proposal)
    return validated
