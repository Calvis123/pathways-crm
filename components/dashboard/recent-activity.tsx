import { formatDate } from "@/lib/utils";
import type { AuditLog } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/card";

export function RecentActivity({ items }: { items: AuditLog[] }) {
  return (
    <Card>
      <CardHeader title="Audit Trail" description="Critical changes are logged here, similar to the legacy `audit_logs` module." />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-[#f0dfd0] bg-[#fffaf5] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-ink">{item.action}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.table_name}
                  {item.record_label ? ` · ${item.record_label}` : ""}
                </p>
              </div>
              <span className="text-xs text-slate-400">{formatDate(item.created_at, { timeStyle: "short" })}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
