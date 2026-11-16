import type { ToolDefinition } from "@orivyn/core";
import { demoTools } from "./demo-domain";

/** Backwards-compatible export of sample tool contracts for the registry screen. */
export const sampleTools: ToolDefinition[] = demoTools;

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
