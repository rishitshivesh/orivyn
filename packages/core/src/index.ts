/** Stable public contracts shared by runtimes and SDKs. */
export type ExecutionTarget = "browser" | "server";
export type ToolRisk = "read" | "write" | "sensitive";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execution: ExecutionTarget;
  risk: ToolRisk;
}

export interface ProposalRequest {
  app_id: string;
  input: string;
  tools: ToolDefinition[];
}

export interface ToolProposal {
  name: string;
  arguments: Record<string, unknown>;
  confidence: number | null;
}

export interface ProposalResponse {
  request_id: string;
  provider: string;
  status: "proposed" | "no_match";
  proposals: ToolProposal[];
}

/** The owning app performs authorization before applying any validated action. */
export function isBrowserReadTool(tool: ToolDefinition): boolean {
  return tool.execution === "browser" && tool.risk === "read";
}

export function uniqueToolNames(tools: readonly ToolDefinition[]): boolean {
  return new Set(tools.map((tool) => tool.name)).size === tools.length;
}
