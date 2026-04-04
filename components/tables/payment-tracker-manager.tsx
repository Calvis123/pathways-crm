"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type StatusFilter = "all" | "pending" | "partial" | "paid";

type TrackerStudent = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string;
  university_name: string | null;
  payment_amount: number;
  payment_paid: number;
  balance_due: number;
  days_since_approval: number;
  payment_status: string;
  payment_date: string | null;
};

function getRowClass(days: number) {
  if (days >= 15) return "border-l-4 border-l-rose-500";
  if (days >= 7) return "border-l-4 border-l-amber-500";
  return "border-l-4 border-l-emerald-500";
}

function getRowLabel(days: number) {
  if (days >= 15) return { label: "15+ days", tone: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200" };
  if (days >= 7) return { label: "7-14 days", tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200" };
  return { label: "0-6 days", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200" };
}

export function PaymentTrackerManager({
  statusFilter,
  universityFilter,
  stats,
  students
}: {
  statusFilter: StatusFilter;
  universityFilter: string;
  stats: {
    totalOutstanding: number;
    collectedThisMonth: number;
    overdueCount: number;
    collectionRate: number;
  };
  students: TrackerStudent[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [university, setUniversity] = useState(universityFilter);
  const [modal, setModal] = useState<{
    studentId: string;
    studentName: string;
    balance: number;
  } | null>(null);
  const [form, setForm] = useState({
    payment_type: "Consultation Balance" as "Consultation Balance" | "Consultation Upfront" | "IELTS Fee",
    amount_paid: "",
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "" as "" | "mpesa" | "bank" | "cash" | "card",
    payment_notes: ""
  });

  const csvContent = useMemo(() => {
    const header = [
      "Name",
      "Phone",
      "Email",
      "University",
      "Amount",
      "Paid",
      "Balance",
      "Days Since Approval",
      "Status",
      "Payment Date"
    ];
    const rows = students.map((student) =>
      [
        student.full_name,
        student.phone ?? "",
        student.email,
        student.university_name ?? "N/A",
        student.payment_amount,
        student.payment_paid,
        student.balance_due,
        student.days_since_approval,
        student.payment_status,
        student.payment_date ?? "N/A"
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    return [header.join(","), ...rows].join("\n");
  }, [students]);

  function applyFilters(nextStatus: StatusFilter, nextUniversity: string) {
    const params = new URLSearchParams();
    params.set("status", nextStatus);
    if (nextUniversity) {
      params.set("university", nextUniversity);
    }
    window.location.assign(`/payment-tracker?${params.toString()}`);
  }

  function exportCsv() {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payment-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function whatsappLink(student: TrackerStudent) {
    const balance = student.balance_due;
    const message =
      `Hello ${student.full_name}! 🎉\n\n` +
      `Congratulations on your visa approval! We're so excited for you as you prepare to study at ${student.university_name ?? "your university"}.\n\n` +
      `This is a friendly reminder about your outstanding balance payment:\n` +
      `• Amount Due: ${balance.toLocaleString("en-KE")} KES\n` +
      `• Days Since Approval: ${student.days_since_approval} days\n\n` +
      `Payment Methods:\n` +
      `• M-PESA: 0113043315 (Barak Pathways)\n` +
      `• Bank Transfer: [Account Details]\n\n` +
      `Please confirm once payment is done so we can update your records and continue with your pre-departure preparations.\n\n` +
      `If you have any questions or need assistance, feel free to reach out!\n\n` +
      `Best regards,\nAllan Kamau\nBarak Pathways\n+254 113 043 315`;

    let phone = (student.phone ?? "").replace(/\D/g, "");
    if (phone.startsWith("0")) {
      phone = `254${phone.slice(1)}`;
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  async function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch("/api/payment-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: modal.studentId,
          payment_type: form.payment_type,
          amount_paid: Number(form.amount_paid),
          payment_date: form.payment_date,
          payment_method: form.payment_method,
          payment_notes: form.payment_notes || null
        })
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Failed to record payment.");
        return;
      }

      setSuccess("Payment recorded successfully.");
      setModal(null);
      setForm((current) => ({
        ...current,
        amount_paid: "",
        payment_method: "",
        payment_notes: ""
      }));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-panel dark:border-white/10 dark:bg-[#0d1729]">
        <div className="flex flex-col gap-4 border-b border-gold/20 bg-[#0f172a] px-8 py-6 text-white dark:border-white/10 dark:bg-[linear-gradient(135deg,#09111f,#15223a)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-serif text-3xl">Payment Tracker</h1>
            <p className="mt-2 text-sm text-white/70">Track outstanding payments for visa-approved students.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-2xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Export CSV
            </button>
            <Link
              href="/"
              className="rounded-2xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Dashboard
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
            <StatCard label="Total Outstanding" value={`${Math.round(stats.totalOutstanding).toLocaleString("en-KE")} KES`} tone="blue" />
            <StatCard label="Collected This Month" value={`${Math.round(stats.collectedThisMonth).toLocaleString("en-KE")} KES`} tone="green" />
            <StatCard label="Overdue (15+ days)" value={String(stats.overdueCount)} tone="red" />
            <StatCard label="Collection Rate" value={`${stats.collectionRate.toFixed(1)}%`} tone="gold" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="font-serif text-xl text-ink dark:text-white">Payment Tracker (Visa Approved Students)</h2>
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white"
              >
                Export CSV
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {(["all", "pending", "partial", "paid"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => applyFilters(status, university)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${statusFilter === status ? "border-gold bg-gold text-ink dark:border-[#ffb89e] dark:bg-[#ff7a59] dark:text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-gold hover:text-gold dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:text-[#ffb89e]"}`}
                >
                  {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
              <input
                value={university}
                onChange={(event) => setUniversity(event.target.value)}
                onBlur={() => applyFilters(statusFilter, university)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyFilters(statusFilter, university);
                  }
                }}
                placeholder="Filter by university"
                className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
            {students.length === 0 ? (
              <div className="px-6 py-16 text-center text-slate-500 dark:text-slate-300">
                <div className="text-5xl text-gold/70">✓</div>
                <h3 className="mt-4 text-lg font-semibold text-ink dark:text-white">No Visa-Approved Students Found</h3>
                <p className="mt-2 text-sm">No students with visa approval match the current filters.</p>
              </div>
            ) : (
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-[#0f172a] text-left text-xs uppercase tracking-[0.08em] text-white">
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">University</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Paid</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Days Since Approval</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const badge = getRowLabel(student.days_since_approval);
                    return (
                      <tr key={student.id} className={`${getRowClass(student.days_since_approval)} hover:bg-gold/5 dark:hover:bg-white/[0.04]`}>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.tone}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink dark:text-white">{student.full_name}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{student.university_name ?? "N/A"}</td>
                        <td className="px-4 py-3 font-semibold dark:text-slate-100">{student.payment_amount.toLocaleString("en-KE")} KES</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">{student.payment_paid.toLocaleString("en-KE")} KES</td>
                        <td className="px-4 py-3 font-semibold text-rose-600">{student.balance_due.toLocaleString("en-KE")} KES</td>
                        <td className="px-4 py-3 font-semibold dark:text-slate-100">{student.days_since_approval} days</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={whatsappLink(student)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-xl bg-[#25d366] px-3 py-2 text-xs font-semibold text-white"
                            >
                              Remind
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setModal({
                                  studentId: student.id,
                                  studentName: student.full_name,
                                  balance: student.balance_due
                                });
                                setForm((current) => ({
                                  ...current,
                                  amount_paid: String(student.balance_due)
                                }));
                              }}
                              className="inline-flex rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                            >
                              Mark Paid
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-[#0f1b31]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-ink dark:text-white">Record Payment</h2>
              <button type="button" onClick={() => setModal(null)} className="text-2xl text-slate-400 dark:text-slate-500">
                ×
              </button>
            </div>
            <form className="space-y-4" onSubmit={submitPayment}>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-ink dark:text-white">Student</span>
                <input value={modal.studentName} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white" />
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-ink dark:text-white">Amount Paid (KES)</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="100"
                  value={form.amount_paid}
                  onChange={(event) => setForm((current) => ({ ...current, amount_paid: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                />
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-ink dark:text-white">Payment Date</span>
                <input
                  type="date"
                  required
                  value={form.payment_date}
                  onChange={(event) => setForm((current) => ({ ...current, payment_date: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:[color-scheme:dark]"
                />
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-ink dark:text-white">Payment Method</span>
                <select
                  required
                  value={form.payment_method}
                  onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value as typeof current.payment_method }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                >
                  <option value="">Select method...</option>
                  <option value="mpesa">M-PESA</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                </select>
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-ink dark:text-white">Notes</span>
                <textarea
                  rows={3}
                  value={form.payment_notes}
                  onChange={(event) => setForm((current) => ({ ...current, payment_notes: event.target.value }))}
                  placeholder="Any additional notes..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-400"
                />
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                  Save Payment
                </button>
                <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "red" | "gold";
}) {
  const tones = {
    blue: "bg-sky-50 text-sky-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-rose-50 text-rose-600",
    gold: "bg-gold/15 text-gold"
  } as const;

  return (
    <div className="flex items-center gap-5 rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.05]">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold ${tones[tone]}`}>
        •
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-extrabold text-ink dark:text-white">{value}</p>
      </div>
    </div>
  );
}
