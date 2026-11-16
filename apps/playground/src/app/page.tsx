"use client";

import { useState } from "react";
import { ArrowRight, BrainCircuit, Code2, Cpu, LockKeyhole, Network, ShieldCheck } from "lucide-react";
import type { ProposalResponse, ToolDefinition } from "@orivyn/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const tools: ToolDefinition[] = [
  { name: "navigate", description: "Navigate to a public application page", parameters: { type: "object", properties: { page: { type: "string", enum: ["projects", "music", "career"] } }, required: ["page"] }, execution: "browser", risk: "read" },
  { name: "filter_projects", description: "Filter visible public projects by technology", parameters: { type: "object", properties: { technology: { type: "string" } }, required: ["technology"] }, execution: "browser", risk: "read" },
];

const capabilities = [
  { icon: Cpu, name: "Local inference", desc: "Browser runtime adapter", status: "Planned" },
  { icon: Network, name: "Model proposals", desc: "Cactus / Needle on backend", status: "Available when configured" },
  { icon: ShieldCheck, name: "Typed actions", desc: "Allowlisted, unexecuted tool calls", status: "Foundation" },
  { icon: Code2, name: "SDK", desc: "Composable TypeScript packages", status: "Foundation" },
];

export default function Page() {
  const [prompt, setPrompt] = useState("Show infrastructure projects built with Kubernetes.");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ProposalResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setResult(null);
    setMessage("");
    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ app_id: "playground", input: prompt, tools }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const detail = payload && typeof payload === "object" && "detail" in payload ? String(payload.detail) : "Provider unavailable or access denied";
        setMessage(detail);
        return;
      }
      setResult(payload as ProposalResponse);
    } catch {
      setMessage("Unable to reach the Orivyn API");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-14 flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-indigo-400/30 bg-indigo-400/10 p-3"><BrainCircuit className="h-6 w-6 text-indigo-300" /></div>
          <div><p className="text-xl font-semibold tracking-tight">orivyn.</p><p className="text-xs text-slate-400">Intelligence, wherever it belongs.</p></div>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">Foundation v0.1</span>
      </header>
      <section className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[.24em] text-indigo-300">The Playground</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Turn intention into <span className="text-indigo-300">action proposals.</span></h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">The model proposes a typed tool call. Your application validates and controls execution. No unexplained magic, no unauthorized actions.</p>
      </section>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader><h2 className="font-semibold">Propose an action</h2><p className="mt-1 text-sm text-slate-400">Uses a private server proxy; optional Cactus runtime must be enabled.</p></CardHeader>
          <CardContent className="space-y-5">
            <label className="block space-y-2"><span className="text-xs text-slate-400">Instruction</span><Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={2000} /></label>
            <label className="block space-y-2"><span className="flex items-center gap-2 text-xs text-slate-400"><LockKeyhole className="h-3.5 w-3.5" /> Private playground access token</span><Input type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Enter configured token" /></label>
            <Button onClick={run} disabled={!prompt.trim() || !token || loading}>{loading ? "Running inference…" : "Propose tool call"} <ArrowRight className="h-4 w-4" /></Button>
            {message && <p role="alert" className="text-sm text-amber-300">{message}</p>}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <div className="mb-3 flex justify-between"><span className="text-xs text-slate-400">MODEL OUTPUT</span><span className="text-xs text-slate-500">{result?.provider ?? "Awaiting request"}</span></div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-300">{result ? JSON.stringify(result, null, 2) : "No output yet. Enter your private access token and test a tool proposal."}</pre>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card><CardHeader><h2 className="font-semibold">Available tool schemas</h2></CardHeader><CardContent className="space-y-3">{tools.map((tool) => <div key={tool.name} className="rounded-lg border border-slate-800 p-3"><p className="font-mono text-sm text-indigo-300">{tool.name}</p><p className="mt-1 text-xs text-slate-400">{tool.description}</p></div>)}<p className="text-xs text-slate-500">This page never executes selected tools.</p></CardContent></Card>
          <Card><CardHeader><h2 className="font-semibold">Execution policy</h2></CardHeader><CardContent><p className="text-sm leading-7 text-slate-400">Read-only browser actions are allowed in this demo. Protected reads, authentication and payments must run through their owning backend.</p></CardContent></Card>
        </div>
      </div>
      <section className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{capabilities.map((item) => <Card key={item.name}><CardContent className="space-y-3 pt-6"><item.icon className="h-5 w-5 text-indigo-300" /><h3 className="text-sm font-semibold">{item.name}</h3><p className="text-xs text-slate-400">{item.desc}</p><p className="text-xs text-slate-500">{item.status}</p></CardContent></Card>)}</section>
    </main>
  );
}
