import assert from "node:assert/strict";
import test from "node:test";
import {
  benchmarkCases,
  benchmarkSummary,
  deterministicBaseline,
  proposalsMatch,
} from "../src/lib/benchmarks.ts";

test("golden fixtures match reliable local baseline", () => {
  for (const scenario of benchmarkCases) {
    assert.equal(
      proposalsMatch(deterministicBaseline(scenario), scenario.expected),
      true,
      scenario.id,
    );
  }
});

test("argument mismatches are failures even when tool name is correct", () => {
  assert.equal(
    proposalsMatch(
      [{ name: "navigate", arguments: { page: "music" }, confidence: null }],
      [{ name: "navigate", arguments: { page: "career" }, confidence: null }],
    ),
    false,
  );
});

test("summary does not invent test results", () => {
  assert.deepEqual(benchmarkSummary([]), {
    total: 0,
    passed: 0,
    failed: 0,
    accuracy: 0,
    averageMs: 0,
  });
  const sample = [
    {
      id: "A",
      input: "",
      expected: [],
      actual: [],
      passed: true,
      durationMs: 20,
    },
    {
      id: "B",
      input: "",
      expected: [],
      actual: [],
      passed: false,
      durationMs: 30,
    },
  ];
  assert.equal(benchmarkSummary(sample).accuracy, 50);
  assert.equal(benchmarkSummary(sample).averageMs, 25);
});
