import type { ProposalRequest, ProposalResponse, ToolDefinition, ToolProposal } from "@orivyn/core";
import type { BrowserInferenceRuntime, LocalSpeechRuntime } from "./index";
import { assertLocalTools, validateLocalProposals } from "./validate";

/**
 * Community-maintained Cactus Needle/Whistle browser adapter.
 * Needle/Whistle internally execute in WASM module workers.
 * Model files are downloaded/cached only after an explicit user interaction.
 * Never call run(), which executes tool callbacks.
 */
export class CactusBrowserRuntime implements BrowserInferenceRuntime, LocalSpeechRuntime {
  readonly name = "cactus-browser";
  private needle: import("cactus-needle/browser").Needle | null = null;
  private whistle: import("cactus-needle/browser").Whistle | null = null;
  private closed = false;

  async available(): Promise<boolean> {
    return typeof window !== "undefined" && window.isSecureContext && typeof WebAssembly !== "undefined" && typeof Worker !== "undefined";
  }

  private async getNeedle(): Promise<import("cactus-needle/browser").Needle> {
    if (this.closed) throw new Error("Local runtime has been closed");
    if (!await this.available()) throw new Error("Local inference requires HTTPS/localhost and WebAssembly workers");
    if (!this.needle) {
      const { Needle } = await import("cactus-needle/browser");
      this.needle = new Needle({ stateless: true });
    }
    return this.needle;
  }

  async propose(request: ProposalRequest, signal?: AbortSignal): Promise<ProposalResponse> {
    assertLocalTools(request.tools);
    if (!request.input.trim() || request.input.length > 2000) throw new Error("Input must contain 1–2000 characters");
    if (signal?.aborted) throw new Error("Inference cancelled");
    const agent = await this.getNeedle();
    // Do not expose callbacks: generate returns predictions without executing tools.
    const { tool } = await import("cactus-needle/browser");
    const defs: Record<string, ReturnType<typeof tool>> = {};
    for (const definition of request.tools) {
      defs[definition.name] = tool({
        description: definition.description,
        inputSchema: definition.parameters as Parameters<typeof tool>[0]["inputSchema"],
      });
    }
    const output = await agent.generate({ prompt: request.input, tools: defs, abortSignal: signal });
    const proposals: ToolProposal[] = output.toolCalls.map((call) => ({
      name: call.toolName,
      arguments: call.input as Record<string, unknown>,
      confidence: typeof output.confidence === "number" ? output.confidence : null,
    }));
    const validated = validateLocalProposals(request.tools, proposals);
    return {
      request_id: crypto.randomUUID(),
      provider: this.name,
      status: validated.length ? "proposed" : "no_match",
      proposals: validated,
    };
  }

  async transcribe(audio: { samples: Float32Array; sampleRate: number }): Promise<string> {
    if (this.closed) throw new Error("Local runtime has been closed");
    if (!await this.available()) throw new Error("Local transcription requires HTTPS/localhost");
    if (!this.whistle) {
      const { Whistle } = await import("cactus-needle/browser");
      this.whistle = new Whistle();
    }
    const result = await this.whistle.transcribe(audio, { language: "en" });
    return result.text;
  }

  async close(): Promise<void> {
    this.closed = true;
    const needle = this.needle;
    const whistle = this.whistle;
    this.needle = null;
    this.whistle = null;
    await Promise.all([needle?.close(), whistle?.close()]);
  }
}
