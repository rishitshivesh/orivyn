import Ajv, { type ValidateFunction } from "ajv";
import type { ToolDefinition, ToolProposal } from "@orivyn/core";

/** A host application owns handlers and state transitions. Inference supplies proposals only. */
export interface ActionRegistration<State> {
  definition: ToolDefinition;
  execute: (
    state: Readonly<State>,
    args: Readonly<Record<string, unknown>>,
  ) => State;
}

export type ActionRejection =
  | "unknown"
  | "disabled"
  | "forbidden"
  | "invalid-arguments"
  | "handler-error";

export interface ActionTrace {
  name: string;
  status: "applied" | "rejected";
  reason?: ActionRejection;
  duration_ms: number;
}

export interface ExecutionReport<State> {
  state: State;
  applied: string[];
  rejected: string[];
  trace: ActionTrace[];
}

/** Immutable, allowlisted, schema-validated synchronous UI-action executor. */
export function createActionExecutor<State>(
  registrations: readonly ActionRegistration<State>[],
) {
  const ajv = new Ajv({ strict: true, allErrors: false });
  const registry = new Map<
    string,
    { registration: ActionRegistration<State>; validate: ValidateFunction }
  >();
  for (const registration of registrations) {
    const definition = registration.definition;
    if (registry.has(definition.name))
      throw new Error(`Duplicate action: ${definition.name}`);
    if (definition.execution !== "browser" || definition.risk !== "read") {
      throw new Error(
        `Only read-only browser actions are supported: ${definition.name}`,
      );
    }
    registry.set(definition.name, {
      registration,
      validate: ajv.compile(definition.parameters),
    });
  }

  return {
    definitions(): ToolDefinition[] {
      return registrations.map(({ definition }) => definition);
    },
    execute(
      current: State,
      proposals: readonly ToolProposal[],
      enabledNames: readonly string[],
      maxActions = 5,
    ): ExecutionReport<State> {
      if (
        !Number.isSafeInteger(maxActions) ||
        maxActions < 1 ||
        maxActions > 20
      ) {
        throw new Error("maxActions must be an integer between 1 and 20");
      }
      const enabled = new Set(enabledNames);
      const trace: ActionTrace[] = [];
      let state = current;
      for (const proposal of proposals.slice(0, maxActions)) {
        const start = performance.now();
        const entry = registry.get(proposal.name);
        let reason: ActionRejection | undefined;
        if (!entry) reason = "unknown";
        else if (!enabled.has(proposal.name)) reason = "disabled";
        else if (
          entry.registration.definition.execution !== "browser" ||
          entry.registration.definition.risk !== "read"
        )
          reason = "forbidden";
        else if (!entry.validate(proposal.arguments))
          reason = "invalid-arguments";
        if (!reason && entry) {
          try {
            state = entry.registration.execute(state, proposal.arguments);
          } catch {
            reason = "handler-error";
          }
        }
        trace.push({
          name: proposal.name,
          status: reason ? "rejected" : "applied",
          ...(reason ? { reason } : {}),
          duration_ms: Math.round((performance.now() - start) * 100) / 100,
        });
      }
      return {
        state,
        applied: trace
          .filter((item) => item.status === "applied")
          .map((item) => item.name),
        rejected: trace
          .filter((item) => item.status === "rejected")
          .map((item) => item.name),
        trace,
      };
    },
  };
}
