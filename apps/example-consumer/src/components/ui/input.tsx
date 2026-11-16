import * as React from "react";
import { cn } from "@/lib/utils";
export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn("h-11 w-full rounded-lg border border-white/15 bg-[#0d1018] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", className)} {...props} />;
}
