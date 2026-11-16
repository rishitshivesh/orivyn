import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-h-28 rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-400",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
