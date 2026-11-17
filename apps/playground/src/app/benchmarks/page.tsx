"use client";

import type { ProposalResponse } from "@orivyn/core";
import {
  Activity,
  ArrowDownToLine,
  CheckCircle2,
  CircleX,
  Cpu,
  Play,
  RotateCcw,
  Square,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { PageHeading } from "@/components/console/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalRuntime } from "@/hooks/use-local-runtime";
import {
  type BenchmarkResult,
  benchmarkCases,
  benchmarkSummary,
  deterministicBaseline,
  proposalsMatch,
} from "@/lib/benchmarks";
import { createDemoRequest } from "@/lib/demo-domain";

type Mode = "rules" | "needle";

function reportDownload(results: BenchmarkResult[], mode: Mode) {
  const report = {
    format: "orivyn-benchmark-v1",
    model: mode,
    generatedAt: new Date().toISOString(),
    summary: benchmarkSummary(results),
    results,
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `orivyn-${mode}-benchmark.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Benchmarks() {
  const [mode, setMode] = useState<Mode>("needle");
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(
    "Choose an engine and run the local test cases.",
  );
  const stopRef = useRef(false);
  const local = useLocalRuntime();
  const summary = benchmarkSummary(results);

  async function run() {
    if (running) return;
    stopRef.current = false;
    setRunning(true);
    setResults([]);
    setStatus(
      mode === "needle"
        ? "Starting local Needle evaluation. Initial model loading may take time."
        : "Running deterministic baseline.",
    );
    try {
      for (const [index, scenario] of benchmarkCases.entries()) {
        if (stopRef.current) break;
        setStatus(
          `Test ${index + 1} of ${benchmarkCases.length}: ${scenario.id}`,
        );
        const start = performance.now();
        let actual: ProposalResponse["proposals"] = [];
        let error: string | undefined;
        let diagnostics: ProposalResponse["diagnostics"];
        try {
          if (mode === "rules") {
            actual = deterministicBaseline(scenario);
          } else if (scenario.enabled.length === 0) {
            actual = [];
          } else {
            const response = await local.propose(
              createDemoRequest(scenario.input, scenario.enabled),
            );
            actual = response.proposals;
            diagnostics = response.diagnostics;
          }
        } catch (cause) {
          error =
            cause instanceof Error
              ? cause.message
              : "Unknown inference failure";
          if (mode === "needle") stopRef.current = true;
        }
        const durationMs = Math.round((performance.now() - start) * 10) / 10;
        setResults((previous) => [
          ...previous,
          {
            id: scenario.id,
            input: scenario.input,
            expected: scenario.expected,
            actual,
            passed: !error && proposalsMatch(actual, scenario.expected),
            durationMs,
            ...(error ? { error } : {}),
            ...(diagnostics ? { diagnostics } : {}),
          },
        ]);
      }
      setStatus(
        stopRef.current
          ? "Stopped after current test. Partial results retained."
          : "Benchmark complete. All scores are from this run.",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Workspace / Evaluation"
        title="Model Benchmarks"
        description="Measure whether Needle selects the correct frontend tools. Run real local inference, compare against an explicit baseline, inspect mistakes and export the results."
        action={
          <Badge>{benchmarkCases.length} golden cases · local only</Badge>
        }
      />
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-5 p-6">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Evaluation engine</h2>
            <p className="max-w-xl text-xs leading-6 text-slate-400">
              Needle uses browser WebAssembly. Reliable baseline uses
              deterministic rules. Both run without an API key or server.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={mode === "needle" ? "default" : "outline"}
                disabled={running}
                onClick={() => {
                  setMode("needle");
                  setResults([]);
                }}
              >
                <Cpu className="size-4" /> Needle WASM
              </Button>
              <Button
                size="sm"
                variant={mode === "rules" ? "default" : "outline"}
                disabled={running}
                onClick={() => {
                  setMode("rules");
                  setResults([]);
                }}
              >
                <Zap className="size-4" /> Rules baseline
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {running ? (
              <Button
                variant="outline"
                onClick={() => {
                  stopRef.current = true;
                }}
              >
                <Square className="size-4" /> Stop after test
              </Button>
            ) : (
              <Button onClick={() => void run()}>
                <Play className="size-4" /> Run benchmark
              </Button>
            )}
            <Button
              variant="outline"
              disabled={!results.length || running}
              onClick={() => reportDownload(results, mode)}
            >
              <ArrowDownToLine className="size-4" /> Export JSON
            </Button>
            <Button
              variant="ghost"
              disabled={running}
              onClick={() => {
                setResults([]);
                setStatus("Results cleared.");
              }}
            >
              <RotateCcw className="size-4" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="my-5 grid gap-3 sm:grid-cols-3">
        {[
          {
            name: "Exact-match accuracy",
            value: `${summary.accuracy}%`,
            hint: `${summary.passed} passed / ${summary.total} executed`,
          },
          {
            name: "Failed cases",
            value: String(summary.failed),
            hint: "Invalid tools, arguments, abstention or runtime errors",
          },
          {
            name: "Average case latency",
            value: `${summary.averageMs} ms`,
            hint: "Includes first-use model initialization",
          },
        ].map((metric) => (
          <Card key={metric.name}>
            <CardContent className="space-y-2 p-5">
              <p className="text-xs text-slate-500">{metric.name}</p>
              <p className="text-2xl font-semibold text-white">
                {metric.value}
              </p>
              <p className="text-xs text-slate-500">{metric.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="size-4 text-[#aeb0ff]" /> Test results
            </h2>
            <Badge>
              {running ? "Running" : results.length ? "Measured" : "Not run"}
            </Badge>
          </div>
          <p aria-live="polite" className="mb-4 text-xs text-slate-400">
            {status}
          </p>
          <div className="space-y-3">
            {benchmarkCases.map((scenario, index) => {
              const result = results.find((item) => item.id === scenario.id);
              return (
                <div
                  key={scenario.id}
                  className="rounded-xl border border-white/[0.08] bg-[#0d111a] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a7a8fa]">
                        {scenario.id} · {scenario.note}
                      </p>
                      <p className="mt-2 text-sm text-slate-100">
                        {scenario.input}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {result ? (
                        <>
                          <span className="text-xs text-slate-500">
                            {result.durationMs} ms
                          </span>
                          {result.passed ? (
                            <CheckCircle2 className="size-4 text-emerald-400" />
                          ) : (
                            <CircleX className="size-4 text-rose-400" />
                          )}
                        </>
                      ) : (
                        <Badge>
                          {running && index === results.length
                            ? "Next / running"
                            : "Pending"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {result && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
                          Expected
                        </p>
                        <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/20 p-3 font-mono text-[11px] text-slate-300">
                          {JSON.stringify(result.expected, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
                          Actual
                        </p>
                        <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/20 p-3 font-mono text-[11px] text-slate-300">
                          {JSON.stringify(result.actual, null, 2)}
                        </pre>
                        {result.error && (
                          <p
                            role="alert"
                            className="mt-2 text-xs text-rose-300"
                          >
                            {result.error}
                          </p>
                        )}
                        {result.diagnostics && (
                          <p className="mt-2 text-xs text-slate-400">
                            Raw calls: {result.diagnostics.raw_calls} ·
                            Rejected:{" "}
                            {result.diagnostics.rejected
                              .map((item) => `${item.name} (${item.reason})`)
                              .join(", ") || "none"}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
