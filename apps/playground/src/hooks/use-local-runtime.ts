"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CactusBrowserRuntime,
  type LocalModelProgress,
} from "@orivyn/browser";
import type { ProposalRequest, ProposalResponse } from "@orivyn/core";

export function useLocalRuntime() {
  const runtime = useRef<CactusBrowserRuntime | null>(null);
  const controller = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [progress, setProgress] = useState<LocalModelProgress | null>(null);

  const instance = useCallback(() => {
    if (!runtime.current) {
      runtime.current = new CactusBrowserRuntime({ onProgress: setProgress });
    }
    return runtime.current;
  }, []);

  useEffect(() => () => {
    controller.current?.abort();
    controller.current = null;
    const old = runtime.current;
    runtime.current = null;
    if (old) void old.close();
  }, []);

  const cancel = useCallback(() => {
    controller.current?.abort();
  }, []);

  const propose = useCallback(async (request: ProposalRequest): Promise<ProposalResponse> => {
    if (controller.current) throw new Error("Local model is busy");
    const current = new AbortController();
    controller.current = current;
    setStatus("loading");
    setProgress({ model: "needle", stage: "initialize" });
    try {
      const result = await instance().propose(request, current.signal);
      setStatus("ready");
      return result;
    } catch (error) {
      setStatus("error");
      throw error;
    } finally {
      controller.current = null;
    }
  }, [instance]);

  const transcribe = useCallback(async (audio: { samples: Float32Array; sampleRate: number }) => {
    if (controller.current) throw new Error("Local model is busy");
    const current = new AbortController();
    controller.current = current;
    setStatus("loading");
    setProgress({ model: "whistle", stage: "initialize" });
    try {
      const result = await instance().transcribe(audio, current.signal);
      setStatus("ready");
      return result;
    } catch (error) {
      setStatus("error");
      throw error;
    } finally {
      controller.current = null;
    }
  }, [instance]);

  return { propose, transcribe, cancel, progress, status };
}
