import type { ToolProposal } from "@orivyn/core";
import { createActionExecutor } from "@orivyn/actions";
import type { RuntimeRegistration } from "@orivyn/runtime";
import {
  demoTools,
  initialDemoState,
  type DemoState,
  type DemoPage,
  type DemoCategory,
  type DemoTechnology,
} from "./demo-domain.ts";

const tool = (name: string) => {
  const definition = demoTools.find((item) => item.name === name);
  if (!definition) throw new Error(`Missing demo tool: ${name}`);
  return definition;
};

/** One registration set shared by the Playground and Application Studio. */
export const demoRegistrations: readonly RuntimeRegistration<DemoState>[] = [
  {
    definition: tool("navigate"),
    execute: (state, args) => ({ ...state, page: args.page as DemoPage }),
  },
  {
    definition: tool("filter_projects"),
    available: (context) => context.route === "/projects",
    execute: (state, args) => ({
      ...state,
      page: "projects",
      category: (args.category as DemoCategory | undefined) ?? state.category,
      technology: (args.technology as DemoTechnology | undefined) ?? state.technology,
    }),
  },
  {
    definition: tool("reset_view"),
    execute: () => ({ ...initialDemoState }),
  },
];

const executor = createActionExecutor<DemoState>(demoRegistrations);

export function executeDemoProposals(
  current: DemoState,
  proposals: readonly ToolProposal[],
  enabledNames: readonly string[],
) {
  const result = executor.execute(current, proposals, enabledNames);
  return {
    ...result,
    applied: result.applied.map((name) =>
      name === "navigate" ? `Opened ${result.state.page}` :
      name === "filter_projects" ? "Applied project filters" :
      "Restored default view",
    ),
  };
}
