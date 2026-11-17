"use client";

import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Blocks,
  Braces,
  CircleCheck,
  Cpu,
  ExternalLink,
  FlaskConical,
  GitBranch,
  Globe2,
  Layers3,
  RefreshCcw,
  Server,
  ShieldCheck,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { PageHeading } from "@/components/console/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiStatus } from "@/hooks/use-api-status";

const modules = [
  {
    name: "Core contracts",
    path: "@orivyn/core",
    icon: Braces,
    state: "Available",
    description: "Typed tools and request/response contracts",
  },
  {
    name: "HTTP client",
    path: "@orivyn/client",
    icon: Globe2,
    state: "Available",
    description: "Reusable server transport",
  },
  {
    name: "React integration",
    path: "@orivyn/react",
    icon: Layers3,
    state: "Foundation",
    description: "React hook for tool proposals",
  },
  {
    name: "Browser runtime",
    path: "@orivyn/browser",
    icon: Cpu,
    state: "Integrated · unverified",
    description: "Needle + Whistle WebAssembly adapter",
  },
];

export default function Overview() {
  const { status, loading, refresh } = useApiStatus();
  const connected = status?.connected === true;
  const capability = status?.connected ? status.capabilities : null;

  return (
    <>
      <PageHeading
        eyebrow="Workspace / Overview"
        title="The intelligence layer."
        description="One composable platform. Browser where possible, backend when required. Your applications stay in control of every action."
        action={
          <Button asChild>
            <Link href="/playground">
              Open playground <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      <section className="mb-7 overflow-hidden rounded-2xl border border-[#9293e6]/15 bg-[linear-gradient(116deg,#1d2040_0%,#171a2b_52%,#12151e_100%)] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <Badge className="mb-4 border-[#a4a6ef]/20 bg-[#a4a6ef]/10 text-[#cacbff]">
              Orivyn · Foundation v0.1
            </Badge>
            <h2 className="text-2xl font-semibold tracking-[-0.045em] text-white md:text-3xl">
              Build once. Integrate everywhere.
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#aeb3d2]">
              A shared inference and tool-proposal layer for E.D.I.T.H.,
              Payments, Identity, CMS and whatever comes next.
            </p>
          </div>
          <div className="flex size-24 items-center justify-center rounded-3xl border border-[#acaaff]/20 bg-[#9a9eff]/10 text-[#c6c7ff]">
            <GitBranch className="size-12" strokeWidth={1} />
          </div>
        </div>
        <div className="mt-9 flex flex-wrap gap-2 text-[11px] text-[#c3c5e4]">
          {[
            "Model-agnostic",
            "Typed tools",
            "Execution policy",
            "OpenAPI-first",
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      <div className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "API connection",
            value: loading ? "Checking" : connected ? "Connected" : "Offline",
            detail: connected
              ? "Health endpoint responding"
              : "Start or configure the backend",
            icon: Activity,
            tone: connected ? "text-emerald-300" : "text-amber-300",
          },
          {
            label: "Configured provider",
            value: capability?.provider ?? "Unknown",
            detail: capability?.server_inference_enabled
              ? "Server inference configured"
              : "Model inference not enabled",
            icon: Cpu,
            tone: "text-white",
          },
          {
            label: "Active packages",
            value: "04",
            detail: "Core, Client, React, Browser",
            icon: Blocks,
            tone: "text-white",
          },
          {
            label: "Conversation",
            value: capability?.conversation_enabled ? "Enabled" : "Disabled",
            detail: "Explicit provider configuration",
            icon: ShieldCheck,
            tone: "text-[#bec0ff]",
          },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{card.label}</span>
                <card.icon className="size-4" />
              </div>
              <p
                className={`text-[25px] font-semibold tracking-tight ${card.tone}`}
              >
                {card.value}
              </p>
              <p className="text-xs text-slate-500">{card.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Platform architecture
              </h3>
              <Badge>Execution flow</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  title: "Consumer apps",
                  subtitle: "E.D.I.T.H. · Payments · Identity",
                  icon: Globe2,
                },
                {
                  title: "Orivyn Core",
                  subtitle: "Contracts · Validation · Routing",
                  icon: GitBranch,
                },
                {
                  title: "Runtime",
                  subtitle: "Browser · API · Providers",
                  icon: Server,
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="relative rounded-xl border border-white/[0.09] bg-[#10141e] p-4"
                >
                  <item.icon className="mb-5 size-5 text-[#aaaaff]" />
                  <h4 className="text-sm font-medium text-white">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    {item.subtitle}
                  </p>
                  {index < 2 && (
                    <ArrowRight className="absolute -right-2.5 top-1/2 z-10 hidden size-5 rounded-full bg-[#24273c] p-0.5 text-[#a9abff] sm:block" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.035] p-4">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              <p className="text-xs leading-6 text-slate-400">
                The model returns proposals, never executes financial
                transactions, privileged actions or arbitrary code. Applications
                retain authorization and final execution.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Runtime diagnostics
              </h3>
              <Button size="sm" variant="ghost" onClick={() => void refresh()}>
                <RefreshCcw className="size-3.5" /> Refresh
              </Button>
            </div>
            <div className="space-y-4">
              {[
                {
                  label: "API gateway",
                  value: loading
                    ? "Checking"
                    : connected
                      ? "Reachable"
                      : "Unavailable",
                  okay: connected,
                },
                {
                  label: "Server provider",
                  value: capability?.provider ?? "Not detected",
                  okay: capability?.server_inference_enabled ?? false,
                },
                {
                  label: "Browser inference",
                  value: "Integrated · browser QA pending",
                  okay: false,
                },
                {
                  label: "Tool execution",
                  value: "Disabled (safe default)",
                  okay: true,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3 text-xs last:border-0"
                >
                  <span className="text-slate-400">{item.label}</span>
                  <span className="flex items-center gap-2 text-slate-200">
                    <span
                      className={`size-1.5 rounded-full ${item.okay ? "bg-emerald-400" : "bg-amber-400"}`}
                    />
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/runtimes"
              className="mt-5 inline-flex items-center gap-1 text-xs text-[#b9baff] hover:text-white"
            >
              Explore runtimes <ArrowUpRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <section className="mt-9">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-400/15 bg-indigo-400/[0.035] p-4">
          <div>
            <p className="text-sm font-semibold text-slate-100">
              New: Agent Lab
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Local action routing and opt-in streaming conversations
            </p>
          </div>
          <Link
            href="/agent"
            className="text-xs text-indigo-300 hover:text-white"
          >
            Open Agent Lab →
          </Link>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Packages and integrations
          </h2>
          <Link
            href="/guide"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
          >
            Integration guide <ExternalLink className="size-3" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((item) => (
            <Card key={item.name}>
              <CardContent className="p-5">
                <div className="mb-6 flex items-start justify-between gap-2">
                  <item.icon className="size-5 text-[#a4a6ff]" />
                  <Badge>{item.state}</Badge>
                </div>
                <p className="font-medium text-white">{item.name}</p>
                <p className="mt-1 text-xs text-slate-500">{item.path}</p>
                <p className="mt-4 text-xs leading-5 text-slate-400">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <Waves className="size-4" /> Local Needle and Whistle adapters are
        included; verify real browser inference before production deployment.{" "}
        <FlaskConical className="size-3.5" />
      </div>
    </>
  );
}
