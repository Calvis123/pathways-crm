import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

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
      <section className="overflow-hidden rounded-xl border border-[#eadacc] bg-white shadow-[0_18px_50px_rgba(120,75,42,0.1)] transition-colors dark:border-white/10 dark:bg-[#182638]">
        <div className="flex flex-col gap-5 border-b border-[#eadacc] bg-[linear-gradient(135deg,#fffaf5_0%,#fff1e6_58%,#ffe0c8_100%)] px-5 py-6 dark:border-white/10 dark:bg-[#182638] lg:flex-row lg:items-start lg:justify-between lg:px-7">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md border border-[#eadacc] bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#8b5e3c] shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-[#c9692c]" />
              Workspace
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#213343] dark:text-slate-50 lg:text-4xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f7182] dark:text-slate-300">{description}</p>
          </div>
        </div>
        <div className="grid gap-3 bg-[#fff6ef] px-5 py-4 dark:bg-white/[0.03] sm:grid-cols-3 lg:px-6">
          {["Operational", "Role-aware", "Live data"].map((label) => (
            <div key={label} className="rounded-lg border border-[#eadacc] bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-sm font-semibold text-[#213343] dark:text-slate-200">{label}</p>
            </div>
          ))}
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
