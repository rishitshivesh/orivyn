import { useCallback, useState } from "react";
import type { OrivynClient } from "@orivyn/client";
import type { ProposalRequest, ProposalResponse } from "@orivyn/core";

/** Client hook. Never installs service keys into the browser bundle. */
export function useOrivyn(client: OrivynClient) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProposalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const propose = useCallback(async (request: ProposalRequest) => {
    setBusy(true);
    setError(null);
    try {
      const next = await client.propose(request);
      setResult(next);
      return next;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unknown request error");
      throw cause;
    } finally {
      setBusy(false);
    }
  }, [client]);

  return { busy, result, error, propose };
}
