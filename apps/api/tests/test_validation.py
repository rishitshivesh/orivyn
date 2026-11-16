"""Model output is never trusted without schema checks."""

import pytest

from orivyn_api.schemas import ToolDefinition, ToolProposal
from orivyn_api.validation import ToolSchemaError, validate_proposals, validate_tools


def sample_tool() -> ToolDefinition:
    return ToolDefinition(
        name="navigate",
        description="Navigate to a known page",
        parameters={
            "type": "object",
            "properties": {"page": {"type": "string", "enum": ["projects", "music"]}},
            "required": ["page"],
            "additionalProperties": False,
        },
    )


def test_valid_output_is_accepted() -> None:
    tool = sample_tool()
    validate_tools([tool])
    calls = [ToolProposal(name="navigate", arguments={"page": "music"})]
    assert validate_proposals([tool], calls) == calls


def test_unrecognized_tools_are_dropped() -> None:
    calls = [ToolProposal(name="execute_shell", arguments={"command": "echo x"})]
    assert validate_proposals([sample_tool()], calls) == []


def test_invalid_arguments_are_dropped() -> None:
    calls = [ToolProposal(name="navigate", arguments={"page": "admin"})]
    assert validate_proposals([sample_tool()], calls) == []


def test_extra_fields_are_dropped() -> None:
    calls = [ToolProposal(name="navigate", arguments={"page": "music", "secret": True})]
    assert validate_proposals([sample_tool()], calls) == []


def test_invalid_schema_fails_before_inference() -> None:
    tool = sample_tool().model_copy(update={"parameters": {"type": "string"}})
    with pytest.raises(ToolSchemaError):
        validate_tools([tool])
