import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const styles = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-indigo-300 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-[#c4b5fd] text-slate-950 hover:bg-[#ddd4ff]",
        outline: "border border-white/15 text-slate-100 hover:bg-white/10",
        ghost: "text-slate-300 hover:bg-white/10",
      },
      size: { default: "h-10 px-4", sm: "h-8 px-3" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
export function Button({
  asChild = false,
  variant,
  size,
  className,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof styles> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(styles({ variant, size }), className)} {...props} />
  );
}
