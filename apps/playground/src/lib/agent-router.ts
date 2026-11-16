import type { ToolProposal } from "@orivyn/core";
import { matchDemoIntent } from "./demo-domain.ts";

export type RoutedIntent =
  | { kind: "action"; proposals: ToolProposal[] }
  | { kind: "conversation"; proposals: [] };

/**
 * Conservative demo router. Recognized action verbs qualify for local matching.
 * Everything else is treated as a question, never guessed into a UI action.
 */
export function routeAgentInput(
  input: string,
  enabledNames: readonly string[],
): RoutedIntent {
  const text = input
    .toLowerCase()
    .trim()
    .replace(/^(please|can you|could you)\s+/, "");
  const action =
    /^(open|navigate(?: to)?|go to|take me to|filter|reset|clear(?: all| filters)?|switch to|show(?: me)?)(?:\s|$)/.test(
      text,
    );
  const question =
    /^(what|why|how|when|where|who|which|explain|describe|tell me|can you explain|show(?: me)? (?:how|why|what|when|where|whether))\b/.test(
      text,
    );
  const compound =
    /\b(and|then)\s+(explain|describe|compare|summarize|tell me)\b/.test(text);
  if (!action || question || compound)
    return { kind: "conversation", proposals: [] };
  const proposals = matchDemoIntent(input, enabledNames);
  return proposals.length
    ? { kind: "action", proposals }
    : { kind: "conversation", proposals: [] };
}
