import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-4 top-4 rounded-2xl bg-sand p-3 text-ink">{icon}</div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-2 max-w-[20rem] text-sm text-slate-500">{hint}</p>
    </Card>
  );
}
