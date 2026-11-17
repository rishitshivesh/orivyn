import type { ActionRegistration, ExecutionReport } from "@orivyn/actions";
import { createActionExecutor } from "@orivyn/actions";
import type {
  ProposalRequest,
  ToolDefinition,
  ToolProposal,
} from "@orivyn/core";
import { type ApplicationContext, normalizeContext } from "./context.ts";
import type { ApplicationManifest } from "./manifest.ts";

export type RuntimeRegistration<State> = ActionRegistration<State> & {
  available?: (context: Readonly<ApplicationContext>) => boolean;
};

export interface RuntimeSnapshot<State> {
  state: State;
  context: ApplicationContext;
  enabled: readonly string[];
  available: readonly ToolDefinition[];
  revision: number;
}

export interface RuntimeOptions<State> {
  manifest: ApplicationManifest;
  initialState: State;
  context: ApplicationContext;
  registrations?: readonly RuntimeRegistration<State>[];
}

/** One in-memory runtime per consumer instance. No global singleton, persistence or network. */
export class ApplicationRuntime<State> {
  readonly manifest: ApplicationManifest;
  private readonly handlers = new Map<string, RuntimeRegistration<State>>();
  private readonly listeners = new Set<() => void>();
  private readonly enabled = new Set<string>();
  private snapshot: RuntimeSnapshot<State>;
  private disposed = false;
  private executorCache: ReturnType<typeof createActionExecutor<State>> | null =
    null;

  constructor(options: RuntimeOptions<State>) {
    this.manifest = options.manifest;
    const context = normalizeContext(options.context);
    for (const tool of options.manifest.tools) this.enabled.add(tool.name);
    this.snapshot = {
      state: options.initialState,
      context,
      enabled: [],
      available: [],
      revision: 0,
    };
    for (const registration of options.registrations ?? [])
      this.add(registration, false);
    this.publish();
  }

  private assertLive(): void {
    if (this.disposed) throw new Error("Runtime has been disposed");
  }

  private add(
    registration: RuntimeRegistration<State>,
    replace: boolean,
  ): void {
    const tool = this.manifest.tools.find(
      (item) => item.name === registration.definition.name,
    );
    if (!tool)
      throw new Error(
        `Tool is absent from manifest: ${registration.definition.name}`,
      );
    if (JSON.stringify(tool) !== JSON.stringify(registration.definition)) {
      throw new Error(
        `Registered tool schema differs from manifest: ${tool.name}`,
      );
    }
    if (!replace && this.handlers.has(tool.name))
      throw new Error(`Duplicate registration: ${tool.name}`);
    this.handlers.set(tool.name, registration);
  }

  private available(): ToolDefinition[] {
    return this.manifest.tools.filter((tool) => {
      if (!this.enabled.has(tool.name)) return false;
      const registration = this.handlers.get(tool.name);
      return (
        !!registration &&
        (!registration.available ||
          registration.available(this.snapshot.context))
      );
    });
  }

  private publish(invalidateExecutor = true): void {
    if (invalidateExecutor) this.executorCache = null;
    this.snapshot = {
      ...this.snapshot,
      enabled: Array.from(this.enabled),
      available: this.available(),
      revision: this.snapshot.revision + 1,
    };
    this.listeners.forEach((listener) => {
      listener();
    });
  }

  getSnapshot = (): RuntimeSnapshot<State> => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.assertLive();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  register(registration: RuntimeRegistration<State>): () => void {
    this.assertLive();
    this.add(registration, false);
    this.publish();
    return () => {
      if (this.handlers.get(registration.definition.name) === registration) {
        this.handlers.delete(registration.definition.name);
        if (!this.disposed) this.publish();
      }
    };
  }

  setEnabled(name: string, enabled: boolean): void {
    this.assertLive();
    if (!this.manifest.tools.some((tool) => tool.name === name))
      throw new Error(`Unknown tool: ${name}`);
    if (enabled) this.enabled.add(name);
    else this.enabled.delete(name);
    this.publish();
  }

  updateContext(patch: Partial<ApplicationContext>): void {
    this.assertLive();
    this.snapshot = {
      ...this.snapshot,
      context: normalizeContext({ ...this.snapshot.context, ...patch }),
    };
    this.publish();
  }

  createRequest(input: string): ProposalRequest {
    this.assertLive();
    const value = input.trim();
    if (!value || value.length > 2000)
      throw new Error("Input must contain 1–2000 characters");
    return {
      app_id: this.manifest.id,
      input: value,
      tools: this.snapshot.available.slice(),
    };
  }

  execute(proposals: readonly ToolProposal[]): ExecutionReport<State> {
    this.assertLive();
    const allowed = new Set(this.snapshot.available.map((tool) => tool.name));
    const registrations = [...this.handlers.values()].filter((registration) =>
      allowed.has(registration.definition.name),
    );
    if (!this.executorCache)
      this.executorCache = createActionExecutor(registrations);
    const report = this.executorCache.execute(this.snapshot.state, proposals, [
      ...allowed,
    ]);
    if (report.applied.length) {
      this.snapshot = { ...this.snapshot, state: report.state };
      this.publish(false);
    }
    return report;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.listeners.clear();
    this.handlers.clear();
  }
}

export function createApplicationRuntime<State>(
  options: RuntimeOptions<State>,
) {
  return new ApplicationRuntime(options);
}
