import { ModuleShell } from "@/components/dashboard/module-shell";
import { HrSectionNav } from "@/components/hr/hr-section-nav";
import { Card, CardHeader } from "@/components/ui/card";
import { getAuditLogs, getUsers } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function HrActivityPage() {
  const [auditLogs, users] = await Promise.all([getAuditLogs(100), getUsers()]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 7);

  const actionsToday = auditLogs.filter((item) => new Date(item.created_at) >= todayStart);
  const actionsThisWeek = auditLogs.filter((item) => new Date(item.created_at) >= weekStart);
  const activeUsers = users.filter((user) => user.status === "active");

  const actorCounts = Array.from(
    auditLogs.reduce((map, item) => {
      const actor = item.actor_name ?? "System";
      map.set(actor, (map.get(actor) ?? 0) + 1);
      return map;
    }, new Map<string, number>())
  )
    .map(([actor, count]) => ({ actor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <ModuleShell
      title="Activity & Compliance"
      description="HR accountability view for recent CRM actions, audit coverage, and team activity signals."
    >
      <div className="space-y-6">
        <HrSectionNav />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat label="Actions Today" value={actionsToday.length} />
          <Stat label="Actions This Week" value={actionsThisWeek.length} />
          <Stat label="Audit Events Loaded" value={auditLogs.length} />
          <Stat label="Active Users" value={activeUsers.length} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card className="dark:border-white/10 dark:bg-[#0d1729]">
            <CardHeader title="Most Active Actors" description="Recent audit activity by actor." />
            <div className="space-y-3">
              {actorCounts.map((item) => (
                <div key={item.actor} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]">
                  <span className="font-medium text-ink dark:text-white">{item.actor}</span>
                  <span className="rounded-full bg-[#173042] px-3 py-1 text-xs font-semibold text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="dark:border-white/10 dark:bg-[#0d1729]">
            <CardHeader title="Recent Audit Trail" description="Latest system actions recorded by the CRM." />
            <div className="space-y-3">
              {auditLogs.slice(0, 18).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium text-ink dark:text-white">{item.action}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                        {item.record_label ?? item.table_name}
                        {item.actor_name ? ` - ${item.actor_name}` : ""}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {formatDate(item.created_at, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </ModuleShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0d1729]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-ink dark:text-white">{value}</p>
    </div>
  );
}
