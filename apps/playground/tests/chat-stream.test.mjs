import assert from "node:assert/strict";
import test from "node:test";
import { consumeChatStream } from "../src/lib/chat-stream.ts";

test("parses SSE when frames span chunks", async () => {
  const fragments = [
    'event: meta\ndata: {"request_id":"1","provider":"local","model":"example"}\n\nevent: del',
    'ta\ndata: {"text":"Hello"}\n\nevent: delta\ndata: {"text":" there"}\n\n',
    'event: done\ndata: {"request_id":"1"}\n\n',
  ];
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      fragments.forEach((part) => controller.enqueue(encoder.encode(part)));
      controller.close();
    },
  });
  const events = [];
  await consumeChatStream(stream, (event) => events.push(event));
  assert.deepEqual(events.map((item) => item.event), ["meta", "delta", "delta", "done"]);
  assert.equal(events.filter((item) => item.event === "delta").map((item) => item.data.text).join(""), "Hello there");
});

test("rejects silently truncated SSE streams", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('event: delta\ndata: {"text":"partial"}\n\n'));
      controller.close();
    },
  });
  await assert.rejects(consumeChatStream(stream, () => {}), /ended before completion/);
});

test("surfaces upstream error events", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('event: error\ndata: {"message":"Provider unavailable"}\n\n'));
      controller.close();
    },
  });
  await assert.rejects(consumeChatStream(stream, () => {}), /Provider unavailable/);
});
