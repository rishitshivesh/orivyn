import type {
  ProposalRequest,
  ProposalResponse,
  ToolProposal,
} from "@orivyn/core";
import type { BrowserInferenceRuntime, LocalSpeechRuntime } from "./index";
import type {
  LocalModelKind,
  LocalModelProgress,
  ProgressListener,
} from "./progress";
import { assertLocalTools, inspectLocalProposals } from "./validate";

/** All model execution stays in Cactus's WASM workers. No remote inference fallback. */
export interface CactusBrowserAssets {
  workerUrl?: string;
  wasmUrl?: string;
  onProgress?: ProgressListener;
  /** A bound for local model setup and a single inference operation. Default 120s. */
  timeoutMs?: number;
  /** Close idle WASM sessions after this interval. Set 0 to retain until close(). */
  idleTimeoutMs?: number;
}

export class CactusBrowserRuntime
  implements BrowserInferenceRuntime, LocalSpeechRuntime
{
  readonly name = "cactus-browser";
  private needle: import("cactus-needle/browser").Needle | null = null;
  private whistle: import("cactus-needle/browser").Whistle | null = null;
  private closed = false;
  private busy = false;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;

  private clearIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
  }

  private scheduleIdleCleanup() {
    this.clearIdleTimer();
    const ms = this.options.idleTimeoutMs ?? 5 * 60_000;
    if (!ms || this.closed) return;
    this.idleTimer = setTimeout(() => {
      if (this.busy || this.closed) return;
      const needle = this.needle;
      const whistle = this.whistle;
      this.needle = null;
      this.whistle = null;
      void Promise.all([
        needle?.close().catch(() => undefined),
        whistle?.close().catch(() => undefined),
      ]);
      if (needle) this.report("needle", "idle");
      if (whistle) this.report("whistle", "idle");
    }, ms);
  }

  constructor(private readonly options: CactusBrowserAssets = {}) {}

  async available(): Promise<boolean> {
    return (
      typeof window !== "undefined" &&
      window.isSecureContext &&
      typeof WebAssembly !== "undefined" &&
      typeof Worker !== "undefined"
    );
  }

  private report(
    model: LocalModelKind,
    stage: LocalModelProgress["stage"],
    other: Partial<LocalModelProgress> = {},
  ) {
    this.options.onProgress?.({ model, stage, ...other });
  }

  private urls() {
    return {
      workerUrl: this.options.workerUrl ?? "/vendor/cactus/worker.js",
      wasmUrl: this.options.wasmUrl ?? "/vendor/cactus/needle.wasm",
    };
  }

  /** Active cancellation also terminates the upstream WASM session. */
  private async bounded<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    parent?: AbortSignal,
  ): Promise<T> {
    const deadline = AbortSignal.timeout(this.options.timeoutMs ?? 120_000);
    const signal = parent ? AbortSignal.any([parent, deadline]) : deadline;
    try {
      return await operation(signal);
    } catch (cause) {
      if (deadline.aborted)
        throw new Error(
          "Local model timed out. Check asset requests, model download and device memory.",
          { cause },
        );
      if (signal.aborted)
        throw new Error("Local model operation cancelled", { cause });
      throw cause;
    }
  }

  private async getNeedle(signal: AbortSignal) {
    if (this.needle) return this.needle;
    const { createNeedle } = await import("cactus-needle/browser");
    this.report("needle", "initialize");
    const session = await createNeedle({
      ...this.urls(),
      stateless: true,
      abortSignal: signal,
      onDownloadProgress: (progress) =>
        this.report("needle", "download", {
          loaded: progress.loaded,
          ...(typeof progress.total === "number"
            ? { total: progress.total }
            : {}),
          ...(typeof progress.percentage === "number"
            ? { percentage: progress.percentage }
            : {}),
        }),
    });
    if (this.closed || signal.aborted) {
      await session.close();
      throw new Error("Needle initialization cancelled");
    }
    this.needle = session;
    this.report("needle", "ready");
    return session;
  }

  private async getWhistle(signal: AbortSignal) {
    if (this.whistle) return this.whistle;
    const { createWhistle } = await import("cactus-needle/browser");
    this.report("whistle", "initialize");
    const session = await createWhistle({
      ...this.urls(),
      abortSignal: signal,
      onDownloadProgress: (progress) =>
        this.report("whistle", "download", {
          loaded: progress.loaded,
          ...(typeof progress.total === "number"
            ? { total: progress.total }
            : {}),
          ...(typeof progress.percentage === "number"
            ? { percentage: progress.percentage }
            : {}),
        }),
    });
    if (this.closed || signal.aborted) {
      await session.close();
      throw new Error("Whistle initialization cancelled");
    }
    this.whistle = session;
    this.report("whistle", "ready");
    return session;
  }

  async propose(
    request: ProposalRequest,
    signal?: AbortSignal,
  ): Promise<ProposalResponse> {
    if (this.closed) throw new Error("Local runtime has been closed");
    if (this.busy)
      throw new Error("A local model operation is already in progress");
    assertLocalTools(request.tools);
    if (!request.input.trim() || request.input.length > 2000)
      throw new Error("Input must contain 1–2000 characters");
    if (!(await this.available()))
      throw new Error(
        "Local inference requires HTTPS/localhost and WebAssembly workers",
      );
    this.clearIdleTimer();
    this.busy = true;
    try {
      return await this.bounded(async (boundedSignal) => {
        const agent = await this.getNeedle(boundedSignal);
        const { tool } = await import("cactus-needle/browser");
        const defs: Record<string, ReturnType<typeof tool>> = {};
        for (const item of request.tools) {
          defs[item.name] = tool({
            description: item.description,
            inputSchema: item.parameters as Parameters<
              typeof tool
            >[0]["inputSchema"],
          });
        }
        this.report("needle", "infer");
        const output = await agent.generate({
          prompt: request.input,
          tools: defs,
          abortSignal: boundedSignal,
        });
        const proposals: ToolProposal[] = output.toolCalls.map((call) => ({
          name: call.toolName,
          arguments: call.input as Record<string, unknown>,
          confidence:
            typeof output.confidence === "number" ? output.confidence : null,
        }));
        const inspection = inspectLocalProposals(request.tools, proposals);
        this.report("needle", "ready");
        return {
          request_id: crypto.randomUUID(),
          provider: this.name,
          status: inspection.accepted.length ? "proposed" : "no_match",
          proposals: inspection.accepted,
          diagnostics: {
            raw_calls: proposals.length,
            rejected: inspection.rejected,
          },
        };
      }, signal);
    } catch (error) {
      this.report("needle", "error", {
        message: error instanceof Error ? error.message : "Inference failed",
      });
      // Abort terminates upstream workers. Never reuse a possibly closed session.
      const old = this.needle;
      this.needle = null;
      if (old) await old.close().catch(() => undefined);
      throw error;
    } finally {
      this.busy = false;
      this.scheduleIdleCleanup();
    }
  }

  async transcribe(
    audio: { samples: Float32Array; sampleRate: number },
    signal?: AbortSignal,
  ): Promise<string> {
    if (this.closed) throw new Error("Local runtime has been closed");
    if (this.busy)
      throw new Error("A local model operation is already in progress");
    if (audio.sampleRate !== 16_000)
      throw new Error("Whistle requires 16 kHz mono PCM input");
    if (!audio.samples.length || audio.samples.length > 30 * 16_000)
      throw new Error("Audio must be 1–30 seconds");
    if (!(await this.available()))
      throw new Error(
        "Local transcription requires HTTPS/localhost and WebAssembly workers",
      );
    this.busy = true;
    try {
      return await this.bounded(async (boundedSignal) => {
        const session = await this.getWhistle(boundedSignal);
        this.report("whistle", "transcribe");
        const result = await session.transcribe(audio, {
          language: "en",
          abortSignal: boundedSignal,
        });
        this.report("whistle", "ready");
        return result.text;
      }, signal);
    } catch (error) {
      this.report("whistle", "error", {
        message:
          error instanceof Error ? error.message : "Transcription failed",
      });
      const old = this.whistle;
      this.whistle = null;
      if (old) await old.close().catch(() => undefined);
      throw error;
    } finally {
      this.busy = false;
    }
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.clearIdleTimer();
    const needle = this.needle;
    const whistle = this.whistle;
    this.needle = null;
    this.whistle = null;
    await Promise.all([needle?.close(), whistle?.close()]);
  }
}
