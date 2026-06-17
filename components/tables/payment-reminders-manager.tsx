"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
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

const ITEMS_PER_PAGE = 10;

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
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<ReminderCategory["key"]>("critical");
  const [page, setPage] = useState(0);

  const selectedCategory = categories.find((category) => category.key === selectedCategoryKey) ?? categories[0];
  const pageCount = Math.max(1, Math.ceil((selectedCategory?.students.length ?? 0) / ITEMS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageStudents = selectedCategory
    ? selectedCategory.students.slice(safePage * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE + ITEMS_PER_PAGE)
    : [];

  useEffect(() => {
    if (categories.length > 0 && !categories.some((category) => category.key === selectedCategoryKey)) {
      setSelectedCategoryKey(categories[0].key);
    }
  }, [categories, selectedCategoryKey]);

  useEffect(() => {
    setPage(0);
  }, [selectedCategoryKey]);

  function toggleStudent(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function dayBadge(student: ReminderStudent) {
    if (student.days_overdue > 0) {
      return {
        label: `${Math.abs(student.days_overdue)} days overdue`,
        tone: student.reminder_category === "critical" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
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

    if (!window.confirm(`Send payment reminder via ${method}?`)) return;

    startTransition(async () => {
      const response = await fetch("/api/payment-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_reminder", student_id: studentId, method })
      });

      const data = (await response.json().catch(() => null)) as { error?: string; link?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to send reminder.");
        return;
      }

      if (data?.link) window.open(data.link, "_blank", "noopener,noreferrer");
      setSuccess("Reminder sent successfully.");
      router.refresh();
    });
  }

  async function bulkSend(method: "whatsapp" | "sms") {
    if (selectedIds.length === 0) {
      setError("Please select at least one student.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch("/api/payment-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_send", student_ids: selectedIds, method })
      });

      const data = (await response.json().catch(() => null)) as { error?: string; queued?: number } | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to queue reminders.");
        return;
      }

      setSuccess(`Queued ${data?.queued ?? selectedIds.length} reminders.`);
      setSelectedIds([]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#eadacc] bg-white shadow-panel dark:border-white/10 dark:bg-[#182638]">
        <div className="border-b border-gold/20 bg-[linear-gradient(135deg,#213343,#3f5a68)] px-8 py-6 text-white dark:border-white/10">
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
            {[
              { label: "Total Outstanding", value: formatCurrency(totalOutstanding), tone: "text-rose-600" },
              { label: "Students with Balance", value: totalStudents, tone: "text-ink dark:text-white" },
              { label: "Critical Overdue", value: criticalCount, tone: "text-rose-600" },
              { label: "Needs Attention", value: attentionCount, tone: "text-amber-600" }
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#eadacc] bg-white p-5 dark:border-white/10 dark:bg-white/[0.05]">
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className={`mt-3 text-3xl font-semibold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {categories.length === 0 ? (
            <div className="rounded-xl border border-[#eadacc] bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-white/[0.05]">
              <IonIcon icon={checkmarkCircleOutline} className="mx-auto h-12 w-12 text-emerald-600" />
              <h3 className="mt-4 font-serif text-2xl text-emerald-700">All caught up</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">No students with outstanding balances.</p>
            </div>
          ) : null}

          {selectedCategory ? (
            <>
              <section className="rounded-xl border border-[#eadacc] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-ink dark:text-white">Reminder Categories</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                      Select one category and work through up to 10 students per page.
                    </p>
                  </div>
                  <select
                    value={selectedCategoryKey}
                    onChange={(event) => setSelectedCategoryKey(event.target.value as ReminderCategory["key"])}
                    className="h-11 rounded-lg border border-[#eadacc] bg-white px-3 text-sm font-semibold text-ink shadow-sm outline-none transition focus:border-[#ff9a77] focus:ring-4 focus:ring-[#ff7a59]/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                  >
                    {categories.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.name} ({category.students.length})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {categories.map((category) => (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => setSelectedCategoryKey(category.key)}
                      className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        selectedCategoryKey === category.key
                          ? "border-[#213343] bg-[#213343] text-white"
                          : "border-[#eadacc] bg-[#fffaf5] text-[#5f7182] hover:bg-[#fff1e6] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                      }`}
                    >
                      {category.name} {category.students.length}
                    </button>
                  ))}
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-[#eadacc] bg-white shadow-sm dark:border-white/10 dark:bg-[#182638]">
                <div className={`flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between ${headerTones[selectedCategory.key]}`}>
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em]">
                      <IonIcon icon={selectedCategory.icon} className="h-5 w-5" />
                      {selectedCategory.name} Records
                    </h3>
                    <p className="mt-1 text-sm opacity-80">
                      {selectedCategory.students.length === 0
                        ? "No students in this category"
                        : `Showing ${safePage * ITEMS_PER_PAGE + 1}-${Math.min((safePage + 1) * ITEMS_PER_PAGE, selectedCategory.students.length)} of ${selectedCategory.students.length}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(0, current - 1))}
                      disabled={safePage === 0}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 bg-white/80 text-[#213343] shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Previous ${selectedCategory.name} page`}
                    >
                      &lsaquo;
                    </button>
                    <span className="rounded-lg border border-black/10 bg-white/80 px-3 py-2 text-sm font-semibold text-[#213343] shadow-sm">
                      {safePage + 1} / {pageCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                      disabled={safePage >= pageCount - 1}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 bg-white/80 text-[#213343] shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Next ${selectedCategory.name} page`}
                    >
                      &rsaquo;
                    </button>
                  </div>
                </div>

                <div className="hidden grid-cols-[52px_minmax(240px,1fr)_150px_160px_170px_150px] gap-4 border-b border-[#eadacc] bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#8b5e3c] lg:grid dark:border-white/10 dark:bg-white/[0.03]">
                  <div />
                  <div>Student</div>
                  <div>Balance</div>
                  <div>Status</div>
                  <div>Due Date</div>
                  <div>Actions</div>
                </div>

                <div className="divide-y divide-[#f0dfd0] dark:divide-white/10">
                  {pageStudents.map((student) => {
                    const badge = dayBadge(student);
                    return (
                      <div
                        key={student.id}
                        className="grid gap-4 px-5 py-4 transition hover:bg-[#fffaf5] lg:grid-cols-[52px_minmax(240px,1fr)_150px_160px_170px_150px] lg:items-center dark:hover:bg-white/[0.04]"
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
                          <Link href={`/students/${student.id}`} className="font-semibold text-ink underline-offset-4 hover:underline dark:text-white">
                            {student.full_name}
                          </Link>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                            {student.email} {student.phone ? `| ${student.phone}` : ""}
                          </p>
                        </div>
                        <div className="text-sm font-semibold text-rose-600">{formatCurrency(student.balance)}</div>
                        <div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.tone}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-300">
                          {student.payment_due_date ? `Due: ${formatDate(student.payment_due_date)}` : "No due date set"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => void sendReminder(student.id, "whatsapp")}
                            className="inline-flex rounded-lg bg-[#25d366] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#20bd5a] disabled:opacity-60"
                          >
                            WhatsApp
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => void sendReminder(student.id, "sms")}
                            className="inline-flex rounded-lg bg-ocean px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
                          >
                            SMS
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </section>

      {selectedIds.length > 0 ? (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-gold bg-[linear-gradient(135deg,#213343,#3f5a68)] px-5 py-4 text-white shadow-2xl">
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
