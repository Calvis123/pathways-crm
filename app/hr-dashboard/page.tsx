import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Banknote,
  Bell,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Users2
} from "lucide-react";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { HrSectionNav } from "@/components/hr/hr-section-nav";
import { Card, CardHeader } from "@/components/ui/card";
import {
  getAuditLogs,
  getCommissions,
  getConsultations,
  getDocuments,
  getPayments,
  getPortalMessages,
  getReferrals,
  getStudents,
  getTasks,
  getUsers
} from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function HrDashboardPage() {
  const [students, users, consultations, documents, payments, commissions, referrals, tasks, messages, auditLogs] =
    await Promise.all([
      getStudents(),
      getUsers(),
      getConsultations(),
      getDocuments(),
      getPayments(),
      getCommissions(),
      getReferrals(),
      getTasks(),
      getPortalMessages(),
      getAuditLogs(30)
    ]);

  const activeUsers = users.filter((user) => user.status === "active");
  const placedStudents = students.filter((student) => ["placed", "employment"].includes(student.stage));
  const openConsultations = consultations.filter((item) => ["pending", "confirmed"].includes(item.status));
  const pendingDocuments = documents.filter((item) => ["pending", "uploaded", "under_review"].includes(item.status));
  const openTasks = tasks.filter((item) => !["completed", "cancelled"].includes(item.status));
  const unreadMessages = messages.filter((item) => item.direction === "student_to_crm" && !item.is_read);
  const pendingPayments = payments.filter((item) => item.status !== "paid");
  const overdueCommissions = commissions.filter((item) => item.status === "overdue");
  const totalCollected = payments
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + item.amount, 0);
  const pendingValue = pendingPayments.reduce((sum, item) => sum + item.amount, 0);

  const roleCounts = users.reduce<Record<string, number>>((counts, user) => {
    counts[user.role] = (counts[user.role] ?? 0) + 1;
    return counts;
  }, {});

  const teamWorkload = users
    .map((user) => ({
      user,
      students: students.filter((student) => student.created_by === user.username).length,
      tasks: openTasks.filter((task) => task.assigned_to === user.username).length
    }))
    .sort((a, b) => b.students + b.tasks - (a.students + a.tasks))
    .slice(0, 6);

  const alerts: Array<{ title: string; value: number; href: Route; tone: "warning" | "good" }> = [
    {
      title: "Documents waiting",
      value: pendingDocuments.length,
      href: "/hr-dashboard/operations",
      tone: pendingDocuments.length > 0 ? "warning" : "good"
    },
    {
      title: "Unread student replies",
      value: unreadMessages.length,
      href: "/hr-dashboard/operations",
      tone: unreadMessages.length > 0 ? "warning" : "good"
    },
    {
      title: "Overdue commissions",
      value: overdueCommissions.length,
      href: "/hr-dashboard/operations",
      tone: overdueCommissions.length > 0 ? "warning" : "good"
    },
    {
      title: "Open team tasks",
      value: openTasks.length,
      href: "/hr-dashboard/team",
      tone: openTasks.length > 8 ? "warning" : "good"
    }
  ];

  return (
    <ModuleShell
      title="HR Dashboard"
      description="A system-wide oversight dashboard for team activity, student operations, queues, finance exposure, and recent CRM actions."
    >
      <div className="space-y-6">
        <HrSectionNav />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Active Team"
            value={activeUsers.length.toString()}
            detail={`${users.length} total user profiles`}
            icon={<Users2 className="h-4 w-4" />}
          />
          <MetricCard
            label="Students"
            value={students.length.toString()}
            detail={`${placedStudents.length} placed or in employment`}
            icon={<GraduationCap className="h-4 w-4" />}
          />
          <MetricCard
            label="Open Queues"
            value={(openConsultations.length + pendingDocuments.length + unreadMessages.length).toString()}
            detail="Consultations, documents, portal replies"
            icon={<Bell className="h-4 w-4" />}
          />
          <MetricCard
            label="Collected"
            value={formatCurrency(totalCollected)}
            detail={`${formatCurrency(pendingValue)} still pending`}
            icon={<Banknote className="h-4 w-4" />}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="dark:border-white/10 dark:bg-[#0d1729]">
            <CardHeader
              title="Oversight Alerts"
              description="The fastest read on areas that need HR or leadership attention."
            />
            <div className="grid gap-4 md:grid-cols-2">
              {alerts.map((alert) => (
                <Link
                  key={alert.title}
                  href={alert.href}
                  className={`rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(33,51,67,0.08)] ${
                    alert.tone === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{alert.title}</p>
                    {alert.tone === "warning" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </div>
                  <p className="mt-4 text-3xl font-semibold">{alert.value}</p>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="dark:border-white/10 dark:bg-[#0d1729]">
            <CardHeader title="Team Coverage" description="User distribution by role and active status." />
            <div className="space-y-3">
              {Object.entries(roleCounts).map(([role, count]) => (
                <div
                  key={role}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]"
                >
                  <span className="capitalize text-slate-600 dark:text-slate-300">{role.replace(/_/g, " ")}</span>
                  <span className="font-semibold text-ink dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2 dark:border-white/10 dark:bg-[#0d1729]">
            <CardHeader
              title="Team Workload"
              description="Assigned student ownership and task load across active users."
            />
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-[0.14em] text-slate-400 dark:border-white/10">
                    <th className="px-3 py-3">Team Member</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Students</th>
                    <th className="px-3 py-3">Open Tasks</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teamWorkload.map(({ user, students: studentCount, tasks: taskCount }) => (
                    <tr key={user.id} className="border-b border-slate-100 dark:border-white/10">
                      <td className="px-3 py-4 font-medium text-ink dark:text-white">{user.full_name}</td>
                      <td className="px-3 py-4 capitalize text-slate-500 dark:text-slate-300">{user.role.replace(/_/g, " ")}</td>
                      <td className="px-3 py-4 text-slate-600 dark:text-slate-300">{studentCount}</td>
                      <td className="px-3 py-4 text-slate-600 dark:text-slate-300">{taskCount}</td>
                      <td className="px-3 py-4">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="dark:border-white/10 dark:bg-[#0d1729]">
            <CardHeader title="Quick Oversight" description="Jump into the main areas HR will monitor." />
            <div className="space-y-2">
              <QuickLink href="/hr-dashboard/team" label="Team & Roles" icon={<Users2 className="h-4 w-4" />} />
              <QuickLink href="/hr-dashboard/operations" label="Operations Oversight" icon={<ClipboardList className="h-4 w-4" />} />
              <QuickLink href="/hr-dashboard/activity" label="Activity & Compliance" icon={<Activity className="h-4 w-4" />} />
            </div>
          </Card>
        </div>

        <Card className="dark:border-white/10 dark:bg-[#0d1729]">
          <CardHeader title="Recent CRM Activity" description="Latest audit records across the system." />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {auditLogs.slice(0, 9).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.05]"
              >
                <p className="font-medium text-ink dark:text-white">{item.action}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{item.record_label ?? item.table_name}</p>
                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                  {formatDate(item.created_at, { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Referrals" value={referrals.length} />
          <MiniStat label="Consultations" value={consultations.length} />
          <MiniStat label="Payments" value={payments.length} />
          <MiniStat label="Audit Events Reviewed" value={auditLogs.length} />
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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_36px_rgba(33,51,67,0.07)] dark:border-white/10 dark:bg-[#0d1729]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#173042] text-white dark:bg-[#ff7a59]/15 dark:text-[#ffbeab]">
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-ink dark:text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{detail}</p>
    </div>
  );
}

function QuickLink({ href, label, icon }: { href: Route; label: string; icon: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm font-medium text-ink transition hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.08]"
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-slate-400">Open</span>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#0d1729]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">{value}</p>
    </div>
  );
}
