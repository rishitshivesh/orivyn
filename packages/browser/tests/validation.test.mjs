import assert from "node:assert/strict";
import test from "node:test";
import { assertLocalTools, inspectLocalProposals, validateLocalProposals } from "../src/validate.ts";

const tool = {
  name: "navigate",
  description: "Navigate to an approved page",
  parameters: {
    type: "object",
    properties: { page: { type: "string", enum: ["projects", "music"] } },
    required: ["page"],
    additionalProperties: false,
  },
  execution: "browser",
  risk: "read",
};

test("accepts an allowed local tool proposal", () => {
  const proposed = [{ name: "navigate", arguments: { page: "music" }, confidence: null }];
  assert.deepEqual(validateLocalProposals([tool], proposed), proposed);
});

test("does not accept unregistered or malformed tool outputs", () => {
  const proposed = [
    { name: "arbitrary_shell", arguments: { cmd: "echo test" }, confidence: null },
    { name: "navigate", arguments: { page: "admin" }, confidence: null },
    { name: "navigate", arguments: { page: "music", extra: true }, confidence: null },
  ];
  assert.deepEqual(validateLocalProposals([tool], proposed), []);
});

test("rejects privileged, non-local or duplicate tool definitions", () => {
  assert.throws(() => assertLocalTools([{ ...tool, execution: "server" }]));
  assert.throws(() => assertLocalTools([{ ...tool, risk: "write" }]));
  assert.throws(() => assertLocalTools([tool, tool]));
  assert.throws(() => assertLocalTools([]));
});

test("reports specific reasons for invalid model proposals", () => {
  const inspection = inspectLocalProposals([tool], [
    { name: "missing_tool", arguments: {}, confidence: null },
    { name: "navigate", arguments: { page: "admin" }, confidence: null },
    { name: "navigate", arguments: { page: "music" }, confidence: null },
  ]);
  assert.deepEqual(inspection.rejected, [
    { name: "missing_tool", reason: "unknown-tool" },
    { name: "navigate", reason: "invalid-arguments" },
  ]);
  assert.equal(inspection.accepted.length, 1);
});
