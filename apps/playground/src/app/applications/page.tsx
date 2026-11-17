"use client";

import { useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  Braces,
  CheckCircle2,
  ClipboardCopy,
  LockKeyhole,
  PanelTop,
  Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DemoPreview } from "@/components/console/demo-preview";
import { PageHeading } from "@/components/console/page-heading";
import { matchDemoIntent } from "@/lib/demo-domain";
import { createStudioRuntime } from "@/lib/studio-runtime";

export default function Applications() {
  const [runtime] = useState(createStudioRuntime);
  const snapshot = useSyncExternalStore(
    runtime.subscribe,
    runtime.getSnapshot,
    runtime.getSnapshot,
  );
  const [input, setInput] = useState("Show Kubernetes infrastructure projects");
  const [message, setMessage] = useState(
    "Choose a tool, change context, or run a supported local command.",
  );
  const [trace, setTrace] = useState<{ id: string; text: string }[]>([]);

  function setRoute(page: "projects" | "music" | "career") {
    runtime.updateContext({ route: `/${page}` });
    setMessage(
      `Context changed to /${page}. Available tools were recalculated.`,
    );
  }

  function runCommand() {
    const eligible = snapshot.available.map((tool) => tool.name);
    const proposals = matchDemoIntent(input, eligible);
    if (!proposals.length) {
      setMessage(
        "No supported action for the current context and enabled tools.",
      );
      setTrace([]);
      return;
    }
    const report = runtime.execute(proposals);
    runtime.updateContext({ route: `/${report.state.page}` });
    setTrace(
      report.trace.map((item) => ({
        id: crypto.randomUUID(),
        text: `${item.name}: ${item.status}${item.reason ? ` (${item.reason})` : ""}`,
      })),
    );
    setMessage(
      report.applied.length
        ? `Applied ${report.applied.join(", ")}`
        : "The proposals were rejected.",
    );
  }

  async function copyManifest() {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(runtime.manifest, null, 2),
      );
      setMessage("Manifest JSON copied.");
    } catch {
      setMessage(
        "Clipboard unavailable. Select and copy the manifest JSON below.",
      );
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Workspace / Applications"
        title="Application Studio"
        description="Inspect a real in-memory application manifest, change runtime context, toggle capabilities and see the available tool set update. No database or secret keys needed."
        action={<Badge>Ephemeral local demo</Badge>}
      />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <PanelTop className="size-4 text-[#adaeff]" />{" "}
                  {runtime.manifest.name}
                </h2>
                <Badge>v{runtime.manifest.version}</Badge>
              </div>
              <p className="font-mono text-xs text-slate-500">
                {runtime.manifest.id}
              </p>
              <div className="space-y-2">
                <p className="text-xs text-slate-400">Active route context</p>
                <div className="flex flex-wrap gap-2">
                  {(["projects", "music", "career"] as const).map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      variant={
                        snapshot.context.route === `/${page}`
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setRoute(page)}
                    >
                      /{page}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/[0.08] pt-4">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-medium">
                  <Settings2 className="size-4 text-slate-400" /> Registered
                  tools
                </h3>
                <div className="space-y-3">
                  {runtime.manifest.tools.map((tool) => {
                    const enabled = snapshot.enabled.includes(tool.name);
                    const eligible = snapshot.available.some(
                      (item) => item.name === tool.name,
                    );
                    return (
                      <div
                        key={tool.name}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3"
                      >
                        <div>
                          <p className="font-mono text-xs text-[#c1c2ff]">
                            {tool.name}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {eligible
                              ? "Available in current context"
                              : enabled
                                ? "Unavailable on this route"
                                : "Disabled by user"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={enabled ? "default" : "outline"}
                          onClick={() =>
                            runtime.setEnabled(tool.name, !enabled)
                          }
                        >
                          {enabled ? "Enabled" : "Enable"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-lg border border-indigo-400/10 bg-indigo-400/[0.04] p-4 text-xs leading-6 text-slate-400">
                <LockKeyhole className="mr-2 inline size-4 text-indigo-300" />{" "}
                Only eligible, registered, read-only tools can execute. Changes
                affect this page's local runtime only.
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 p-6">
              <h3 className="text-sm font-semibold">Try a supported action</h3>
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Open music"
                maxLength={2000}
              />
              <Button
                disabled={!input.trim() || !snapshot.available.length}
                onClick={runCommand}
              >
                Run local action <ArrowRight className="size-4" />
              </Button>
              <p role="status" className="text-xs leading-6 text-slate-400">
                {message}
              </p>
              {trace.map((item) => (
                <p key={item.id} className="font-mono text-xs text-[#b7b9ff]">
                  {item.text}
                </p>
              ))}
            </CardContent>
          </Card>
          <DemoPreview state={snapshot.state} />
        </div>
        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Braces className="size-4 text-[#adaeff]" /> Manifest
                  inspector
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void copyManifest()}
                >
                  <ClipboardCopy className="size-3.5" /> Copy
                </Button>
              </div>
              <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap break-all rounded-lg bg-[#080b11] p-4 font-mono text-[11px] leading-6 text-slate-300">
                {JSON.stringify(runtime.manifest, null, 2)}
              </pre>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="size-4 text-emerald-400" /> Runtime
                inspection
              </h3>
              <p className="text-xs text-slate-400">
                Revision: {snapshot.revision}
              </p>
              <p className="text-xs text-slate-400">
                Eligible tools: {snapshot.available.length} of{" "}
                {runtime.manifest.tools.length}
              </p>
              <p className="text-xs text-slate-400">
                Context route: {snapshot.context.route}
              </p>
              <p className="text-xs leading-6 text-slate-500">
                The separate example consumer uses the public React SDK; this
                Studio uses the same framework-independent runtime contracts.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
