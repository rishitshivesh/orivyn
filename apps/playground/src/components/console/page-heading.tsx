import type { ReactNode } from "react";

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.22em] text-[#a8a9ff]">{eyebrow}</p>
        <h1 className="text-[30px] font-semibold tracking-[-.055em] text-white md:text-[38px]">{title}</h1>
        <p className="mt-2 max-w-xl text-[13px] leading-6 text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  );
}
