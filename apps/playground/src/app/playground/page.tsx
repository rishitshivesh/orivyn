"use client";

import { useState } from "react";
import { ArrowRight, Check, Copy, Cpu, Info, LockKeyhole, RotateCcw, Server, Sparkles, TerminalSquare } from "lucide-react";
import type { ProposalRequest, ProposalResponse } from "@orivyn/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocalVoice } from "@/components/console/local-voice";
import { PageHeading } from "@/components/console/page-heading";
import { useLocalRuntime } from "@/hooks/use-local-runtime";
import { sampleTools } from "@/lib/capabilities";

const examples = [
  "Open the music section of my portfolio.",
  "Show the projects filtered by Kubernetes.",
  "Navigate to my career history.",
];

type Runtime = "browser" | "server";

export default function Playground() {
  const [runtime, setRuntime] = useState<Runtime>("browser");
  const [prompt, setPrompt] = useState(examples[0]);
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ProposalResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enabledTools, setEnabledTools] = useState(sampleTools.map((tool) => tool.name));
  const local = useLocalRuntime();

  async function runServer(request: ProposalRequest): Promise<ProposalResponse> {
    const response = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(request),
    });
    const data: unknown = await response.json();
    if (!response.ok) {
      const detail = data && typeof data === "object" && "detail" in data ? String(data.detail) : "Request unavailable";
      throw new Error(detail);
    }
    return data as ProposalResponse;
  }

  async function run() {
    setLoading(true);
    setMessage("");
    setCopied(false);
    setResult(null);
    const request: ProposalRequest = {
      app_id: "playground",
      input: prompt,
      tools: sampleTools.filter((tool) => enabledTools.includes(tool.name)),
    };
    try {
      // No silent remote fallback. Backend runs only when explicitly selected.
      const response = runtime === "browser" ? await local.propose(request) : await runServer(request);
      setResult(response);
      setMessage(response.proposals.length ? "Proposals validated. No action executed." : "Model returned no eligible tool calls.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to execute inference");
    } finally {
      setLoading(false);
    }
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

  return (
    <>
      <PageHeading
        eyebrow="Workspace / Lab"
        title="Inference playground"
        description="Compare local browser inference with protected server inference. Model output is schema-validated, displayed for review, and never executed here."
        action={<Badge>Needle + Whistle · opt-in</Badge>}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.85fr)]">
        <div className="space-y-5">
          <Card><CardContent className="space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-[#abadff]" /> Input studio</div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Select inference runtime">
                <Button size="sm" variant={runtime === "browser" ? "default" : "outline"} onClick={() => setRuntime("browser")}><Cpu className="size-3.5" /> Local browser</Button>
                <Button size="sm" variant={runtime === "server" ? "default" : "outline"} onClick={() => setRuntime("server")}><Server className="size-3.5" /> Backend API</Button>
              </div>
            </div>
            <div className="rounded-lg border border-[#a2a3ff]/15 bg-[#aaaaff]/[0.045] p-4 text-xs leading-6 text-[#c5c6e7]">
              {runtime === "browser"
                ? "Local mode uses Needle in your browser's WebAssembly worker. No API key required. The model downloads on first use, remains cached when possible, and receives only the tool list and prompt on this device."
                : "Backend mode sends your input and selected tool definitions to the configured Orivyn API through the private Next.js proxy. A Playground access token is required."}
            </div>
            <label className="block space-y-3">
              <span className="text-xs text-slate-400">Natural language instruction</span>
              <Textarea className="min-h-44 resize-y text-base leading-7" value={prompt} maxLength={2000} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe what your application should do..." />
            </label>
            {runtime === "browser" && <LocalVoice transcribe={local.transcribe} onTranscript={setPrompt} disabled={loading || local.status === "loading"} />}
            <div>
              <p className="mb-3 text-xs text-slate-500">Try an example</p>
              <div className="flex flex-wrap gap-2">{examples.map((example, index) => <Button key={example} size="sm" variant="outline" onClick={() => setPrompt(example)}>Example {index + 1}</Button>)}</div>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-white/[0.07] pt-5">
              {runtime === "server" ? <label className="block min-w-56 flex-1 space-y-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-400"><LockKeyhole className="size-3.5" /> Private Playground access token</span>
                <Input type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Configured token" />
              </label> : <p className="max-w-sm text-xs leading-6 text-slate-500">First run downloads approximately 35 MB of Needle weights; voice adds approximately 17 MB of Whistle weights. No external AI API is contacted for inference.</p>}
              <Button onClick={() => void run()} disabled={loading || !prompt.trim() || (runtime === "server" && !token) || enabledTools.length === 0}>
                {loading ? "Processing model…" : "Generate proposals"} <ArrowRight className="size-4" />
              </Button>
            </div>
            {message && <p role="status" className="rounded-lg border border-[#abaaff]/15 bg-[#abaaff]/[0.05] px-3 py-3 text-xs leading-6 text-slate-300">{message}</p>}
          </CardContent></Card>
          <Card><CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-medium"><TerminalSquare className="size-4 text-[#abadff]" /> Structured response</span><Button variant="ghost" size="sm" onClick={() => void copyOutput()} disabled={!result}>{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy JSON"}</Button></div>
            <div className="min-h-64 rounded-lg border border-white/[0.06] bg-[#090c12] p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Response payload</span>
                {result && <Badge tone="success">{result.status} · {result.provider}</Badge>}
              </div>
              <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-7 text-[#bac5e5]">{result ? JSON.stringify(result, null, 2) : '{\n  "status": "awaiting inference",\n  "proposals": []\n}'}</pre>
            </div>
          </CardContent></Card>
        </div>
        <div className="space-y-5">
          <Card><CardContent className="p-6">
            <h2 className="mb-2 text-sm font-semibold">Available tools</h2>
            <p className="mb-5 text-xs leading-6 text-slate-500">Choose which read-only capabilities Needle can propose.</p>
            <div className="space-y-3">{sampleTools.map((tool) => (
              <label key={tool.name} className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.075] bg-white/[0.018] p-4">
                <Checkbox className="mt-0.5 shrink-0" checked={enabledTools.includes(tool.name)} onCheckedChange={(checked) => setEnabledTools((previous) => checked === true ? [...previous, tool.name] : previous.filter((name) => name !== tool.name))} />
                <span><span className="block font-mono text-xs text-[#c2c4ff]">{tool.name}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{tool.description}</span></span>
              </label>
            ))}</div>
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-slate-500"><span>Tool risk policy</span><Badge tone="success">Read only</Badge></div>
          </CardContent></Card>
          <Card><CardContent className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Info className="size-4 text-[#a5a7ff]" /> Runtime details</h2>
            {[
              ["Selected runtime", runtime === "browser" ? "Local / WASM" : "Backend / Cactus"],
              ["Local runtime state", local.status],
              ["Tool handling", "Proposal only"],
              ["Input sensitivity", "Public sample tools"],
              ["Validation", "JSON Schema"],
              ["Remote fallback", "Disabled"],
            ].map(([key, value]) => <div key={key} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] py-3 text-xs last:border-0"><span className="text-slate-500">{key}</span><span className="text-slate-300">{value}</span></div>)}
            <div className="mt-5 flex items-start gap-2 rounded-lg bg-[#a2a3fa]/[0.065] p-4 text-xs leading-6 text-[#bfc1e7]"><Info className="mt-1 size-3.5 shrink-0" /> Whistle recognizes English and six European languages. It is not a multilingual Hindi transcription model. Browser capability and microphone permissions vary.</div>
          </CardContent></Card>
          <Button variant="outline" onClick={() => { setPrompt(examples[0]); setResult(null); setMessage(""); setCopied(false); setEnabledTools(sampleTools.map((tool) => tool.name)); }}><RotateCcw className="size-3.5" /> Reset workspace</Button>
        </div>
      </div>
    </>
  );
}
