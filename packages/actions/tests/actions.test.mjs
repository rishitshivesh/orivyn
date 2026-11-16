import assert from "node:assert/strict";
import test from "node:test";
import { createActionExecutor } from "../src/index.ts";

const definition = {
  name: "set_view",
  description: "Select a view",
  parameters: { type: "object", properties: { view: { type: "string", enum: ["home", "music"] } }, required: ["view"], additionalProperties: false },
  execution: "browser",
  risk: "read",
};
const executor = createActionExecutor([{ definition, execute: (state, args) => ({ ...state, page: args.view }) }]);
const call = (name, args) => ({ name, arguments: args, confidence: null });

test("executes valid action and returns trace", () => {
  const result = executor.execute({ page: "home" }, [call("set_view", { view: "music" })], ["set_view"]);
  assert.equal(result.state.page, "music");
  assert.deepEqual(result.applied, ["set_view"]);
  assert.equal(result.trace[0].status, "applied");
});
test("rejects disabled, invalid, unknown and extra arguments", () => {
  for (const [proposal, enabled, reason] of [
    [call("set_view", { view: "music" }), [], "disabled"],
    [call("set_view", { view: "admin" }), ["set_view"], "invalid-arguments"],
    [call("set_view", { view: "music", privileged: true }), ["set_view"], "invalid-arguments"],
    [call("shell", { command: "dangerous" }), ["set_view"], "unknown"],
  ]) {
    const result = executor.execute({ page: "home" }, [proposal], enabled);
    assert.equal(result.state.page, "home");
    assert.equal(result.trace[0].reason, reason);
  }
});
test("rejects duplicate and privileged registrations", () => {
  assert.throws(() => createActionExecutor([{ definition, execute: (s) => s }, { definition, execute: (s) => s }]), /Duplicate/);
  assert.throws(() => createActionExecutor([{ definition: { ...definition, risk: "write" }, execute: (s) => s }]), /read-only/);
});
test("handler failures do not mutate the prior state reference", () => {
  const broken = createActionExecutor([{ definition, execute: () => { throw new Error("no"); } }]);
  const initial = Object.freeze({ page: "home" });
  const result = broken.execute(initial, [call("set_view", { view: "music" })], ["set_view"]);
  assert.strictEqual(result.state, initial);
  assert.equal(result.trace[0].reason, "handler-error");
});
