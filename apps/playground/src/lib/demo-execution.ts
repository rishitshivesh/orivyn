import type { ToolProposal } from "@orivyn/core";
import { createActionExecutor } from "@orivyn/actions";
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

export const demoExecutor = createActionExecutor<DemoState>([
  {
    definition: tool("navigate"),
    execute: (state, args) => ({ ...state, page: args.page as DemoPage }),
  },
  {
    definition: tool("filter_projects"),
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
]);

/** Demo adapter. Every action is checked again by the generic Orivyn executor. */
export function executeDemoProposals(
  current: DemoState,
  proposals: readonly ToolProposal[],
  enabledNames: readonly string[],
) {
  const result = demoExecutor.execute(current, proposals, enabledNames);
  return {
    ...result,
    applied: result.applied.map((name) =>
      name === "navigate" ? `Opened ${result.state.page}` :
      name === "filter_projects" ? "Applied project filters" :
      "Restored default view",
    ),
  };
}
