import { type NextRequest, NextResponse } from "next/server";

/** Private test proxy. Both credentials are server-only environment variables. */
export async function POST(request: NextRequest) {
  const expected = process.env.ORIVYN_PLAYGROUND_ACCESS_TOKEN;
  const backendKey = process.env.ORIVYN_API_KEY;
  const backend = process.env.ORIVYN_API_BASE;
  if (!expected || !backendKey || !backend) {
    return NextResponse.json(
      { error: "Playground proxy disabled" },
      { status: 503 },
    );
  }
  const supplied = request.headers.get("authorization");
  if (supplied !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const length = Number(request.headers.get("content-length") || "0");
  if (length > 32_768) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }
  const response = await fetch(new URL("/v1/proposals", backend), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Orivyn-Key": backendKey },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  const data: unknown = await response.json();
  return NextResponse.json(data, { status: response.status });
}
