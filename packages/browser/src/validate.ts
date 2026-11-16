import Ajv from "ajv";
import type { ToolDefinition, ToolProposal } from "@orivyn/core";

const ajv = new Ajv({ strict: false, allErrors: false });

/** Validate all model output in the browser, never trust inferred arguments. */
export function inspectLocalProposals(
  tools: readonly ToolDefinition[],
  proposals: readonly ToolProposal[],
) {
  const allowed = new Map(tools.map((tool) => [tool.name, tool]));
  const accepted: ToolProposal[] = [];
  const rejected: Array<{ name: string; reason: string }> = [];
  for (const proposal of proposals) {
    const tool = allowed.get(proposal.name);
    if (!tool) {
      rejected.push({ name: proposal.name, reason: "unknown-tool" });
      continue;
    }
    if (tool.execution !== "browser" || tool.risk !== "read") {
      rejected.push({ name: proposal.name, reason: "disallowed-execution" });
      continue;
    }
    try {
      if (!ajv.compile(tool.parameters)(proposal.arguments)) {
        rejected.push({ name: proposal.name, reason: "invalid-arguments" });
        continue;
      }
      accepted.push(proposal);
    } catch {
      rejected.push({ name: proposal.name, reason: "invalid-tool-schema" });
    }
  }
  return { accepted, rejected };
}

export function validateLocalProposals(
  tools: readonly ToolDefinition[],
  proposals: readonly ToolProposal[],
): ToolProposal[] {
  return inspectLocalProposals(tools, proposals).accepted;
}

export function assertLocalTools(tools: readonly ToolDefinition[]): void {
  if (!tools.length || tools.length > 20)
    throw new Error("Choose between one and twenty tools");
  if (new Set(tools.map((tool) => tool.name)).size !== tools.length)
    throw new Error("Tool names must be unique");
  if (
    tools.some((tool) => tool.execution !== "browser" || tool.risk !== "read")
  ) {
    throw new Error("Local inference only accepts read-only browser tools");
  }
}
