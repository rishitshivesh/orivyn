import Ajv from "ajv";
import type { ToolDefinition, ToolProposal } from "@orivyn/core";

const ajv = new Ajv({ strict: false, allErrors: false });

/** Validate all model output in the browser, never trust inferred arguments. */
export function validateLocalProposals(tools: readonly ToolDefinition[], proposals: readonly ToolProposal[]): ToolProposal[] {
  const allowed = new Map(tools.map((tool) => [tool.name, tool]));
  return proposals.filter((proposal) => {
    const tool = allowed.get(proposal.name);
    if (!tool || tool.execution !== "browser" || tool.risk !== "read") return false;
    try {
      const validate = ajv.compile(tool.parameters);
      return validate(proposal.arguments);
    } catch {
      return false;
    }
  });
}

export function assertLocalTools(tools: readonly ToolDefinition[]): void {
  if (!tools.length || tools.length > 20) throw new Error("Choose between one and twenty tools");
  if (new Set(tools.map((tool) => tool.name)).size !== tools.length) throw new Error("Tool names must be unique");
  if (tools.some((tool) => tool.execution !== "browser" || tool.risk !== "read")) {
    throw new Error("Local inference only accepts read-only browser tools");
  }
}
