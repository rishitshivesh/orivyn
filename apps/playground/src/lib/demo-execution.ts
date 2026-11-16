import type { ToolProposal } from "@orivyn/core";
import Ajv from "ajv";
import { demoTools, initialDemoState, type DemoState, type DemoPage, type DemoCategory, type DemoTechnology } from "./demo-domain.ts";

const ajv = new Ajv({ strict: true });
const validators = new Map(demoTools.map((tool) => [tool.name, ajv.compile(tool.parameters)]));

/** Execute only locally registered read-only UI handlers, never arbitrary model instructions. */
export function executeDemoProposals(
  current: DemoState,
  proposals: readonly ToolProposal[],
  enabledNames: readonly string[],
): { state: DemoState; applied: string[]; rejected: string[] } {
  let state = { ...current };
  const applied: string[] = [];
  const rejected: string[] = [];
  const allowed = new Set(enabledNames);
  for (const proposal of proposals.slice(0, 5)) {
    const tool = demoTools.find((item) => item.name === proposal.name);
    const validate = validators.get(proposal.name);
    if (!tool || !allowed.has(proposal.name) || tool.execution !== "browser" || tool.risk !== "read" ||
        !validate || !validate(proposal.arguments)) {
      rejected.push(proposal.name);
      continue;
    }
    switch (proposal.name) {
      case "navigate":
        state = { ...state, page: proposal.arguments.page as DemoPage };
        applied.push("Opened " + state.page);
        break;
      case "filter_projects":
        state = {
          ...state,
          page: "projects",
          category: (proposal.arguments.category as DemoCategory | undefined) ?? state.category,
          technology: (proposal.arguments.technology as DemoTechnology | undefined) ?? state.technology,
        };
        applied.push("Applied project filters");
        break;
      case "reset_view":
        state = { ...initialDemoState };
        applied.push("Restored default view");
        break;
      default:
        rejected.push(proposal.name);
    }
  }
  return { state, applied, rejected };
}
