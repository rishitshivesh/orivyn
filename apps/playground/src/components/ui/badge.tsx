import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.ComponentProps<"span"> & {
  tone?: "neutral" | "success" | "warning";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
        tone === "success" &&
          "border-emerald-500/20 bg-emerald-400/10 text-emerald-300",
        tone === "warning" &&
          "border-amber-500/20 bg-amber-400/10 text-amber-300",
        tone === "neutral" && "border-white/10 bg-white/[0.045] text-slate-300",
        className,
      )}
      {...props}
    />
  );
}
