import { createApplicationRuntime, defineApplication } from "@orivyn/runtime";
import { demoTools, initialDemoState } from "./demo-domain";
import { demoRegistrations } from "./demo-execution";

export const studioManifest = defineApplication({
  id: "orivyn.studio-demo",
  name: "Portfolio Demo",
  version: "0.5.0",
  runtime: "browser",
  tools: demoTools,
});

/** Ephemeral local runtime. Console does not register applications with the API yet. */
export function createStudioRuntime() {
  return createApplicationRuntime({
    manifest: studioManifest,
    initialState: { ...initialDemoState },
    context: { route: "/projects" },
    registrations: demoRegistrations,
  });
}
