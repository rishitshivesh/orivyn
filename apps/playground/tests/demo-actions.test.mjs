import assert from "node:assert/strict";
import test from "node:test";
import {
  createDemoRequest,
  demoTools,
  initialDemoState,
  matchDemoIntent,
  visibleProjects,
} from "../src/lib/demo-domain.ts";
import { executeDemoProposals } from "../src/lib/demo-execution.ts";

const enabled = demoTools.map((tool) => tool.name);

test("music request selects navigation only", () => {
  assert.deepEqual(matchDemoIntent("Open the music section", enabled).map((p) => [p.name, p.arguments]), [
    ["navigate", { page: "music" }],
  ]);
});

test("Kubernetes request selects project view and infrastructure filter", () => {
  const proposals = matchDemoIntent("Show infrastructure projects using Kubernetes", enabled);
  assert.deepEqual(proposals.map((p) => p.name), ["navigate", "filter_projects"]);
  const execution = executeDemoProposals(initialDemoState, proposals, enabled);
  assert.equal(execution.state.page, "projects");
  assert.equal(execution.state.category, "infrastructure");
  assert.equal(execution.state.technology, "kubernetes");
  assert.equal(visibleProjects(execution.state).length, 1);
});

test("disabled actions are not proposed or executed", () => {
  assert.deepEqual(matchDemoIntent("Open music", ["filter_projects"]), []);
  const outcome = executeDemoProposals(initialDemoState, [{ name: "navigate", arguments: { page: "music" }, confidence: null }], ["filter_projects"]);
  assert.equal(outcome.state.page, "projects");
  assert.deepEqual(outcome.rejected, ["navigate"]);
});

test("malformed model output does not execute", () => {
  const result = executeDemoProposals(initialDemoState, [
    { name: "navigate", arguments: { page: "admin" }, confidence: null },
    { name: "navigate", arguments: { page: "music", unexpected: true }, confidence: null },
    { name: "shell", arguments: { command: "rm -rf" }, confidence: null },
  ], enabled);
  assert.equal(result.state.page, "projects");
  assert.equal(result.applied.length, 0);
  assert.equal(result.rejected.length, 3);
});

test("reset restores defaults", () => {
  const changed = { page: "music", category: "infrastructure", technology: "kubernetes" };
  const applied = executeDemoProposals(changed, matchDemoIntent("Reset the view", enabled), enabled);
  assert.deepEqual(applied.state, initialDemoState);
});

test("unsupported questions abstain", () => {
  assert.deepEqual(matchDemoIntent("Explain the CAP theorem in depth", enabled), []);
});

test("all example tool definitions remain read-only and browser-owned", () => {
  assert.ok(createDemoRequest("Open music", enabled).tools.every((tool) => tool.execution === "browser" && tool.risk === "read"));
});

test("questions and negations must never trigger UI actions", () => {
  assert.deepEqual(matchDemoIntent("Explain Kubernetes architecture", enabled), []);
  assert.deepEqual(matchDemoIntent("Don't open music", enabled), []);
  assert.deepEqual(matchDemoIntent("Show me how music works", enabled), []);
});
