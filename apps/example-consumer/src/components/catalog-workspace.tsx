"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, BrainCircuit, Check, Github, Layers3, Lock, RotateCcw, SlidersHorizontal } from "lucide-react";
import { CactusBrowserRuntime } from "@orivyn/browser";
import type { ToolProposal } from "@orivyn/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { catalogItems } from "@/orivyn/catalog-data";
import { useCatalog } from "@/orivyn/hooks";
import type { CatalogCategory } from "@/orivyn/manifest";

export function CatalogWorkspace() {
  const app = useCatalog();
  const runtime = useRef<CactusBrowserRuntime | null>(null);
  const [prompt, setPrompt] = useState("Filter the catalog to audio items");
  const [proposals, setProposals] = useState<ToolProposal[]>([]);
  const [message, setMessage] = useState("Choose a sample action, or ask local Needle to propose one.");
  const [busy, setBusy] = useState(false);
  const [trace, setTrace] = useState<string[]>([]);

  useEffect(() => {
    app.updateContext({ route: app.state.page === "catalog" ? "/catalog" : "/about", selection: app.state.selected ?? undefined });
  }, [app.state.page, app.state.selected, app.updateContext]);

  useEffect(() => () => {
    if (runtime.current) void runtime.current.close();
  }, []);

  function proposeKnown(name: string, args: Record<string, unknown>) {
    setProposals([{ name, arguments: args, confidence: null }]);
    setMessage("Host-created proposal ready. Apply to execute it with Orivyn.");
  }

  async function inferLocally() {
    if (busy) return;
    setBusy(true);
    setMessage("Loading local Needle. First run downloads model assets.");
    setProposals([]);
    try {
      if (!runtime.current) runtime.current = new CactusBrowserRuntime();
      const response = await app.propose(prompt, runtime.current);
      setProposals(response.proposals);
      setMessage(response.proposals.length
        ? `Needle proposed ${response.proposals.length} action(s). Review before applying.`
        : "No eligible tool call. Try specifying an exact category or page.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Local inference failed");
    } finally {
      setBusy(false);
    }
  }

  function apply() {
    const result = app.apply(proposals);
    setTrace(result.trace.map((item) => `${item.name}: ${item.status}${item.reason ? ` (${item.reason})` : ""}`));
    setMessage(result.applied.length ? `Applied ${result.applied.join(", ")}` : "No permitted action applied.");
    setProposals([]);
  }

  const visible = catalogItems.filter((item) => app.state.category === "all" || item.category === app.state.category);
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-5 py-10 md:px-8 md:py-14">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="rounded-xl border border-violet-400/20 bg-violet-400/10 p-2.5"><Layers3 className="size-6 text-violet-300" /></div><div><p className="text-xl font-semibold tracking-tight">Lumen Catalog</p><p className="text-xs text-slate-500">A separate application powered by Orivyn v0.5</p></div></div>
        <Badge>Browser only · no credentials</Badge>
      </header>
      <div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-300">Independent SDK consumer</p><h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Applications own the interface.<br/><span className="text-violet-300">Orivyn handles the capabilities.</span></h1><p className="max-w-2xl text-sm leading-7 text-slate-400">This app imports public Orivyn packages, registers its own catalog actions, and uses a contextual manifest. No Console internal files or remote inference providers.</p></div>
      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        <section className="space-y-4">
          <Card><CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button size="sm" variant={app.state.page === "catalog" ? "default" : "outline"} onClick={() => proposeKnown("catalog.open", { page: "catalog" })}>Catalog</Button>
              <Button size="sm" variant={app.state.page === "about" ? "default" : "outline"} onClick={() => proposeKnown("catalog.open", { page: "about" })}>About</Button>
            </div>
            <Badge>Route: {app.context.route}</Badge>
          </CardContent></Card>
          {app.state.page === "catalog" ? <>
            <Card><CardContent className="space-y-3"><div className="flex items-center gap-2 text-xs text-slate-400"><SlidersHorizontal className="size-4" /> Category shortcuts</div><div className="flex flex-wrap gap-2">{(["all", "audio", "books", "workspace"] as const).map((category: CatalogCategory) => <Button key={category} size="sm" variant={app.state.category === category ? "default" : "outline"} onClick={() => proposeKnown("catalog.filter", { category })}>{category}</Button>)}</div></CardContent></Card>
            <div className="grid gap-3 sm:grid-cols-2">{visible.map((item) => <Card key={item.id}><CardContent className="space-y-3"><div className="flex items-center justify-between"><Badge>{item.category}</Badge>{app.state.selected === item.id && <Check className="size-4 text-emerald-400" />}</div><h2 className="text-lg font-semibold">{item.name}</h2><p className="text-xs leading-6 text-slate-400">{item.description}</p><div className="flex items-center justify-between"><p className="text-sm">{item.price}</p><Button size="sm" variant="outline" onClick={() => proposeKnown("catalog.select", { id: item.id })}>Select</Button></div></CardContent></Card>)}</div>
          </> : <Card><CardContent className="space-y-3 py-10"><h2 className="text-lg font-semibold">About Lumen</h2><p className="text-sm leading-7 text-slate-400">This page hides the filter and selection capabilities automatically. Try asking Needle to filter the catalog here, or inspect the available tools. Only navigation remains eligible.</p></CardContent></Card>}
        </section>
        <aside className="space-y-4">
          <Card><CardContent className="space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><BrainCircuit className="size-4 text-violet-300" /> Orivyn Runtime</h2>
            <label className="block space-y-2"><span className="text-xs text-slate-400">Local instruction</span><Input value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={2000}/></label>
            <Button disabled={busy || app.busy || !prompt.trim()} onClick={() => void inferLocally()}>{busy ? "Running Needle…" : "Run Needle locally"} <ArrowRight className="size-4"/></Button>
            <p role="status" className="text-xs leading-6 text-slate-400">{message}</p>
            <div className="space-y-2 border-t border-white/10 pt-3"><p className="text-xs font-medium">Available now ({app.available.length})</p>{app.manifest.tools.map((tool) => <div key={tool.name} className="flex items-center justify-between gap-2 text-xs"><span className="font-mono text-slate-400">{tool.name}</span><span className={app.available.some((item) => item.name === tool.name) ? "text-emerald-400" : "text-slate-600"}>{app.available.some((item) => item.name === tool.name) ? "Eligible" : "Unavailable"}</span></div>)}</div>
            <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-[#0e1119] p-3 text-xs leading-6 text-slate-400"><Lock className="mt-1 size-4 shrink-0"/> All proposals are reviewed locally. This demo cannot execute payment, authentication or server operations.</div>
          </CardContent></Card>
          {proposals.length > 0 && <Card><CardContent className="space-y-3"><h3 className="text-sm font-semibold">Review proposed action</h3><pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/30 p-3 text-xs text-slate-300">{JSON.stringify(proposals, null, 2)}</pre><Button onClick={apply}>Apply to catalog <ArrowRight className="size-4" /></Button></CardContent></Card>}
          {trace.length > 0 && <Card><CardContent><h3 className="mb-3 text-sm font-semibold">Execution trace</h3>{trace.map((entry, index) => <p key={index} className="py-1 font-mono text-xs text-slate-400">{entry}</p>)}<Button variant="ghost" size="sm" className="mt-3" onClick={() => setTrace([])}><RotateCcw className="size-3.5"/> Clear trace</Button></CardContent></Card>}
        </aside>
      </div>
      <footer className="flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs text-slate-500"><span>Orivyn runtime · isolated per application</span><a href="https://github.com/rishitshivesh/orivyn" rel="noopener noreferrer" target="_blank" className="inline-flex items-center gap-2 text-violet-300"><Github className="size-4"/> Source</a></footer>
    </main>
  );
}
