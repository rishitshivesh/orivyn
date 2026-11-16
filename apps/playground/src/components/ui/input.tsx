import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-400",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
