import type { ProposalRequest, ToolDefinition, ToolProposal } from "@orivyn/core";

export type DemoPage = "projects" | "music" | "career";
export type DemoCategory = "all" | "infrastructure" | "frontend" | "fullstack";
export type DemoTechnology = "all" | "kubernetes" | "react" | "nextjs" | "nodejs";
export type DemoState = { page: DemoPage; category: DemoCategory; technology: DemoTechnology };
export const initialDemoState: DemoState = { page: "projects", category: "all", technology: "all" };

export const demoTools: ToolDefinition[] = [
  {
    name: "navigate",
    description: "Show one section of the demonstration application. The page must be exactly projects, music or career. Use music for songs, audio, albums; career for work, experience or jobs; projects for code, technology and engineering.",
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
    description: "Show only demo projects matching a category and technology. For Kubernetes or infrastructure requests, category is infrastructure and technology is kubernetes. Omit optional filters that are not specified.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["all", "infrastructure", "frontend", "fullstack"] },
        technology: { type: "string", enum: ["all", "kubernetes", "react", "nextjs", "nodejs"] },
      },
      additionalProperties: false,
    },
    execution: "browser",
    risk: "read",
  },
  {
    name: "reset_view",
    description: "Reset the demo application to the default projects page with all filters cleared.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    execution: "browser",
    risk: "read",
  },
];

export const demoProjects: { title: string; category: Exclude<DemoCategory, "all">; technologies: Exclude<DemoTechnology, "all">[]; description: string }[] = [
  { title: "Registry-driven RBAC", category: "fullstack", technologies: ["react", "nodejs"], description: "Role registries and policy evaluation" },
  { title: "Infrastructure Observatory", category: "infrastructure", technologies: ["kubernetes", "nodejs"], description: "Kubernetes monitoring and service topology" },
  { title: "Portfolio OS", category: "frontend", technologies: ["nextjs", "react"], description: "Composable personal application suite" },
  { title: "Music Streaming", category: "fullstack", technologies: ["nextjs", "nodejs"], description: "Protected media delivery and playback" },
];

export function visibleProjects(state: DemoState) {
  return demoProjects.filter((project) =>
    (state.category === "all" || project.category === state.category) &&
    (state.technology === "all" || project.technologies.includes(state.technology)),
  );
}

export function makeProposal(name: string, args: Record<string, unknown>): ToolProposal {
  return { name, arguments: args, confidence: null };
}

/** Deterministic commands for known demo intents; no model guesswork is needed here. */
export function matchDemoIntent(input: string, enabled: readonly string[]): ToolProposal[] {
  const query = input.toLowerCase().trim().replace(/^(please|can you|could you)\s+/, "");
  const actionVerb = /^(open|navigate(?: to)?|go to|take me to|filter|reset|clear(?: all| filters)?|switch to|show(?: me)?|start over)(?:\s|$)/.test(query);
  const explanation = /^(what|why|how|when|where|who|which|explain|describe|tell me|show(?: me)? (?:how|why|what|when|where|whether))\b/.test(query);
  const negated = /^(don.t|do not|never|avoid)\b/.test(query) || /\b(and|then)\s+(explain|describe|compare|summarize|tell me)\b/.test(query);
  if (!actionVerb || explanation || negated) return [];
  const allowed = new Set(enabled);
  const reset = /\b(reset|clear (?:all|filters)|start over|default view)\b/.test(query);
  if (reset && allowed.has("reset_view")) return [makeProposal("reset_view", {})];

  const music = /\b(music|songs?|albums?|audio|tracks?|studio)\b/.test(query);
  const career = /\b(career|experience|employment|jobs?|resume|work history)\b/.test(query);
  const projects = /\b(projects?|portfolio|engineering|kubernetes|infrastructure|react|next\.?js|node\.?js|frontend|fullstack)\b/.test(query);
  const technology =
    /\bkubernetes\b|\bk8s\b/.test(query) ? "kubernetes" :
    /\bnext\.?js\b/.test(query) ? "nextjs" :
    /\breact\b/.test(query) ? "react" :
    /\bnode\.?js\b/.test(query) ? "nodejs" : undefined;
  const category =
    /\binfrastructure\b|\bdevops\b|\bkubernetes\b/.test(query) ? "infrastructure" :
    /\bfrontend\b/.test(query) ? "frontend" :
    /\bfullstack\b|\bfull.stack\b/.test(query) ? "fullstack" : undefined;
  const filtering = !!technology || !!category || /\bfilter\b/.test(query);
  const actions: ToolProposal[] = [];
  if (music && !career && !filtering && allowed.has("navigate")) {
    actions.push(makeProposal("navigate", { page: "music" }));
  } else if (career && !music && !filtering && allowed.has("navigate")) {
    actions.push(makeProposal("navigate", { page: "career" }));
  } else if (projects && allowed.has("navigate")) {
    actions.push(makeProposal("navigate", { page: "projects" }));
  }
  if (filtering && allowed.has("filter_projects")) {
    actions.push(makeProposal("filter_projects", {
      ...(category ? { category } : {}),
      ...(technology ? { technology } : {}),
    }));
  }
  return actions;
}

export function createDemoRequest(input: string, enabledNames: readonly string[]): ProposalRequest {
  return { app_id: "orivyn-demo", input, tools: demoTools.filter((tool) => enabledNames.includes(tool.name)) };
}
