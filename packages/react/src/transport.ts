import type { OrivynClient } from "@orivyn/client";
import type {
  ChatRequest,
  ChatResponse,
  ProposalRequest,
  ProposalResponse,
} from "@orivyn/core";
import { useCallback, useState } from "react";

/** Legacy transport hooks. No browser key or external provider configuration is embedded. */
export function useOrivyn(client: OrivynClient) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProposalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const propose = useCallback(
    async (request: ProposalRequest) => {
      setBusy(true);
      setError(null);
      try {
        const next = await client.propose(request);
        setResult(next);
        return next;
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Unknown request error",
        );
        throw cause;
      } finally {
        setBusy(false);
      }
    },
    [client],
  );
  return { busy, result, error, propose };
}

export function useOrivynChat(client: OrivynClient) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chat = useCallback(
    async (request: ChatRequest) => {
      setBusy(true);
      setError(null);
      try {
        const response = await client.chat(request);
        setResult(response);
        return response;
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Chat request failed",
        );
        throw cause;
      } finally {
        setBusy(false);
      }
    },
    [client],
  );
  return { chat, busy, result, error };
}
