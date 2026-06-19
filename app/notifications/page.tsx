import type { Route } from "next";
import Link from "next/link";
import { Bell, CalendarClock, FileWarning, MessageCircleWarning, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { canAccessFinance, getCurrentSession } from "@/lib/auth";
import {
  getAuditLogs,
  getOpenTasks,
  getPendingDocuments,
  getStudents,
  getUpcomingConsultations,
  getUnreadPortalMessages
} from "@/lib/data";
import { getConsultationBalance } from "@/lib/finance";
import { formatCurrency, formatDate } from "@/lib/utils";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default async function NotificationsPage() {
  const [auditItems, consultations, pendingDocuments, unreadPortalMessages, taskAlerts, students, session] =
    await Promise.all([
      getAuditLogs(12),
      getUpcomingConsultations(6),
      getPendingDocuments(6),
      getUnreadPortalMessages(6),
      getOpenTasks(6),
      getStudents(),
      getCurrentSession()
    ]);
  const canSeeFinance = canAccessFinance(session?.role);

  const today = startOfToday();

  const consultationAlerts: Array<{
    id: string;
    title: string;
    subtitle: string;
    date: string;
    tone: "warning" | "info";
  }> = consultations.map((item) => ({
    id: item.id,
    title: `${item.student?.full_name ?? "Student"} consultation ${item.status}`,
    subtitle: item.student?.email ?? "No email recorded",
    date: item.scheduled_at,
    tone: item.status === "pending" ? "warning" : "info"
  }));

  const paymentAlerts = canSeeFinance ? students
    .map((student) => {
      const balance = getConsultationBalance(student);
      const overdue =
        student.payment_due_date &&
        new Date(`${student.payment_due_date}T00:00:00`).getTime() < today.getTime();

      return {
        id: student.id,
        full_name: student.full_name,
        balance,
        due_date: student.payment_due_date,
        overdue
      };
    })
    .filter((item) => item.balance > 0 && item.due_date)
    .sort((a, b) => Number(b.overdue) - Number(a.overdue))
    .slice(0, 6) : [];

  const totalAttentionItems =
    consultationAlerts.length +
    paymentAlerts.length +
    unreadPortalMessages.length +
    pendingDocuments.length +
    taskAlerts.length;

  return (
    <ModuleShell
      title="Notifications"
      description="A communications command center for outreach, follow-up, and items that need attention now."
    >
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-6">
          <Card className="border-[#e8d7c6] bg-[linear-gradient(135deg,#fffaf4_0%,#fff2e6_100%)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,122,89,0.12)_0%,rgba(15,23,42,0.94)_60%,rgba(9,17,31,0.98)_100%)]">
            <CardHeader
              title="Communication Inbox"
              description="The most important follow-up items across consultations, payments, messages, and documents."
            />
            <div className="grid gap-4 md:grid-cols-4">
              <SummaryStat label="Needs Attention" value={String(totalAttentionItems)} icon={<Bell className="h-4 w-4" />} />
              <SummaryStat label="Consultations" value={String(consultationAlerts.length)} icon={<CalendarClock className="h-4 w-4" />} />
              <SummaryStat label="Unread Messages" value={String(unreadPortalMessages.length)} icon={<MessageCircleWarning className="h-4 w-4" />} />
              {canSeeFinance ? <SummaryStat label="Payment Follow-up" value={String(paymentAlerts.length)} icon={<Wallet className="h-4 w-4" />} /> : null}
            </div>
          </Card>

          <NotificationSection
            title="Consultation Follow-up"
            description="Pending and confirmed consultations that need action."
            href="/consultations"
            empty="No consultation follow-up items right now."
          >
            {consultationAlerts.map((item) => (
              <AlertRow
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                meta={formatDate(item.date, { dateStyle: "medium", timeStyle: "short" })}
                tone={item.tone}
              />
            ))}
          </NotificationSection>

          {canSeeFinance ? (
          <NotificationSection
            title="Payment Follow-up"
            description="Students with outstanding balances and due dates."
            href="/payment-reminders"
            empty="No payment reminders are currently due."
          >
            {paymentAlerts.map((item) => (
              <AlertRow
                key={item.id}
                title={item.full_name}
                subtitle={`Outstanding balance: ${formatCurrency(item.balance)}`}
                meta={`Due ${formatDate(item.due_date ?? null)}`}
                tone={item.overdue ? "danger" : "warning"}
              />
            ))}
          </NotificationSection>
          ) : null}

          <NotificationSection
            title="Portal Messages"
            description="Student replies and unread portal communication."
            href="/portal-manager"
            empty="No unread student messages at the moment."
          >
            {unreadPortalMessages.map((item) => (
              <AlertRow
                key={item.id}
                title={item.subject}
                subtitle={item.student?.full_name ?? item.student_id}
                meta={formatDate(item.created_at, { dateStyle: "medium", timeStyle: "short" })}
                tone="info"
              />
            ))}
          </NotificationSection>
        </div>

        <div className="space-y-6">
          <NotificationSection
            title="Document Review Queue"
            description="Files still waiting for review or approval."
            href="/documents"
            empty="No pending documents right now."
          >
            {pendingDocuments.map((item) => (
              <AlertRow
                key={item.id}
                title={item.original_filename}
                subtitle={item.student?.full_name ?? item.student_id}
                meta={item.status.replace(/_/g, " ")}
                tone="warning"
              />
            ))}
          </NotificationSection>

          <NotificationSection
            title="Task Follow-up"
            description="Open tasks that still need action."
            href="/task-manager"
            empty="No open task reminders right now."
          >
            {taskAlerts.map((item) => (
              <AlertRow
                key={item.id}
                title={item.title}
                subtitle={item.description ?? "No extra description"}
                meta={item.due_date ? `Due ${formatDate(item.due_date ?? null)}` : "No due date"}
                tone={item.priority === "urgent" || item.priority === "high" ? "danger" : "info"}
              />
            ))}
          </NotificationSection>

          <Card className="dark:border-white/10 dark:bg-[#182638]">
            <CardHeader
              title="Recent Activity Feed"
              description="Latest CRM activity for context around your communication work."
            />
            <div className="space-y-3">
              {auditItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#f0dfd0] bg-[#fffaf5] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="font-medium text-ink dark:text-slate-50">{item.action}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
        </div>
      </div>
    </ModuleShell>
  );
}

function SummaryStat({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#eadfd0] bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.06]">
      <div className="flex items-center gap-2 text-[#c9692c] dark:text-[#ffbeab]">{icon}</div>
      <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function NotificationSection({
  title,
  description,
  href,
  empty,
  children
}: {
  title: string;
  description: string;
  href: Route;
  empty: string;
  children: ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        action={
          <Link
            href={href}
            className="inline-flex items-center rounded-xl border border-[#eadacc] px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#fff6ef] dark:border-white/10 dark:text-slate-100 dark:hover:bg-white/10"
          >
            Open
          </Link>
        }
      />
      <div className="space-y-3">
        {hasChildren ? children : <div className="rounded-2xl border border-dashed border-[#d9c6b8] px-4 py-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">{empty}</div>}
      </div>
    </Card>
  );
}

function AlertRow({
  title,
  subtitle,
  meta,
  tone
}: {
  title: string;
  subtitle: string;
  meta: string;
  tone: "info" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-400/20 dark:text-rose-200"
      : tone === "warning"
        ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-300/20 dark:text-amber-200"
        : "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-500/10 dark:border-sky-300/20 dark:text-sky-200";

  const metaIcon =
    tone === "danger" ? <FileWarning className="h-4 w-4" /> : <Bell className="h-4 w-4" />;

  return (
    <div className="rounded-2xl border border-[#f0dfd0] bg-[#fffaf5] p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink dark:text-slate-50">{title}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>
          {metaIcon}
          {meta}
        </span>
      </div>
    </div>
  );
}
