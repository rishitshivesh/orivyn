"use client";

import type { ToolProposal } from "@orivyn/core";
import {
  ArrowRight,
  BrainCircuit,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRef, useState } from "react";
import { DemoPreview } from "@/components/console/demo-preview";
import { PageHeading } from "@/components/console/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { routeAgentInput } from "@/lib/agent-router";
import { consumeChatStream } from "@/lib/chat-stream";
import { demoTools, initialDemoState } from "@/lib/demo-domain";
import { executeDemoProposals } from "@/lib/demo-execution";

type Turn = { id: string; role: "user" | "assistant"; content: string };
const presets = [
  "Open the music section",
  "Show my Kubernetes projects",
  "Explain what a role-based access control system does",
];

export default function AgentLab() {
  const [prompt, setPrompt] = useState(presets[2]);
  const [remoteConsent, setRemoteConsent] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [model, setModel] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [proposals, setProposals] = useState<ToolProposal[]>([]);
  const [view, setView] = useState(initialDemoState);
  const stopRef = useRef<AbortController | null>(null);

  function execute() {
    const result = executeDemoProposals(
      view,
      proposals,
      demoTools.map((tool) => tool.name),
    );
    setView(result.state);
    setProposals([]);
    setStatus(
      result.applied.length
        ? result.applied.join(" · ")
        : "No valid actions to apply",
    );
  }

  async function submit() {
    const input = prompt.trim();
    if (!input || busy) return;
    setStatus("");
    setProposals([]);
    const selected = routeAgentInput(
      input,
      demoTools.map((tool) => tool.name),
    );
    const local = selected.kind === "action" ? selected.proposals : [];
    if (local.length) {
      setProposals(local);
      setStatus(
        "Local UI intent recognized. Review and apply the proposed action.",
      );
      setPrompt("");
      return;
    }
    if (!remoteConsent) {
      setStatus(
        "This looks like a question. Enable remote conversation to send it to your configured provider.",
      );
      return;
    }
    if (!accessToken) {
      setStatus(
        "Enter your private Playground access token before using server inference.",
      );
      return;
    }
    const history: Turn[] = [
      ...turns.filter((turn) => turn.content.trim()),
      { id: crypto.randomUUID(), role: "user" as const, content: input },
    ].slice(-12);
    const assistantIndex = history.length;
    const controller = new AbortController();
    stopRef.current = controller;
    setBusy(true);
    setPrompt("");
    setTurns([...history, { id: crypto.randomUUID(), role: "assistant", content: "" }]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          app_id: "orivyn-agent-lab",
          messages: history.map(({ role, content }) => ({ role, content })),
          instructions:
            "You are Orivyn Agent Lab, a helpful engineering assistant. Be concise and accurate. Do not claim to have visited documents, executed tools, or verified facts without evidence. You have no access to a portfolio knowledge base in this version.",
        }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        setTurns(history);
        setStatus(
          response.status === 503
            ? "Conversational provider not configured on API"
            : `Conversation failed (HTTP ${response.status})`,
        );
        return;
      }
      await consumeChatStream(response.body, (event) => {
        if (event.event === "meta") setModel(event.data.model);
        if (event.event === "delta")
          setTurns((previous) =>
            previous.map((turn, index) =>
              index === assistantIndex
                ? { ...turn, content: turn.content + event.data.text }
                : turn,
            ),
          );
      });
      setStatus(
        "Conversation completed. History is held in this browser tab only.",
      );
    } catch (error) {
      setStatus(
        controller.signal.aborted
          ? "Request stopped"
          : error instanceof Error
            ? error.message
            : "Conversation failed",
      );
      if (!controller.signal.aborted) setPrompt(input);
    } finally {
      stopRef.current = null;
      setBusy(false);
    }
  }

  function clear() {
    stopRef.current?.abort();
    setTurns([]);
    setProposals([]);
    setView(initialDemoState);
    setModel("");
    setStatus("");
  }

  return (
    <>
      <PageHeading
        eyebrow="Workspace / Intelligence"
        title="Agent Lab"
        description="A single entry point for fast local UI commands and opt-in conversational reasoning. Actions remain application-owned; conversations never execute tools."
        action={<Badge>v0.3 · provider preview</Badge>}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <BrainCircuit className="size-4 text-[#abadff]" />{" "}
                  Context-aware entry
                </h2>
                <Badge>Local-first routing</Badge>
              </div>
              <label htmlFor="agent-prompt" className="block space-y-2">
                <span className="text-xs text-slate-400">
                  Command or question
                </span>
                <Textarea
                  id="agent-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  maxLength={2000}
                  className="min-h-32 resize-y leading-7"
                  placeholder="Ask a question or request a demo action..."
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {presets.map((value, i) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(value)}
                  >
                    Example {i + 1}
                  </Button>
                ))}
              </div>
              <label htmlFor="agent-remote-consent" className="flex items-start gap-3 rounded-lg border border-white/[0.08] p-4">
                <Checkbox
                  id="agent-remote-consent"
                  checked={remoteConsent}
                  onCheckedChange={(value) => setRemoteConsent(value === true)}
                />
                <span className="text-xs leading-6 text-slate-300">
                  Allow sending questions and conversation history to my
                  configured server-side provider. Local UI actions do not
                  require this.
                </span>
              </label>
              {remoteConsent && (
                <label htmlFor="agent-token" className="block space-y-2">
                  <span className="text-xs text-slate-400">
                    Private Playground token
                  </span>
                  <Input
                    id="agent-token"
                    type="password"
                    value={accessToken}
                    autoComplete="off"
                    onChange={(event) => setAccessToken(event.target.value)}
                    placeholder="ORIVYN_PLAYGROUND_ACCESS_TOKEN"
                  />
                </label>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => void submit()}
                  disabled={busy || !prompt.trim()}
                >
                  {" "}
                  {busy ? "Receiving response…" : "Submit"}{" "}
                  <ArrowRight className="size-4" />
                </Button>
                {busy && (
                  <Button
                    variant="outline"
                    onClick={() => stopRef.current?.abort()}
                  >
                    Stop response
                  </Button>
                )}
                <Button variant="ghost" onClick={clear}>
                  <RotateCcw className="size-4" /> Clear
                </Button>
              </div>
              {status && (
                <p
                  role="status"
                  className="rounded-lg border border-[#abaaff]/15 bg-[#abaaff]/[0.06] p-3 text-xs leading-6 text-slate-300"
                >
                  {status}
                </p>
              )}
            </CardContent>
          </Card>
          {proposals.length > 0 && (
            <Card>
              <CardContent className="space-y-3 p-6">
                <h3 className="text-sm font-semibold">
                  Review proposed actions
                </h3>
                <pre className="max-h-52 overflow-auto rounded-lg bg-[#0a0d13] p-4 text-xs leading-6 text-slate-300">
                  {JSON.stringify(proposals, null, 2)}
                </pre>
                <Button onClick={execute}>
                  Apply to demo <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <MessageCircle className="size-4 text-[#abadff]" />{" "}
                  Conversation
                </h3>
                <Badge>{model || "No model yet"}</Badge>
              </div>
              {turns.length === 0 && (
                <p className="rounded-lg border border-dashed border-white/10 p-6 text-sm text-slate-500">
                  Questions appear here. This version has no document retrieval
                  or persistent memory; answers are general model knowledge.
                </p>
              )}
              {turns.map((turn) => (
                <div
                  key={turn.id}
                  className={`rounded-lg border p-4 text-sm leading-7 whitespace-pre-wrap ${turn.role === "assistant" ? "border-[#a5a5ff]/15 bg-[#9b9bff]/[0.045]" : "border-white/10 bg-[#0b1019]"}`}
                >
                  <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">
                    {turn.role}
                  </p>
                  {turn.content || (busy ? "Receiving…" : "No content")}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-5">
          <DemoPreview state={view} />
          <Card>
            <CardContent className="space-y-3 p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="size-4 text-[#b7b9ff]" /> Execution
                boundaries
              </h3>
              <p className="text-xs leading-6 text-slate-400">
                Known demo UI commands run as deterministic local proposals.
                Unmatched requests require explicit remote opt-in; the app does
                not silently fall back to an external provider.
              </p>
              <p className="text-xs leading-6 text-slate-400">
                The server uses a configured OpenAI-compatible chat endpoint.
                Its API key is never sent to this browser. No database or memory
                system is attached.
              </p>
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="size-4" /> Knowledge retrieval and
                multi-step tool execution follow in later milestones.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
