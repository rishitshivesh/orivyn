import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
  {
    variants: {
      variant: {
        default: "bg-indigo-400 text-slate-950 hover:bg-indigo-300",
        outline:
          "border border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800",
        ghost: "text-slate-300 hover:bg-slate-800",
      },
      size: { default: "h-10 px-4 py-2", sm: "h-8 px-3", lg: "h-12 px-6" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
