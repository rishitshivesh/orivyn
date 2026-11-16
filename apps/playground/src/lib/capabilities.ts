import type { ToolDefinition } from "@orivyn/core";

/** Built-in examples, not persistent registered applications. */
export const sampleTools: ToolDefinition[] = [
  {
    name: "navigate",
    description: "Navigate to a public application page",
    parameters: {
      type: "object",
      properties: { page: { type: "string", enum: ["projects", "music", "career"] } },
      required: ["page"],
      additionalProperties: false,
    },
    execution: "browser",
    risk: "read",
  },
  {
    name: "filter_projects",
    description: "Filter visible public projects by technology",
    parameters: {
      type: "object",
      properties: { technology: { type: "string" } },
      required: ["technology"],
      additionalProperties: false,
    },
    execution: "browser",
    risk: "read",
  },
];

export type PlatformCapabilities = {
  version: string;
  provider: string;
  server_inference_enabled: boolean;
  browser_inference_available: boolean;
  tool_execution_enabled: boolean;
  max_input_chars: number;
  max_tools: number;
  features: string[];
};

export type ApiStatus =
  | { connected: true; capabilities: PlatformCapabilities }
  | { connected: false; reason: string };
