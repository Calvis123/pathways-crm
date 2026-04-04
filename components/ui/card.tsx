import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-white/60 bg-white/90 p-6 shadow-panel backdrop-blur transition-colors dark:border-white/10 dark:bg-[#0f1b31]/88 dark:shadow-[0_20px_60px_rgba(2,6,23,0.34)]",
        className
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-white/10 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-ink dark:text-slate-50">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
