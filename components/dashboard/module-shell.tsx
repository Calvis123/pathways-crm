import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/card";

export function ModuleShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-panel transition-colors dark:border-white/10 dark:bg-[#0d1729] dark:shadow-[0_22px_70px_rgba(2,6,23,0.32)]">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(198,155,59,0.14),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,243,234,0.9))] p-8 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(255,122,89,0.18),transparent_24%),linear-gradient(135deg,rgba(9,17,31,0.98),rgba(15,23,42,0.96))]">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold dark:text-[#ffbeab]">Barak CRM</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink dark:text-slate-50">{title}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
        <div className="grid gap-4 px-8 py-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Purpose</p>
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">Operational CRM area for focused team execution</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Design</p>
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">Unified CRM look with stronger hierarchy and calmer surfaces</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">State</p>
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">Connected to live workflow data instead of placeholder scaffolding</p>
          </div>
        </div>
      </section>
      {children ? (
        children
      ) : (
        <Card>
          <CardHeader title="In Progress" description="This CRM section is now linked from the sidebar and ready for the next module pass." />
        </Card>
      )}
    </div>
  );
}
