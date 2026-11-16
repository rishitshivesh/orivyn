"use client";

import {
  Activity,
  ArrowUpRight,
  Cpu,
  HardDrive,
  LockKeyhole,
  Server,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/console/page-heading";
import { useApiStatus } from "@/hooks/use-api-status";

export default function Runtimes() {
  const { status, loading, refresh } = useApiStatus();
  const enabled = status?.connected
    ? status.capabilities.server_inference_enabled
    : false;
  const provider = status?.connected ? status.capabilities.provider : "Unknown";
  return (
    <>
      <PageHeading
        eyebrow="Workspace / Execution"
        title="Runtime topology"
        description="Orivyn is designed to choose execution based on device capability, operation sensitivity and application policy. The local Needle/Whistle adapter is now included; verify browser/WASM compatibility before production use."
        action={
          <Button variant="outline" onClick={() => void refresh()}>
            <Activity className="size-4" /> Refresh health
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            title: "Browser runtime",
            icon: Cpu,
            tag: "Integrated · unverified",
            description:
              "Needle and Whistle run on the visitor device through the cactus-needle WebAssembly workers. Models load only on first use; no private service keys.",
            lines: [
              "Local tool proposals implemented",
              "Opt-in Whistle audio recording",
              "Browser integration QA required",
            ],
          },
          {
            title: "Server runtime",
            icon: Server,
            tag: loading ? "Checking" : enabled ? "Configured" : "Disabled",
            description:
              "FastAPI runs bounded, schema-validated proposals. Native Cactus loads lazily only after a request.",
            lines: [
              `Provider: ${provider}`,
              "Private service key required",
              "Tool execution disabled",
            ],
          },
          {
            title: "External providers",
            icon: HardDrive,
            tag: "Future adapter",
            description:
              "Hosted model inference will require an explicit per-app policy and transparent data transfer decisions.",
            lines: [
              "No automatic external fallback",
              "No provider keys in the browser",
              "Provider adapter registry planned",
            ],
          },
        ].map((runtime) => (
          <Card key={runtime.title}>
            <CardContent className="flex h-full flex-col p-6">
              <div className="mb-7 flex items-start justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl border border-[#a9aaff]/15 bg-[#9698eb]/10">
                  <runtime.icon className="size-5 text-[#aeb0ff]" />
                </div>
                <Badge>{runtime.tag}</Badge>
              </div>
              <h2 className="text-lg font-semibold">{runtime.title}</h2>
              <p className="mt-2 min-h-24 text-xs leading-6 text-slate-400">
                {runtime.description}
              </p>
              <div className="mt-auto space-y-4 border-t border-white/[0.07] pt-5">
                {runtime.lines.map((line) => (
                  <p
                    key={line}
                    className="flex items-center gap-2 text-xs text-slate-400"
                  >
                    <span className="size-1 rounded-full bg-[#9396ed]" />
                    {line}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardContent className="flex flex-wrap items-center justify-between gap-5 p-6">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-1 size-5 text-emerald-400" />
            <div>
              <h3 className="font-medium">Security before convenience</h3>
              <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400">
                Payment, authentication and other sensitive workflows always
                require the application's authenticated backend. A requested
                browser runtime cannot override that policy.
              </p>
            </div>
          </div>
          <a
            href="https://github.com/rishitshivesh/orivyn/blob/main/docs/ARCHITECTURE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-[#c1c2ff]"
          >
            Architecture document <ArrowUpRight className="size-4" />
          </a>
        </CardContent>
      </Card>
    </>
  );
}
