import assert from "node:assert/strict";
import test from "node:test";
import { progressLabel } from "../src/progress.ts";

test("progress descriptions are model-state driven", () => {
  assert.equal(
    progressLabel({ model: "needle", stage: "download", percentage: 51.6 }),
    "Downloading model assets · 52%",
  );
  assert.equal(
    progressLabel({ model: "whistle", stage: "initialize" }),
    "Initializing local model…",
  );
  assert.equal(
    progressLabel({ model: "needle", stage: "ready" }),
    "Ready on this device",
  );
});
