import * as React from "react";
export function Badge(props: React.ComponentProps<"span">) {
  return <span {...props} className="inline-flex rounded-full border border-[#aaa3ff]/25 bg-[#aaa3ff]/10 px-2.5 py-1 text-xs font-medium text-[#d4d0ff]" />;
}
