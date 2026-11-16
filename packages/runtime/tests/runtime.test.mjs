import assert from "node:assert/strict";
import test from "node:test";
import { createApplicationRuntime, defineApplication } from "../src/index.ts";

const open = {
  name: "demo.open",
  description: "Open an approved page",
  execution: "browser",
  risk: "read",
  parameters: {
    type: "object",
    properties: { page: { type: "string", enum: ["home", "music"] } },
    required: ["page"],
    additionalProperties: false,
  },
};
const filter = {
  name: "demo.filter",
  description: "Filter on the home page",
  execution: "browser",
  risk: "read",
  parameters: {
    type: "object",
    properties: { tag: { type: "string" } },
    required: ["tag"],
    additionalProperties: false,
  },
};
const manifest = defineApplication({
  id: "orivyn.test",
  name: "Test",
  version: "0.5.0",
  runtime: "browser",
  tools: [open, filter],
});
const registrations = [
  {
    definition: open,
    execute: (state, args) => ({ ...state, page: args.page }),
  },
  {
    definition: filter,
    available: (context) => context.route === "/home",
    execute: (state, args) => ({ ...state, tag: args.tag }),
  },
];
const create = () =>
  createApplicationRuntime({
    manifest,
    registrations,
    initialState: { page: "home", tag: "" },
    context: { route: "/home" },
  });
const proposal = (name, args) => ({ name, arguments: args, confidence: null });

test("manifest rejects duplicate names, protected actions and invalid identity", () => {
  assert.throws(
    () => defineApplication({ ...manifest, tools: [open, open] }),
    /Duplicate/,
  );
  assert.throws(
    () =>
      defineApplication({ ...manifest, tools: [{ ...open, risk: "write" }] }),
    /Protected/,
  );
  assert.throws(
    () => defineApplication({ ...manifest, id: "Invalid App" }),
    /Invalid application/,
  );
});

test("registered, context-eligible tools appear in request", () => {
  const app = create();
  assert.deepEqual(
    app.createRequest("  open music  ").tools.map((item) => item.name),
    ["demo.open", "demo.filter"],
  );
  assert.equal(app.createRequest("Open music").app_id, manifest.id);
  app.updateContext({ route: "/music" });
  assert.deepEqual(
    app.getSnapshot().available.map((item) => item.name),
    ["demo.open"],
  );
  app.dispose();
});

test("disabled tool proposals cannot be executed, then re-enabled tool works", () => {
  const app = create();
  app.setEnabled("demo.open", false);
  const refused = app.execute([proposal("demo.open", { page: "music" })]);
  assert.equal(refused.state.page, "home");
  assert.deepEqual(refused.applied, []);
  app.setEnabled("demo.open", true);
  assert.equal(
    app.execute([proposal("demo.open", { page: "music" })]).state.page,
    "music",
  );
  app.dispose();
});

test("runtime rechecks context at action execution time", () => {
  const app = create();
  app.updateContext({ route: "/music" });
  const report = app.execute([proposal("demo.filter", { tag: "audio" })]);
  assert.equal(report.applied.length, 0);
  assert.equal(report.state.tag, "");
  app.dispose();
});

test("register and unregister are isolated per runtime instance", () => {
  const app1 = createApplicationRuntime({
    manifest,
    initialState: { page: "home" },
    context: { route: "/home" },
  });
  const app2 = createApplicationRuntime({
    manifest,
    initialState: { page: "home" },
    context: { route: "/home" },
  });
  const off = app1.register(registrations[0]);
  assert.equal(app1.getSnapshot().available.length, 1);
  assert.equal(app2.getSnapshot().available.length, 0);
  off();
  assert.equal(app1.getSnapshot().available.length, 0);
  app1.dispose();
  app2.dispose();
});

test("subscribers receive coherent revisions and unsubscribe correctly", () => {
  const app = create();
  let observed = 0;
  const unsubscribe = app.subscribe(() => observed++);
  const before = app.getSnapshot();
  app.updateContext({ route: "/music" });
  assert.notStrictEqual(before, app.getSnapshot());
  assert.equal(observed, 1);
  unsubscribe();
  app.setEnabled("demo.open", false);
  assert.equal(observed, 1);
  app.dispose();
});

test("schema mismatch and malformed model arguments fail closed", () => {
  const app = create();
  assert.throws(
    () =>
      app.register({
        definition: { ...open, description: "Changed" },
        execute: (s) => s,
      }),
    /differs/,
  );
  assert.deepEqual(
    app.execute([proposal("demo.open", { page: "admin" })]).applied,
    [],
  );
  assert.deepEqual(
    app.execute([proposal("shell", { command: "whoami" })]).applied,
    [],
  );
  app.dispose();
});

test("does not permit invalid or protocol-relative context routes", () => {
  const app = create();
  assert.throws(
    () => app.updateContext({ route: "https://example.com" }),
    /relative/,
  );
  assert.throws(
    () => app.updateContext({ route: "//example.com" }),
    /protocol-relative/,
  );
  app.dispose();
});
