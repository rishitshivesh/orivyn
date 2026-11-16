import type { ProposalRequest, ProposalResponse } from "@orivyn/core";

/** Transport-only SDK: credentials belong on the trusted server. */
export class OrivynClient {
  constructor(
    private readonly endpoint: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async propose(request: ProposalRequest, init?: RequestInit): Promise<ProposalResponse> {
    const response = await this.fetcher(new URL("/v1/proposals", this.endpoint), {
      ...init,
      method: "POST",
      headers: { "Content-Type": "application/json", ...init?.headers },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Orivyn request failed (${response.status})`);
    }
    return (await response.json()) as ProposalResponse;
  }
}
