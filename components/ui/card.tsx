import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[#eadacc] bg-white p-5 shadow-sm transition-colors dark:border-white/10 dark:bg-[#182638]",
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
    <div className="mb-5 flex flex-col gap-3 border-b border-[#eadacc] pb-4 dark:border-white/10 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
