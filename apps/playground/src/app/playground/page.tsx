"use client";

import type { ActionTrace } from "@orivyn/actions";
import type { ProposalResponse, ToolProposal } from "@orivyn/core";
import {
  ArrowRight,
  Check,
  Copy,
  Cpu,
  Info,
  LockKeyhole,
  RotateCcw,
  Server,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import { useState } from "react";
import { DemoPreview } from "@/components/console/demo-preview";
import { LocalVoice } from "@/components/console/local-voice";
import { ModelProgress } from "@/components/console/model-progress";
import { PageHeading } from "@/components/console/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocalRuntime } from "@/hooks/use-local-runtime";
import {
  createDemoRequest,
  demoTools,
  initialDemoState,
  matchDemoIntent,
} from "@/lib/demo-domain";
import { executeDemoProposals } from "@/lib/demo-execution";

const examples = [
  "Open the music section.",
  "Show infrastructure projects using Kubernetes.",
  "Navigate to my career history.",
  "Reset the view.",
];
type Runtime = "reliable" | "browser" | "server";

export default function Playground() {
  const [runtime, setRuntime] = useState<Runtime>("reliable");
  const [prompt, setPrompt] = useState(examples[0]);
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ProposalResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enabledTools, setEnabledTools] = useState(
    demoTools.map((tool) => tool.name),
  );
  const [demoState, setDemoState] = useState(initialDemoState);
  const [actionTrace, setActionTrace] = useState<
    (ActionTrace & { id: string })[]
  >([]);
  const local = useLocalRuntime();

  async function runServer() {
    const response = await fetch("/api/proposals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(createDemoRequest(prompt, enabledTools)),
    });
    const data: unknown = await response.json();
    if (!response.ok) {
      const detail =
        data && typeof data === "object" && "detail" in data
          ? String(data.detail)
          : "Request unavailable";
      throw new Error(detail);
    }
    return data as ProposalResponse;
  }

  async function run() {
    setLoading(true);
    setMessage("");
    setCopied(false);
    setResult(null);
    try {
      const response: ProposalResponse =
        runtime === "reliable"
          ? (() => {
              const proposals = matchDemoIntent(prompt, enabledTools);
              return {
                request_id: crypto.randomUUID(),
                provider: "orivyn-intent-rules",
                status: proposals.length ? "proposed" : "no_match",
                proposals,
              };
            })()
          : runtime === "browser"
            ? await local.propose(createDemoRequest(prompt, enabledTools))
            : await runServer();
      setResult(response);
      if (!response.proposals.length) {
        setMessage(
          runtime === "reliable"
            ? "No supported demo action matched. Try a navigation, project filter or reset command; use Needle for other tool intents."
            : "The model returned no eligible action. Try a clearer command or use Reliable actions for supported commands.",
        );
        return;
      }
      setMessage(
        `Received ${response.proposals.length} proposal(s). Review below, then apply to the demonstration app.`,
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? `${cause.name}: ${cause.message}`
          : "Unable to execute inference",
      );
    } finally {
      setLoading(false);
    }
  }

  function applyActions(proposals: readonly ToolProposal[]) {
    const applied = executeDemoProposals(demoState, proposals, enabledTools);
    setDemoState(applied.state);
    setActionTrace(
      applied.trace.map((entry) => ({ ...entry, id: crypto.randomUUID() })),
    );
    setMessage(
      applied.rejected.length
        ? `Applied ${applied.applied.length}; rejected ${applied.rejected.join(", ")} due to invalid schema or permissions.`
        : applied.applied.join(" · ") || "No eligible actions.",
    );
  }

  async function copyOutput() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
    } catch {
      setMessage("Unable to access the clipboard in this browser.");
    }
  }

  function reset() {
    setPrompt(examples[0]);
    setResult(null);
    setMessage("");
    setCopied(false);
    setEnabledTools(demoTools.map((tool) => tool.name));
    setDemoState(initialDemoState);
    setActionTrace([]);
  }

  return (
    <>
      <PageHeading
        eyebrow="Workspace / Lab"
        title="Inference playground"
        description="Try reliable local actions or compare with Needle and the protected API. Every proposed action can be reviewed and applied to a real interactive demo view."
        action={<Badge>Actions now work in demo</Badge>}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.85fr)]">
        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="size-4 text-[#abadff]" /> Input studio
                </div>
                <fieldset
                  className="flex flex-wrap gap-2"
                  aria-label="Select inference runtime"
                >
                  <Button
                    size="sm"
                    variant={runtime === "reliable" ? "default" : "outline"}
                    onClick={() => setRuntime("reliable")}
                  >
                    Reliable actions
                  </Button>
                  <Button
                    size="sm"
                    variant={runtime === "browser" ? "default" : "outline"}
                    onClick={() => setRuntime("browser")}
                  >
                    <Cpu className="size-3.5" /> Needle
                  </Button>
                  <Button
                    size="sm"
                    variant={runtime === "server" ? "default" : "outline"}
                    onClick={() => setRuntime("server")}
                  >
                    <Server className="size-3.5" /> Backend
                  </Button>
                </fieldset>
              </div>
              <div className="rounded-lg border border-[#a2a3ff]/15 bg-[#aaaaff]/[0.045] p-4 text-xs leading-6 text-[#c5c6e7]">
                {runtime === "reliable"
                  ? "Fast, deterministic action matching for this demo's known commands. No model, network requests or API keys. For open-ended language, select Needle or Backend."
                  : runtime === "browser"
                    ? "Needle selects tools with a small local WebAssembly model. It may produce incorrect or empty proposals. Inference stays on your device and never automatically falls back to a server."
                    : "Backend requests send your prompt and tool schemas through an authenticated private proxy. Orivyn only returns proposals; the owning app decides what to execute."}
              </div>
              <label htmlFor="playground-prompt" className="block space-y-2">
                <span className="text-xs text-slate-400">
                  Natural language instruction
                </span>
                <Textarea
                  id="playground-prompt"
                  className="min-h-32 resize-y text-base leading-7"
                  value={prompt}
                  maxLength={2000}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Describe what the demo app should do..."
                />
              </label>
              {runtime !== "server" && (
                <LocalVoice
                  transcribe={local.transcribe}
                  onTranscript={setPrompt}
                  disabled={loading || local.status === "loading"}
                />
              )}
              <div className="flex flex-wrap gap-2">
                {examples.map((example, index) => (
                  <Button
                    key={example}
                    size="sm"
                    variant="outline"
                    onClick={() => setPrompt(example)}
                  >
                    Example {index + 1}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-end justify-between gap-4 border-t border-white/[0.07] pt-5">
                {runtime === "server" && (
                  <label
                    htmlFor="playground-token"
                    className="block min-w-56 flex-1 space-y-2"
                  >
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <LockKeyhole className="size-3.5" /> Private Playground
                      access token
                    </span>
                    <Input
                      id="playground-token"
                      type="password"
                      autoComplete="off"
                      value={token}
                      onChange={(event) => setToken(event.target.value)}
                      placeholder="Configured token"
                    />
                  </label>
                )}
                <Button
                  onClick={() => void run()}
                  disabled={
                    loading ||
                    !prompt.trim() ||
                    (runtime === "server" && !token) ||
                    enabledTools.length === 0
                  }
                >
                  {loading ? "Processing…" : "Generate proposals"}{" "}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
              {runtime === "browser" && (
                <ModelProgress
                  progress={local.progress}
                  working={loading || local.status === "loading"}
                  onCancel={local.cancel}
                />
              )}
              {message && (
                <p
                  role="status"
                  className="rounded-lg border border-[#abaaff]/15 bg-[#abaaff]/[0.05] px-3 py-3 text-xs leading-6 text-slate-300"
                >
                  {message}
                </p>
              )}
            </CardContent>
          </Card>
          <DemoPreview state={demoState} />
          {actionTrace.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-sm font-semibold">
                  Action execution trace
                </h3>
                <div className="space-y-3">
                  {actionTrace.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.08] p-3"
                    >
                      <div>
                        <p className="font-mono text-xs text-[#c7c8ff]">
                          {item.name}
                        </p>
                        {item.reason && (
                          <p className="mt-1 text-xs text-rose-300">
                            Rejected: {item.reason}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge
                          tone={
                            item.status === "applied" ? "success" : "warning"
                          }
                        >
                          {item.status}
                        </Badge>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {item.duration_ms} ms
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <TerminalSquare className="size-4 text-[#abadff]" />{" "}
                  Structured response
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void copyOutput()}
                  disabled={!result}
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}{" "}
                  {copied ? "Copied" : "Copy JSON"}
                </Button>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-[#090c12] p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500">
                    Proposals · not automatically executed
                  </span>
                  {result && <Badge>{result.provider}</Badge>}
                </div>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all font-mono text-xs leading-7 text-[#bac5e5]">
                  {result
                    ? JSON.stringify(result, null, 2)
                    : '{\n  "status": "awaiting input",\n  "proposals": []\n}'}
                </pre>
                {result?.proposals.length ? (
                  <Button
                    className="mt-4"
                    size="sm"
                    onClick={() => applyActions(result.proposals)}
                  >
                    Apply to demo <ArrowRight className="size-4" />
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-2 text-sm font-semibold">Allowed tools</h2>
              <p className="mb-5 text-xs leading-6 text-slate-500">
                A disabled tool is neither offered to the model nor eligible for
                execution.
              </p>
              <div className="space-y-3">
                {demoTools.map((tool) => (
                  <label
                    htmlFor={`playground-tool-${tool.name}`}
                    key={tool.name}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.075] bg-white/[0.018] p-4"
                  >
                    <Checkbox
                      id={`playground-tool-${tool.name}`}
                      className="mt-0.5 shrink-0"
                      checked={enabledTools.includes(tool.name)}
                      onCheckedChange={(checked) =>
                        setEnabledTools((previous) =>
                          checked === true
                            ? [...previous, tool.name]
                            : previous.filter((name) => name !== tool.name),
                        )
                      }
                    />
                    <span>
                      <span className="block font-mono text-xs text-[#c2c4ff]">
                        {tool.name}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {tool.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Info className="size-4 text-[#a5a7ff]" /> Execution boundary
              </h2>
              {[
                [
                  "Mode",
                  runtime === "reliable"
                    ? "Local rules"
                    : runtime === "browser"
                      ? "Needle · WASM"
                      : "FastAPI / Cactus",
                ],
                ["Local model", local.status],
                ["Proposal validation", "JSON Schema"],
                ["UI action execution", "After user confirmation"],
                ["Sensitive operations", "Not supported"],
                ["Remote fallback", "Never automatic"],
              ].map(([key, value]) => (
                <div
                  key={key}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] py-3 text-xs last:border-0"
                >
                  <span className="text-slate-500">{key}</span>
                  <span className="text-slate-300">{value}</span>
                </div>
              ))}
              <p className="mt-5 text-xs leading-6 text-slate-500">
                Needle specializes in structured tool calling, not long-form,
                grounded conversation. E.D.I.T.H. will require a separate
                reasoning and retrieval path.
              </p>
            </CardContent>
          </Card>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="size-3.5" /> Reset workspace
          </Button>
        </div>
      </div>
    </>
  );
}
