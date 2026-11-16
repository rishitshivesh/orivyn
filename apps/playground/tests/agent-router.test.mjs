import assert from "node:assert/strict";
import test from "node:test";
import { routeAgentInput } from "../src/lib/agent-router.ts";

const tools = ["navigate", "filter_projects", "reset_view"];

test("known navigation stays local", () => {
  const result = routeAgentInput("Open the music section", tools);
  assert.equal(result.kind, "action");
  assert.equal(result.proposals[0].name, "navigate");
});

test("known Kubernetes filter stays local", () => {
  const result = routeAgentInput("Show my Kubernetes projects", tools);
  assert.equal(result.kind, "action");
  assert.ok(result.proposals.some((call) => call.name === "filter_projects"));
});

test("explanations with app keywords route to conversation", () => {
  for (const text of [
    "Explain music theory",
    "What is a Kubernetes cluster?",
    "Show me how role-based access works",
    "Tell me about my portfolio",
  ]) {
    assert.equal(routeAgentInput(text, tools).kind, "conversation");
  }
});

test("unrecognized local request does not invent a tool", () => {
  assert.equal(
    routeAgentInput("Open a billing account", tools).kind,
    "conversation",
  );
});

test("disabled action is never emitted", () => {
  assert.equal(
    routeAgentInput("Open music", ["filter_projects"]).kind,
    "conversation",
  );
});

test("polite local commands are supported but explanatory requests are not hijacked", () => {
  assert.equal(routeAgentInput("Please open music", tools).kind, "action");
  assert.equal(
    routeAgentInput("Can you explain Kubernetes?", tools).kind,
    "conversation",
  );
  assert.equal(
    routeAgentInput("Open my projects and explain them", tools).kind,
    "conversation",
  );
});
