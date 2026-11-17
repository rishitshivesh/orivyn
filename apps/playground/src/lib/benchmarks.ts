import type { ToolProposal } from "@orivyn/core";
import { demoTools, makeProposal, matchDemoIntent } from "./demo-domain.ts";

/** Golden fixtures test tool routing, arguments, abstention and disabled capabilities. */
export interface BenchmarkCase {
  id: string;
  input: string;
  enabled: readonly string[];
  expected: readonly ToolProposal[];
  note: string;
}

const all = demoTools.map((tool) => tool.name);

export const benchmarkCases: readonly BenchmarkCase[] = [
  {
    id: "NAV-MUSIC",
    input: "Open the music section",
    enabled: all,
    expected: [makeProposal("navigate", { page: "music" })],
    note: "Simple navigation",
  },
  {
    id: "NAV-CAREER",
    input: "Navigate to my career history",
    enabled: all,
    expected: [makeProposal("navigate", { page: "career" })],
    note: "Another destination",
  },
  {
    id: "NAV-PROJECTS",
    input: "Show my projects",
    enabled: all,
    expected: [makeProposal("navigate", { page: "projects" })],
    note: "Projects view",
  },
  {
    id: "FILTER-K8S",
    input: "Show infrastructure projects using Kubernetes",
    enabled: all,
    expected: [
      makeProposal("navigate", { page: "projects" }),
      makeProposal("filter_projects", {
        category: "infrastructure",
        technology: "kubernetes",
      }),
    ],
    note: "Multi-tool request",
  },
  {
    id: "FILTER-REACT",
    input: "Show React projects",
    enabled: all,
    expected: [
      makeProposal("navigate", { page: "projects" }),
      makeProposal("filter_projects", { technology: "react" }),
    ],
    note: "Specific filter",
  },
  {
    id: "RESET",
    input: "Reset the view",
    enabled: all,
    expected: [makeProposal("reset_view", {})],
    note: "Reset state",
  },
  {
    id: "DISABLED",
    input: "Open the music section",
    enabled: ["filter_projects"],
    expected: [],
    note: "Disabled tool must abstain",
  },
  {
    id: "UNKNOWN",
    input: "Open my billing account",
    enabled: all,
    expected: [],
    note: "Unsupported destination",
  },
  {
    id: "QUESTION",
    input: "Explain Kubernetes architecture",
    enabled: all,
    expected: [],
    note: "Do not navigate for explanations",
  },
  {
    id: "NO-SELECTION",
    input: "Open this song",
    enabled: all,
    expected: [],
    note: "Reject unresolved selection",
  },
  {
    id: "AMBIGUOUS",
    input: "Open music and career",
    enabled: all,
    expected: [],
    note: "Reject competing destinations",
  },
  {
    id: "NEGATION",
    input: "Don\u0027t open music",
    enabled: all,
    expected: [],
    note: "Respect negated commands",
  },
];

/** Compares tool names and *arguments*. Exact ordering is not important. */
export function proposalsMatch(
  actual: readonly ToolProposal[],
  expected: readonly ToolProposal[],
): boolean {
  const normalize = (items: readonly ToolProposal[]) =>
    items
      .map((item) => ({
        name: item.name,
        arguments: Object.fromEntries(
          Object.entries(item.arguments).sort(([a], [b]) => a.localeCompare(b)),
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  return (
    JSON.stringify(normalize(actual)) === JSON.stringify(normalize(expected))
  );
}

export interface BenchmarkResult {
  id: string;
  input: string;
  expected: readonly ToolProposal[];
  actual: readonly ToolProposal[];
  passed: boolean;
  durationMs: number;
  error?: string;
  diagnostics?: {
    raw_calls: number;
    rejected: Array<{ name: string; reason: string }>;
  };
}

export function benchmarkSummary(results: readonly BenchmarkResult[]) {
  const passed = results.filter((result) => result.passed).length;
  const durationMs = results.reduce(
    (sum, result) => sum + result.durationMs,
    0,
  );
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    accuracy: results.length
      ? Math.round((passed / results.length) * 1000) / 10
      : 0,
    averageMs: results.length ? Math.round(durationMs / results.length) : 0,
  };
}

export function deterministicBaseline(scenario: BenchmarkCase): ToolProposal[] {
  return matchDemoIntent(scenario.input, scenario.enabled);
}
