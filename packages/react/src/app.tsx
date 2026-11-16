"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { ToolProposal, ProposalResponse } from "@orivyn/core";
import type { ExecutionReport } from "@orivyn/actions";
import {
  createApplicationRuntime, type ApplicationManifest, type ApplicationContext,
  type ApplicationRuntime, type RuntimeRegistration,
} from "@orivyn/runtime";

export interface ProposalAdapter {
  propose(request: { app_id: string; input: string; tools: import("@orivyn/core").ToolDefinition[] }, signal?: AbortSignal): Promise<ProposalResponse>;
}

/** Typed app-scoped hooks. Every mounted provider owns a distinct runtime instance. */
export function createOrivynApp<State>(manifest: ApplicationManifest) {
  const RuntimeContext = createContext<ApplicationRuntime<State> | null>(null);

  function Provider({ children, initialState, context, registrations }: {
    children: ReactNode;
    initialState: State;
    context: ApplicationContext;
    registrations?: readonly RuntimeRegistration<State>[];
  }) {
    const [runtime] = useState(() => createApplicationRuntime({
      manifest, initialState, context, registrations,
    }));
    // Runtime lives in the Provider state and is garbage-collected on unmount.
    // Avoid disposing it in an effect cleanup: Strict Mode replays cleanups in development.
    return createElement(RuntimeContext.Provider, { value: runtime }, children);
  }

  function useRuntime(): ApplicationRuntime<State> {
    const runtime = useContext(RuntimeContext);
    if (!runtime) throw new Error("Orivyn hook must be used inside its application Provider");
    return runtime;
  }

  function useOrivyn() {
    const runtime = useRuntime();
    const snapshot = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, runtime.getSnapshot);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const propose = useCallback(async (input: string, adapter: ProposalAdapter, signal?: AbortSignal) => {
      setBusy(true);
      setError(null);
      try {
        const request = runtime.createRequest(input);
        if (!request.tools.length) {
          return {
            request_id: "no-tools",
            provider: "orivyn-runtime",
            status: "no_match",
            proposals: [],
          } satisfies ProposalResponse;
        }
        return await adapter.propose(request, signal);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Proposal failed");
        throw cause;
      } finally {
        setBusy(false);
      }
    }, [runtime]);

    const apply = useCallback((proposals: readonly ToolProposal[]): ExecutionReport<State> =>
      runtime.execute(proposals), [runtime]);

    const operations = useMemo(() => ({
      setEnabled: runtime.setEnabled.bind(runtime),
      updateContext: runtime.updateContext.bind(runtime),
      createRequest: runtime.createRequest.bind(runtime),
    }), [runtime]);
    return {
      ...snapshot,
      manifest: runtime.manifest,
      propose, apply, busy, error,
      ...operations,
    };
  }

  /** Register a context-eligible tool on mount and unregister when owner unmounts. */
  function useOrivynTool(registration: RuntimeRegistration<State>) {
    const runtime = useRuntime();
    const latest = useRef(registration);
    latest.current = registration;
    const name = registration.definition.name;
    useEffect(() => runtime.register({
      definition: registration.definition,
      execute: (state, args) => latest.current.execute(state, args),
      available: (context) => latest.current.available?.(context) ?? true,
    }), [runtime, name]);
  }

  return { Provider, useOrivyn, useOrivynTool, useRuntime };
}
