import { NextResponse } from "next/server";

/** Proxies only public health/capabilities paths. No service keys are transmitted. */
export async function GET() {
  const endpoint = process.env.ORIVYN_API_BASE;
  if (!endpoint) {
    return NextResponse.json({ connected: false, reason: "API origin not configured" });
  }

  try {
    const [health, capabilities] = await Promise.all([
      fetch(new URL("/health/live", endpoint), {
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      }),
      fetch(new URL("/v1/capabilities", endpoint), {
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      }),
    ]);
    if (!health.ok || !capabilities.ok) {
      return NextResponse.json({ connected: false, reason: "API health check failed" });
    }
    return NextResponse.json({ connected: true, capabilities: await capabilities.json() });
  } catch {
    return NextResponse.json({ connected: false, reason: "API unreachable" });
  }
}
