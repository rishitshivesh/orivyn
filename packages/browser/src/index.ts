import type { ProposalRequest, ProposalResponse } from "@orivyn/core";
export type { LocalModelProgress, LocalModelKind, LocalModelStage, ProgressListener } from "./progress";
export { progressLabel } from "./progress";
export type { CactusBrowserAssets } from "./cactus-runtime";
export { CactusBrowserRuntime } from "./cactus-runtime";

export interface BrowserInferenceRuntime {
  readonly name: string;
  available(): Promise<boolean>;
  propose(request: ProposalRequest, signal?: AbortSignal): Promise<ProposalResponse>;
  close(): Promise<void>;
}
export interface LocalSpeechRuntime {
  transcribe(audio: { samples: Float32Array; sampleRate: number }, signal?: AbortSignal): Promise<string>;
}
export class UnavailableBrowserRuntime implements BrowserInferenceRuntime {
  readonly name = "unavailable";
  async available(): Promise<boolean> { return false; }
  async propose(): Promise<ProposalResponse> { throw new Error("Browser inference adapter has not been installed"); }
  async close(): Promise<void> {}
}
