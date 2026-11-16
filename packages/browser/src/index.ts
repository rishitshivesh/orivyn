import type { ProposalRequest, ProposalResponse } from "@orivyn/core";

export interface BrowserInferenceRuntime {
  readonly name: string;
  available(): Promise<boolean>;
  propose(
    request: ProposalRequest,
    signal?: AbortSignal,
  ): Promise<ProposalResponse>;
  close(): Promise<void>;
}

export interface LocalSpeechRuntime {
  transcribe(audio: {
    samples: Float32Array;
    sampleRate: number;
  }): Promise<string>;
}

export { CactusBrowserRuntime } from "./cactus-runtime";

export class UnavailableBrowserRuntime implements BrowserInferenceRuntime {
  readonly name = "unavailable";

  async available(): Promise<boolean> {
    return false;
  }

  async propose(): Promise<ProposalResponse> {
    throw new Error("Browser inference adapter has not been installed");
  }

  async close(): Promise<void> {}
}
