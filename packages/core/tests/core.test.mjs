import assert from "node:assert/strict";
import test from "node:test";
import { isBrowserReadTool, uniqueToolNames } from "../src/index.ts";

const readTool = {
  name: "navigate",
  description: "Navigate to a public page",
  parameters: { type: "object" },
  execution: "browser",
  risk: "read",
};

test("browser read action is eligible", () => {
  assert.equal(isBrowserReadTool(readTool), true);
});

test("server and write operations are ineligible", () => {
  assert.equal(isBrowserReadTool({ ...readTool, execution: "server" }), false);
  assert.equal(isBrowserReadTool({ ...readTool, risk: "write" }), false);
});

test("tool names must be unique", () => {
  assert.equal(uniqueToolNames([readTool]), true);
  assert.equal(uniqueToolNames([readTool, readTool]), false);
});
