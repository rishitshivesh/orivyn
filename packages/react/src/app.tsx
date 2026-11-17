"use client";

import type { ExecutionReport } from "@orivyn/actions";
import type {
  ProposalRequest,
  ProposalResponse,
  ToolProposal,
} from "@orivyn/core";
import {
  type ApplicationContext,
  type ApplicationManifest,
  type ApplicationRuntime,
  createApplicationRuntime,
  type RuntimeRegistration,
} from "@orivyn/runtime";
import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

export interface ProposalAdapter {
  propose(
    request: ProposalRequest,
    signal?: AbortSignal,
  ): Promise<ProposalResponse>;
}

interface ProviderProps<State> {
  manifest: ApplicationManifest;
  children: ReactNode;
  initialState: State;
  context: ApplicationContext;
  registrations?: readonly RuntimeRegistration<State>[];
}

/**
 * Module-scoped React components/hooks preserve their identity across renders.
 * The Provider receives the manifest as a normal React prop.
 */
const RuntimeContext = createContext<ApplicationRuntime<unknown> | null>(null);

function ApplicationProvider<State>({
  manifest,
  children,
  initialState,
  context,
  registrations,
}: ProviderProps<State>) {
  const [runtime] = useState(() =>
    createApplicationRuntime({
      manifest,
      initialState,
      context,
      registrations,
    }),
  );
  // React Strict Mode replays effects; avoid disposing the store in effect cleanup.
  return createElement(
    RuntimeContext.Provider,
    {
      value: runtime as ApplicationRuntime<unknown>,
    },
    children,
  );
}

function useApplicationRuntime<State>(): ApplicationRuntime<State> {
  const runtime = useContext(RuntimeContext);
  if (!runtime)
    throw new Error(
      "Orivyn hooks must be used inside the application Provider",
    );
  return runtime as ApplicationRuntime<State>;
}

function useApplication<State>() {
  const runtime = useApplicationRuntime<State>();
  const snapshot = useSyncExternalStore(
    runtime.subscribe,
    runtime.getSnapshot,
    runtime.getSnapshot,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const propose = useCallback(
    async (input: string, adapter: ProposalAdapter, signal?: AbortSignal) => {
      setBusy(true);
      setError(null);
      try {
        const request = runtime.createRequest(input);
        if (!request.tools.length)
          return {
            request_id: "no-tools",
            provider: "orivyn-runtime",
            status: "no_match",
            proposals: [],
          } satisfies ProposalResponse;
        return await adapter.propose(request, signal);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Proposal failed");
        throw cause;
      } finally {
        setBusy(false);
      }
    },
    [runtime],
  );

  const apply = useCallback(
    (proposals: readonly ToolProposal[]): ExecutionReport<State> =>
      runtime.execute(proposals),
    [runtime],
  );
  const operations = useMemo(
    () => ({
      setEnabled: runtime.setEnabled.bind(runtime),
      updateContext: runtime.updateContext.bind(runtime),
      createRequest: runtime.createRequest.bind(runtime),
    }),
    [runtime],
  );

  return {
    ...snapshot,
    manifest: runtime.manifest,
    propose,
    apply,
    busy,
    error,
    ...operations,
  };
}

function useApplicationTool<State>(registration: RuntimeRegistration<State>) {
  const runtime = useApplicationRuntime<State>();
  const latest = useRef(registration);
  latest.current = registration;
  const definition = registration.definition;
  useEffect(
    () =>
      runtime.register({
        definition,
        execute: (state, args) => latest.current.execute(state, args),
        available: (context) => latest.current.available?.(context) ?? true,
      }),
    [runtime, definition],
  );
}

/**
 * Call once at module scope. The Provider and hooks are module-level functions.
 * Pass the manifest explicitly to Provider to preserve React hook semantics.
 */
export function createOrivynApp<State>(_manifest: ApplicationManifest) {
  return {
    Provider: ApplicationProvider<State>,
    useOrivyn: useApplication<State>,
    useOrivynTool: useApplicationTool<State>,
    useRuntime: useApplicationRuntime<State>,
  };
}
