import type { ToolDefinition } from "@orivyn/core";

export type ApplicationManifest = {
  id: string;
  name: string;
  version: string;
  runtime: "browser";
  tools: readonly ToolDefinition[];
};

const APP_ID = /^[a-z][a-z0-9.-]{1,63}$/;
const TOOL_ID = /^[a-zA-Z][\w.:-]{0,99}$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export function defineApplication(
  manifest: ApplicationManifest,
): ApplicationManifest {
  if (!APP_ID.test(manifest.id)) throw new Error("Invalid application ID");
  if (!manifest.name.trim()) throw new Error("Application name is required");
  if (!SEMVER.test(manifest.version))
    throw new Error("Application version must be semver");
  if (manifest.runtime !== "browser")
    throw new Error("Only the browser runtime is supported in v0.5");
  const names = new Set<string>();
  for (const tool of manifest.tools) {
    if (!TOOL_ID.test(tool.name))
      throw new Error(`Invalid tool ID: ${tool.name}`);
    if (names.has(tool.name))
      throw new Error(`Duplicate tool in manifest: ${tool.name}`);
    if (tool.execution !== "browser" || tool.risk !== "read") {
      throw new Error(
        `Protected tool cannot be registered in a browser manifest: ${tool.name}`,
      );
    }
    if (tool.parameters.type !== "object")
      throw new Error(`Tool parameters must be an object schema: ${tool.name}`);
    names.add(tool.name);
  }
  return Object.freeze({
    ...manifest,
    tools: Object.freeze(
      manifest.tools.map((tool) => Object.freeze({ ...tool })),
    ),
  });
}
