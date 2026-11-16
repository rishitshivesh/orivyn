"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiStatus } from "@/lib/capabilities";

export function useApiStatus() {
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) throw new Error("Status unavailable");
      setStatus((await response.json()) as ApiStatus);
    } catch {
      setStatus({ connected: false, reason: "Cannot reach status endpoint" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, refresh };
}
