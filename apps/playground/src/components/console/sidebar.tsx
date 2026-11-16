"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowUpRight, BookOpenText, Boxes, FlaskConical, MessageSquareText, ChartNoAxesCombined, AppWindow, LayoutDashboard, Network, Orbit } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/playground", label: "Playground", icon: FlaskConical },
  { href: "/benchmarks", label: "Model benchmarks", icon: ChartNoAxesCombined },
  { href: "/applications", label: "Application Studio", icon: AppWindow },
  { href: "/agent", label: "Agent Lab", icon: MessageSquareText },
  { href: "/tools", label: "Tool registry", icon: Boxes },
  { href: "/runtimes", label: "Runtimes", icon: Network },
  { href: "/guide", label: "Developer guide", icon: BookOpenText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex shrink-0 flex-col border-b border-white/[0.07] bg-[#0b0e14] lg:sticky lg:top-0 lg:h-screen lg:w-[252px] lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 px-5 py-6 lg:px-7 lg:py-9">
        <div className="flex size-10 items-center justify-center rounded-xl border border-[#a5a7ff]/20 bg-[#a5a7ff]/10 text-[#abaeff]">
          <Orbit className="size-6" strokeWidth={1.6} />
        </div>
        <div>
          <p className="text-[19px] font-semibold tracking-[-0.075em] text-white">orivyn<span className="text-[#a5a7ff]">.</span></p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Developer platform</p>
        </div>
      </div>
      <p className="hidden px-7 pb-3 pt-4 text-[10px] font-semibold uppercase tracking-[0.19em] text-slate-600 lg:block">Workspace</p>
      <nav aria-label="Main navigation" className="flex gap-1 overflow-auto px-3 pb-3 lg:flex-col lg:px-4">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-max items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] transition-colors",
                active
                  ? "border border-[#888af2]/15 bg-[#9394ee]/10 font-medium text-[#d5d5ff]"
                  : "text-slate-400 hover:bg-white/[0.045] hover:text-white",
              )}
            >
              <Icon className="size-[17px]" strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden border-t border-white/[0.07] px-5 py-5 lg:block">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <Activity className="size-3.5" /> Applications · v0.5.0
        </div>
        <a
          href="https://github.com/rishitshivesh/orivyn"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between text-xs text-slate-400 hover:text-white"
        >
          Repository <ArrowUpRight className="size-3.5" />
        </a>
      </div>
    </aside>
  );
}
