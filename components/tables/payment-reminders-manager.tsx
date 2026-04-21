"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkmarkCircleOutline } from "ionicons/icons";
import { IonIcon } from "@/components/ui/ion-icon";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Student } from "@/lib/types";

type ReminderStudent = Student & {
  balance: number;
  days_since_created: number;
  days_overdue: number;
  reminder_category: "critical" | "warning" | "upcoming" | "current";
};

type ReminderCategory = {
  key: "critical" | "warning" | "upcoming" | "current";
  name: string;
  color: string;
  icon: string;
  students: ReminderStudent[];
};

const headerTones: Record<ReminderCategory["key"], string> = {
  critical: "bg-gold/20 text-ink border-b border-gold dark:bg-[#ff7a59]/15 dark:text-[#ffd5c8] dark:border-[#ff7a59]/40",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-100",
  upcoming: "bg-yellow-100 text-yellow-900 dark:bg-yellow-500/15 dark:text-yellow-100",
  current: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100"
};

export function PaymentRemindersManager({
  totalOutstanding,
  totalStudents,
  criticalCount,
  attentionCount,
  categories
}: {
  totalOutstanding: number;
  totalStudents: number;
  criticalCount: number;
  attentionCount: number;
  categories: ReminderCategory[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const visibleStudents = useMemo(
    () => categories.flatMap((category) => category.students.map((student) => student.id)),
    [categories]
  );

  function getSelected() {
    return selectedIds;
  }

  function toggleStudent(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function dayBadge(student: ReminderStudent) {
    if (student.days_overdue > 0) {
      return {
        label: `${Math.abs(student.days_overdue)} days overdue`,
        tone:
          student.reminder_category === "critical"
            ? "bg-rose-100 text-rose-800"
            : "bg-amber-100 text-amber-800"
      };
    }

    return {
      label: `${student.days_since_created} days ago`,
      tone: "bg-slate-100 text-slate-700"
    };
  }

  async function sendReminder(studentId: string, method: "whatsapp" | "sms") {
    setError(null);
    setSuccess(null);

    if (!window.confirm(`Send payment reminder via ${method}?`)) {
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/payment-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_reminder",
          student_id: studentId,
          method
        })
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; link?: string; message?: string }
        | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to send reminder.");
        return;
      }

      if (data?.link) {
        window.open(data.link, "_blank", "noopener,noreferrer");
      }

      setSuccess("Reminder sent successfully.");
      router.refresh();
    });
  }

  async function bulkSend(method: "whatsapp" | "sms") {
    const studentIds = getSelected();

    if (studentIds.length === 0) {
      setError("Please select at least one student.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch("/api/payment-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_send",
          student_ids: studentIds,
          method
        })
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; queued?: number }
        | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to queue reminders.");
        return;
      }

      setSuccess(`Queued ${data?.queued ?? studentIds.length} reminders.`);
      setSelectedIds([]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-panel dark:border-white/10 dark:bg-[#0d1729]">
        <div className="border-b border-gold/20 bg-[#0f172a] px-8 py-6 text-white dark:border-white/10 dark:bg-[linear-gradient(135deg,#09111f,#15223a)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-serif text-3xl">Payment Reminders</h1>
              <p className="mt-2 text-sm text-white/70">
                Automated WhatsApp and SMS follow-up for overdue or pending consultation balances.
              </p>
            </div>
            <Link
              href="/revenue-forecast"
              className="inline-flex rounded-2xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Revenue Forecast
            </Link>
          </div>
        </div>

        <div className="space-y-6 px-8 py-8">
          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              {success}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.05]">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Outstanding</p>
              <p className="mt-3 text-3xl font-semibold text-rose-600">{formatCurrency(totalOutstanding)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.05]">
              <p className="text-sm text-slate-500 dark:text-slate-400">Students with Balance</p>
              <p className="mt-3 text-3xl font-semibold text-ink dark:text-white">{totalStudents}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.05]">
              <p className="text-sm text-slate-500 dark:text-slate-400">Critical Overdue</p>
              <p className="mt-3 text-3xl font-semibold text-rose-600">{criticalCount}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.05]">
              <p className="text-sm text-slate-500 dark:text-slate-400">Needs Attention</p>
              <p className="mt-3 text-3xl font-semibold text-amber-600">{attentionCount}</p>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-white/[0.05]">
              <div className="text-5xl">✅</div>
              <h3 className="mt-4 font-serif text-2xl text-emerald-700">All caught up!</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">No students with outstanding balances.</p>
            </div>
          ) : null}

          {categories.map((category) => (
            <section
              key={category.key}
              className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f1b31]"
            >
              <div className={`flex items-center justify-between px-5 py-4 ${headerTones[category.key]}`}>
                <h3 className="flex items-center gap-2 font-serif text-lg">
                  <IonIcon icon={category.icon} className="h-5 w-5" />
                  {category.name}
                </h3>
                <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-semibold">
                  {category.students.length} students
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {category.students.map((student) => {
                  const badge = dayBadge(student);
                  return (
                    <div
                      key={student.id}
                      className="grid gap-4 px-5 py-4 transition hover:bg-gold/5 lg:grid-cols-[52px_minmax(220px,1fr)_140px_150px_150px_140px] lg:items-center"
                    >
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(student.id)}
                          onChange={() => toggleStudent(student.id)}
                          className="h-4 w-4 accent-gold"
                        />
                      </label>

                      <div>
                        <p className="font-semibold text-ink">{student.full_name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {student.email} {student.phone ? `• ${student.phone}` : ""}
                        </p>
                      </div>

                      <div className="text-sm font-semibold text-rose-600">
                        {formatCurrency(student.balance)}
                      </div>

                      <div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.tone}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div className="text-sm text-slate-500">
                        {student.payment_due_date ? `Due: ${formatDate(student.payment_due_date)}` : "No due date set"}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => void sendReminder(student.id, "whatsapp")}
                          className="inline-flex rounded-xl bg-[#25d366] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#20bd5a] disabled:opacity-60"
                        >
                          WhatsApp
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => void sendReminder(student.id, "sms")}
                          className="inline-flex rounded-xl bg-ocean px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
                        >
                          SMS
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      {selectedIds.length > 0 ? (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-gold bg-[#0f172a] px-5 py-4 text-white shadow-2xl">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => void bulkSend("whatsapp")}
            className="rounded-xl bg-[#25d366] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Send WhatsApp
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => void bulkSend("sms")}
            className="rounded-xl bg-ocean px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Send SMS
          </button>
        </div>
      ) : null}
    </div>
  );
}
