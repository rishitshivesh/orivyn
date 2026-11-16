import { BriefcaseBusiness, Disc3, Layers3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { visibleProjects, type DemoState } from "@/lib/demo-domain";

export function DemoPreview({ state }: { state: DemoState }) {
  const projects = visibleProjects(state);
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Layers3 className="size-4 text-[#abadff]" /> Live application preview</div>
          <Badge>{state.page}</Badge>
        </div>
        {state.page === "projects" ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">Category: {state.category} · Technology: {state.technology}</p>
            {projects.length ? projects.map((project) => (
              <div key={project.title} className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{project.title}</p><Badge>{project.category}</Badge></div>
                <p className="mt-2 text-xs text-slate-400">{project.description}</p>
                <p className="mt-3 text-[11px] text-[#b1b3ff]">{project.technologies.join(" · ")}</p>
              </div>
            )) : <p className="rounded-lg border border-dashed border-white/10 p-5 text-xs text-slate-400">No demo projects match these filters. Reset the view or choose another filter.</p>}
          </div>
        ) : state.page === "music" ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-white/10 bg-[#131523] text-center">
            <Disc3 className="mb-4 size-10 text-[#b7b9ff]" strokeWidth={1.4}/>
            <p className="text-base font-semibold">Music Studio</p>
            <p className="mt-2 max-w-xs text-xs leading-6 text-slate-400">Demo navigation succeeded. The actual music app is integrated separately.</p>
          </div>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-white/10 bg-[#131523] text-center">
            <BriefcaseBusiness className="mb-4 size-10 text-[#b7b9ff]" strokeWidth={1.4}/>
            <p className="text-base font-semibold">Career</p>
            <p className="mt-2 max-w-xs text-xs leading-6 text-slate-400">Demo navigation succeeded. Connect a real application manifest to navigate outside the Playground.</p>
          </div>
        )}
        <p className="mt-4 text-[11px] text-slate-500">Illustrative sample content. No CMS or payment data is accessed.</p>
      </CardContent>
    </Card>
  );
}
