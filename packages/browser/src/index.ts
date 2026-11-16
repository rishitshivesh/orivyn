import type { ProposalRequest, ProposalResponse } from "@orivyn/core";

/** Implementations run inside Web Workers and may not receive private app data. */
export interface BrowserInferenceRuntime {
  readonly name: string;
  available(): Promise<boolean>;
  propose(request: ProposalRequest, signal?: AbortSignal): Promise<ProposalResponse>;
}

/** No fake inference: callers must explicitly install a model runtime adapter. */
export class UnavailableBrowserRuntime implements BrowserInferenceRuntime {
  readonly name = "unavailable";

  async available(): Promise<boolean> {
    return false;
  }

  async propose(): Promise<ProposalResponse> {
    throw new Error("Browser inference adapter has not been installed");
  }
}
