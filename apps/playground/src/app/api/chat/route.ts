import { NextRequest, NextResponse } from "next/server";

/** Private gateway: browser credential is distinct from upstream service secret. */
export async function POST(request: NextRequest) {
  const token = process.env.ORIVYN_PLAYGROUND_ACCESS_TOKEN;
  const serviceKey = process.env.ORIVYN_API_KEY;
  const base = process.env.ORIVYN_API_BASE;
  if (!token || !serviceKey || !base) {
    return NextResponse.json(
      { detail: "Conversation proxy not configured" },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${token}`) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 24_576) {
    return NextResponse.json(
      { detail: "Request exceeds 24 KB" },
      { status: 413 },
    );
  }
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 24_576)
      return NextResponse.json(
        { detail: "Request too large" },
        { status: 413 },
      );
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ detail: "Malformed JSON" }, { status: 400 });
  }
  try {
    const upstream = await fetch(new URL("/v1/chat/stream", base), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Orivyn-Key": serviceKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: request.signal,
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        {
          detail:
            upstream.status === 503
              ? "Conversational provider is disabled"
              : "Upstream conversation request failed",
        },
        { status: upstream.status || 502 },
      );
    }
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Orivyn API is unreachable" },
      { status: 502 },
    );
  }
}
