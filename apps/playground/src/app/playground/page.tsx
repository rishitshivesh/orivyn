"use client";

import { useState } from "react";
import { ArrowRight, Check, Copy, FlaskConical, Info, LockKeyhole, RotateCcw, Sparkles, TerminalSquare } from "lucide-react";
import type { ProposalResponse } from "@orivyn/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { PageHeading } from "@/components/console/page-heading";
import { sampleTools } from "@/lib/capabilities";

const examples = [
  "Open the music section of my portfolio.",
  "Show the projects filtered by Kubernetes.",
  "Navigate to my career history.",
];

export default function Playground() {
  const [prompt, setPrompt] = useState(examples[0]);
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ProposalResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enabledTools, setEnabledTools] = useState(["navigate", "filter_projects"]);

  async function run() {
    setLoading(true);
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ app_id: "playground", input: prompt, tools: sampleTools.filter((tool) => enabledTools.includes(tool.name)) }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const detail = data && typeof data === "object" && "detail" in data ? String(data.detail) : "Request unavailable";
        setMessage(detail);
        return;
      }
      setResult(data as ProposalResponse);
    } catch {
      setMessage("Could not connect to the configured Orivyn API.");
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
  }

  return (
    <>
      <PageHeading eyebrow="Workspace / Lab" title="Inference playground" description="Experiment with natural-language inputs and inspect validated model proposals. This workspace does not execute tools." action={<Badge>Live API · when configured</Badge>} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.85fr)]">
        <div className="space-y-5">
          <Card><CardContent className="space-y-6 p-6">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-[#abadff]" /> Input studio</div><Badge>Server proposal</Badge></div>
            <label className="block space-y-3"><span className="text-xs text-slate-400">Natural language instruction</span><Textarea className="min-h-44 resize-y text-base leading-7" value={prompt} maxLength={2000} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe what the application should do..." /></label>
            <div><p className="mb-3 text-xs text-slate-500">Try an example</p><div className="flex flex-wrap gap-2">{examples.map((example, index) => <Button key={example} size="sm" variant="outline" onClick={() => setPrompt(example)}>Example {index + 1}</Button>)}</div></div>
            <div className="grid gap-4 border-t border-white/[0.07] pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="block space-y-2"><span className="flex items-center gap-1.5 text-xs text-slate-400"><LockKeyhole className="size-3.5" /> Private playground access token</span><Input type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Set in ORIVYN_PLAYGROUND_ACCESS_TOKEN" /></label>
              <Button onClick={() => void run()} disabled={loading || !prompt.trim() || !token || enabledTools.length === 0}>{loading ? "Inferring…" : "Run proposal"} <ArrowRight className="size-4" /></Button>
            </div>
            {message && <p role="alert" className="rounded-lg border border-amber-400/15 bg-amber-400/[0.05] px-3 py-3 text-xs text-amber-200">{message}</p>}
          </CardContent></Card>
          <Card><CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-medium"><TerminalSquare className="size-4 text-[#abadff]" /> Structured response</span><Button variant="ghost" size="sm" onClick={() => void copyOutput()} disabled={!result}>{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy JSON"}</Button></div>
            <div className="min-h-64 rounded-lg border border-white/[0.06] bg-[#090c12] p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] uppercase tracking-widest text-slate-500">Response payload</span>{result && <Badge tone="success">{result.status} · {result.provider}</Badge>}</div><pre className="whitespace-pre-wrap break-all font-mono text-xs leading-7 text-[#bac5e5]">{result ? JSON.stringify(result, null, 2) : "{\n  \"status\": \"awaiting inference\",\n  \"proposals\": []\n}"}</pre></div>
          </CardContent></Card>
        </div>
        <div className="space-y-5">
          <Card><CardContent className="p-6">
            <h2 className="mb-2 text-sm font-semibold">Available tools</h2><p className="mb-5 text-xs leading-6 text-slate-500">Choose exactly which read-only capabilities the model may propose.</p>
            <div className="space-y-3">{sampleTools.map((tool) => (
              <label key={tool.name} className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.075] bg-white/[0.018] p-4">
                <Checkbox className="mt-0.5 shrink-0" checked={enabledTools.includes(tool.name)} onCheckedChange={(checked) => setEnabledTools((previous) => checked === true ? [...previous, tool.name] : previous.filter((name) => name !== tool.name))} />
                <span><span className="block font-mono text-xs text-[#c2c4ff]">{tool.name}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{tool.description}</span></span>
              </label>
            ))}</div>
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-slate-500"><span>Tool risk policy</span><Badge tone="success">Read only</Badge></div>
          </CardContent></Card>
          <Card><CardContent className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><FlaskConical className="size-4 text-[#a5a7ff]" /> Execution details</h2>
            {[["Selected runtime", "Backend / Cactus"], ["Tool handling", "Propose only"], ["Input scope", "Public examples"], ["Schema validation", "JSON Schema 2020-12"]].map(([key, value]) => <div key={key} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] py-3 text-xs last:border-0"><span className="text-slate-500">{key}</span><span className="text-slate-300">{value}</span></div>)}
            <div className="mt-5 flex items-start gap-2 rounded-lg bg-[#a2a3fa]/[0.065] p-4 text-xs leading-6 text-[#bfc1e7]"><Info className="mt-1 size-3.5 shrink-0" /> Real model calls require installing the Cactus runtime, enabling its provider and configuring server-side credentials. Browser inference is not yet implemented.</div>
          </CardContent></Card>
          <Button variant="outline" onClick={() => { setPrompt(examples[0]); setResult(null); setMessage(""); setCopied(false); setEnabledTools(sampleTools.map((tool) => tool.name)); }}><RotateCcw className="size-3.5" /> Reset workspace</Button>
        </div>
      </div>
    </>
  );
}
