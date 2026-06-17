import type { ReactNode } from "react";
import { Activity, AlertTriangle, Bell, CheckCircle2, Clock3, FolderClock, Server, Users2 } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { Card, CardHeader } from "@/components/ui/card";
import {
  getAuditLogs,
  getConsultations,
  getDocuments,
  getPortalMessages,
  getStudents,
  getTasks,
  getUsers
} from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function SystemMonitorPage() {
  const [users, students, consultations, documents, tasks, portalMessages, auditLogs] = await Promise.all([
    getUsers(),
    getStudents(),
    getConsultations(),
    getDocuments(),
    getTasks(),
    getPortalMessages(),
    getAuditLogs(40)
  ]);

  const activeUsers = users.filter((user) => user.status === "active");
  const inactiveUsers = users.filter((user) => user.status === "inactive");
  const unreadMessages = portalMessages.filter(
    (message) => message.direction === "student_to_crm" && !message.is_read
  );
  const pendingDocuments = documents.filter((document) =>
    ["pending", "under_review", "uploaded"].includes(document.status)
  );
  const openTasks = tasks.filter((task) => !["completed", "cancelled"].includes(task.status));
  const pendingConsultations = consultations.filter((consultation) =>
    ["pending", "confirmed"].includes(consultation.status)
  );
  const leadStudents = students.filter((student) => ["lead", "inquiry"].includes(student.stage));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 7);

  const actionsToday = auditLogs.filter((item) => new Date(item.created_at) >= todayStart);
  const actionsThisWeek = auditLogs.filter((item) => new Date(item.created_at) >= weekStart);

  const userActivity = new Map<string, { actor: string; count: number; latest: string }>();
  for (const item of auditLogs) {
    const actor = item.actor_name?.trim();
    if (!actor) continue;
    const current = userActivity.get(actor);
    if (!current) {
      userActivity.set(actor, { actor, count: 1, latest: item.created_at });
      continue;
    }
    current.count += 1;
    if (new Date(item.created_at) > new Date(current.latest)) {
      current.latest = item.created_at;
    }
  }

  const mostActiveUsers = Array.from(userActivity.values())
    .sort((a, b) => b.count - a.count || new Date(b.latest).getTime() - new Date(a.latest).getTime())
    .slice(0, 6);

  const alerts = [
    {
      tone: unreadMessages.length > 0 ? "warning" : "good",
      title: "Student inbox",
      body:
        unreadMessages.length > 0
          ? `${unreadMessages.length} unread portal message(s) need a reply.`
          : "No unread student portal messages right now."
    },
    {
      tone: pendingDocuments.length > 0 ? "warning" : "good",
      title: "Document review queue",
      body:
        pendingDocuments.length > 0
          ? `${pendingDocuments.length} document(s) are waiting for review or approval.`
          : "Document review queue is clear."
    },
    {
      tone: openTasks.length > 8 ? "warning" : "good",
      title: "Operations workload",
      body:
        openTasks.length > 0
          ? `${openTasks.length} open task(s) are active across the CRM.`
          : "No open operational tasks are currently pending."
    }
  ];

  return (
    <ModuleShell
      title="System Monitor"
      description="Admin visibility into usage, queues, team activity, and operational pressure across the Barak Pathways CRM."
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="border-[#e8d7c6] bg-[linear-gradient(135deg,#fffaf4_0%,#fff2e6_100%)] dark:border-white/10 dark:bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))]">
            <CardHeader
              title="Platform Health"
              description="A quick admin read on access, usage, and current workload."
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Active Users"
                value={String(activeUsers.length)}
                detail={`${inactiveUsers.length} inactive`}
                icon={<Users2 className="h-4 w-4" />}
              />
              <MetricCard
                label="Actions Today"
                value={String(actionsToday.length)}
                detail={`${actionsThisWeek.length} in 7 days`}
                icon={<Activity className="h-4 w-4" />}
              />
              <MetricCard
                label="Open Queues"
                value={String(unreadMessages.length + pendingDocuments.length + pendingConsultations.length)}
                detail="Messages, docs, consultations"
                icon={<Server className="h-4 w-4" />}
              />
              <MetricCard
                label="Open Tasks"
                value={String(openTasks.length)}
                detail={`${leadStudents.length} leads need progress`}
                icon={<Clock3 className="h-4 w-4" />}
              />
            </div>
          </Card>

          <Card className="dark:border-white/10 dark:bg-[#182638]">
            <CardHeader
              title="Operational Queues"
              description="The main work areas where response time and follow-through matter most."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <QueueCard
                title="Consultation Pipeline"
                value={pendingConsultations.length}
                detail="Pending or confirmed meetings still in motion"
                icon={<Bell className="h-4 w-4" />}
                tone="amber"
              />
              <QueueCard
                title="Document Reviews"
                value={pendingDocuments.length}
                detail="Files still waiting for admin or operations review"
                icon={<FolderClock className="h-4 w-4" />}
                tone="blue"
              />
              <QueueCard
                title="Student Messages"
                value={unreadMessages.length}
                detail="Unread portal replies from students"
                icon={<AlertTriangle className="h-4 w-4" />}
                tone="rose"
              />
              <QueueCard
                title="Task Backlog"
                value={openTasks.length}
                detail="Open task manager items still active"
                icon={<CheckCircle2 className="h-4 w-4" />}
                tone="emerald"
              />
            </div>
          </Card>

          <Card className="dark:border-white/10 dark:bg-[#182638]">
            <CardHeader
              title="Most Active Team Members"
              description="Recent CRM activity based on audit log volume."
            />
            <div className="space-y-3">
              {mostActiveUsers.length > 0 ? (
                mostActiveUsers.map((item, index) => (
                  <div
                    key={item.actor}
                    className="flex items-center justify-between rounded-2xl border border-[#f0dfd0] bg-[#fffaf5] px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]"
                  >
                    <div>
                      <p className="font-medium text-ink dark:text-white">
                        {index + 1}. {item.actor}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Latest activity {formatDate(item.latest, { timeStyle: "short" })}</p>
                    </div>
                    <span className="rounded-full bg-[#213343] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                      {item.count} actions
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState message="No recent user activity was found in the audit log." />
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="dark:border-white/10 dark:bg-[#182638]">
            <CardHeader
              title="Live Alerts"
              description="Short operational summaries for leadership and admin review."
            />
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.title}
                  className={`rounded-2xl border px-4 py-4 ${
                    alert.tone === "warning"
                      ? "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
                      : "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      alert.tone === "warning" ? "text-amber-800 dark:text-amber-100" : "text-emerald-800 dark:text-emerald-100"
                    }`}
                  >
                    {alert.title}
                  </p>
                  <p
                    className={`mt-1 text-sm leading-6 ${
                      alert.tone === "warning" ? "text-amber-700 dark:text-amber-200" : "text-emerald-700 dark:text-emerald-200"
                    }`}
                  >
                    {alert.body}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="dark:border-white/10 dark:bg-[#182638]">
            <CardHeader
              title="Recent System Activity"
              description="Latest actions recorded in the audit trail."
            />
            <div className="space-y-3">
              {auditLogs.slice(0, 10).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#f0dfd0] bg-[#fffaf5] p-4 dark:border-white/10 dark:bg-white/[0.05]">
                  <p className="font-medium text-ink dark:text-white">{item.action}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    {item.record_label ?? item.table_name}
                    {item.actor_name ? ` - ${item.actor_name}` : ""}
                  </p>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(item.created_at, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="dark:border-white/10 dark:bg-[#182638]">
            <CardHeader
              title="Coverage Snapshot"
              description="A quick picture of the current live records in the CRM."
            />
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <CoverageRow label="Students in CRM" value={students.length} />
              <CoverageRow label="Consultations scheduled" value={consultations.length} />
              <CoverageRow label="Documents stored" value={documents.length} />
              <CoverageRow label="Portal messages" value={portalMessages.length} />
              <CoverageRow label="Tasks created" value={tasks.length} />
              <CoverageRow label="Audit log entries reviewed" value={auditLogs.length} />
            </div>
          </Card>
        </div>
      </div>
    </ModuleShell>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#eadccd] bg-white/90 p-5 shadow-[0_18px_32px_rgba(33,51,67,0.08)] dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[0_18px_32px_rgba(2,6,23,0.2)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#213343] text-gold dark:bg-[#ff7a59]/15 dark:text-[#ffb89e]">{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-ink dark:text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{detail}</p>
    </div>
  );
}

function QueueCard({
  title,
  value,
  detail,
  icon,
  tone
}: {
  title: string;
  value: number;
  detail: string;
  icon: ReactNode;
  tone: "amber" | "blue" | "rose" | "emerald";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      : tone === "blue"
        ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
        : tone === "rose"
          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";

  return (
    <div className="rounded-xl border border-[#eadacc] bg-white p-5 dark:border-white/10 dark:bg-white/[0.05]">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink dark:text-white">{title}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${toneClass}`}>{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-ink dark:text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{detail}</p>
    </div>
  );
}

function CoverageRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#f0dfd0] bg-[#fffaf5] px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]">
      <span>{label}</span>
      <span className="font-semibold text-ink dark:text-white">{value}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#eadacc] bg-[#fffaf5] px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
      {message}
    </div>
  );
}
