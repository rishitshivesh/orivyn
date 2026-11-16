"use client";

import { useEffect, useRef, useState } from "react";
import { CactusBrowserRuntime } from "@orivyn/browser";
import type { ProposalRequest, ProposalResponse } from "@orivyn/core";

export function useLocalRuntime() {
  const runtime = useRef<CactusBrowserRuntime | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );

  function instance(): CactusBrowserRuntime {
    if (!runtime.current) runtime.current = new CactusBrowserRuntime();
    return runtime.current;
  }

  useEffect(() => {
    return () => {
      const previous = runtime.current;
      runtime.current = null;
      if (previous) void previous.close();
    };
  }, []);

  async function propose(request: ProposalRequest): Promise<ProposalResponse> {
    setStatus("loading");
    try {
      const result = await instance().propose(request);
      setStatus("ready");
      return result;
    } catch (error) {
      setStatus("error");
      throw error;
    }
  }

  async function transcribe(audio: {
    samples: Float32Array;
    sampleRate: number;
  }): Promise<string> {
    setStatus("loading");
    try {
      const result = await instance().transcribe(audio);
      setStatus("ready");
      return result;
    } catch (error) {
      setStatus("error");
      throw error;
    }
  }

  return { propose, transcribe, status };
}
