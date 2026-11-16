import { ArrowUpRight, Braces, LockKeyhole, ShieldCheck, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/console/page-heading";
import { sampleTools } from "@/lib/capabilities";

export default function Tools() {
  return (
    <>
      <PageHeading eyebrow="Workspace / Registry" title="Tool registry" description="Capabilities your application explicitly exposes to inference. These examples are local code definitions, not saved registrations." action={<Badge>2 example tools</Badge>} />
      <div className="grid gap-4 lg:grid-cols-2">{sampleTools.map((tool) => (
        <Card key={tool.name}><CardContent className="p-6">
          <div className="mb-7 flex items-start justify-between"><div className="flex size-10 items-center justify-center rounded-xl border border-indigo-400/15 bg-indigo-400/10"><Wrench className="size-5 text-[#b4b5ff]" /></div><Badge tone="success">read · browser</Badge></div>
          <h2 className="font-mono text-lg font-medium text-white">{tool.name}</h2>
          <p className="mt-2 min-h-10 text-sm leading-6 text-slate-400">{tool.description}</p>
          <div className="mt-5 rounded-lg border border-white/[0.07] bg-[#0b0f16] p-4"><p className="mb-3 flex items-center gap-2 text-xs text-slate-500"><Braces className="size-3.5" /> JSON Schema parameters</p><pre className="overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-6 text-[#aeb9d8]">{JSON.stringify(tool.parameters, null, 2)}</pre></div>
        </CardContent></Card>
      ))}</div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card><CardContent className="flex items-start gap-4 p-6"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-400" /><div><h3 className="font-medium">Nothing executes automatically</h3><p className="mt-2 text-xs leading-6 text-slate-400">Orivyn validates proposals against the supplied allowlist and JSON Schema. Your application still owns final permission checks and execution.</p></div></CardContent></Card>
        <Card><CardContent className="flex items-start gap-4 p-6"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-[#b9baff]" /><div><h3 className="font-medium">Persistent registry is planned</h3><p className="mt-2 text-xs leading-6 text-slate-400">App registration, per-tool permissions, credential rotation and audited changes arrive with the secured management plane, not as an unsecured CRUD endpoint.</p></div></CardContent></Card>
      </div>
      <a href="https://github.com/rishitshivesh/orivyn/blob/main/docs/INTEGRATIONS.md" className="mt-6 inline-flex items-center gap-2 text-xs text-[#b7b9ff] hover:text-white" target="_blank" rel="noopener noreferrer">How to register application tools <ArrowUpRight className="size-3.5" /></a>
    </>
  );
}
