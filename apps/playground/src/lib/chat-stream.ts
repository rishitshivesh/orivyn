export type ChatEvent =
  | { event: "meta"; data: { request_id: string; provider: string; model: string } }
  | { event: "delta"; data: { text: string } }
  | { event: "done"; data: { request_id: string } }
  | { event: "error"; data: { message: string } };

/** Parse SSE frames across arbitrary network chunks, including CRLF line endings. */
export async function consumeChatStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: ChatEvent) => void,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;

  function frame(raw: string): void {
    const lines = raw.split("\n");
    let name = "";
    const data: string[] = [];
    for (const line of lines) {
      if (line.startsWith("event: ")) name = line.slice(7);
      if (line.startsWith("data: ")) data.push(line.slice(6));
    }
    if (!["meta", "delta", "done", "error"].includes(name) || !data.length) return;
    try {
      const payload = JSON.parse(data.join("\n"));
      onEvent({ event: name, data: payload } as ChatEvent);
      if (name === "done") completed = true;
      if (name === "error") throw new Error(typeof payload.message === "string" ? payload.message : "Provider failed");
    } catch (error) {
      if (name === "error") throw error;
      throw new Error("Invalid provider stream response");
    }
  }

  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        frame(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }
      if (done) break;
    }
    if (!completed) throw new Error("Provider stream ended before completion");
  } finally {
    reader.releaseLock();
  }
}
