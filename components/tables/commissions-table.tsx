"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type StatusFilter = "all" | "pending" | "paid" | "overdue";
type SortKey = "days_waiting" | "amount" | "name" | "due_date";

type CommissionRow = {
  id: string;
  full_name: string;
  commission_institution: string | null;
  enrollment_date: string | null;
  days_waiting: number;
  commission_due_date: string | null;
  commission_amount: number;
  commission_status: "pending" | "paid" | "overdue";
  commission_paid_date: string | null;
  phone: string | null;
  university_name: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function csvEscape(value: string | number | null) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function isOverdue(row: CommissionRow) {
  if (row.commission_status === "overdue") return true;
  if (row.commission_status === "paid") return false;
  return Boolean(row.commission_due_date && new Date(`${row.commission_due_date}T00:00:00`).getTime() < Date.now());
}

function statusBadge(row: CommissionRow) {
  if (row.commission_status === "paid") {
    return { label: "Paid", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200" };
  }
  if (isOverdue(row)) {
    return { label: "Overdue", tone: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200" };
  }
  return { label: "Pending", tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200" };
}

function rowTone(row: CommissionRow) {
  if (row.commission_status === "paid") return "border-l-4 border-l-emerald-500";
  if (row.days_waiting >= 365) return "border-l-4 border-l-rose-500";
  if (row.days_waiting >= 180) return "border-l-4 border-l-orange-500";
  return "border-l-4 border-l-emerald-500";
}

function generateEmailLink(row: CommissionRow) {
  const subject = `Commission Payment Follow-up - ${row.full_name}`;
  const body =
    `Dear ${row.commission_institution ?? "Partners"},\n\n` +
    `This is a follow-up regarding commission payment for ${row.full_name} who enrolled on ${row.enrollment_date ?? "N/A"}.\n\n` +
    `Student Details:\n` +
    `- Name: ${row.full_name}\n` +
    `- University: ${row.university_name ?? "N/A"}\n` +
    `- Commission Amount: ${Math.round(row.commission_amount).toLocaleString("en-KE")} KES\n` +
    `- Days Since Enrollment: ${row.days_waiting} days\n` +
    `${row.commission_due_date ? `- Due Date: ${row.commission_due_date}\n` : ""}\n` +
    `Could you kindly confirm the expected payment date?\n\n` +
    `Best regards,\nAllan Kamau\nDirector, Barak Pathways\nPhone: +254 113 043 315\nEmail: allank@barakpathways.com`;

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function CommissionsTable({
  rows,
  commissions,
  statusFilter = "all",
  institutionFilter = "",
  sortBy = "days_waiting"
}: {
  rows?: CommissionRow[];
  commissions?: Array<{
    id: string;
    student?: { full_name?: string; stage?: string } | undefined;
    student_id?: string;
    university_name?: string | null;
    commission_amount?: number;
    status?: "pending" | "paid" | "overdue" | "invoiced";
    due_date?: string | null;
    payment_date?: string | null;
    created_at?: string;
  }>;
  statusFilter?: StatusFilter;
  institutionFilter?: string;
  sortBy?: SortKey;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [institution, setInstitution] = useState(institutionFilter);
  const [modal, setModal] = useState<{ studentId: string; studentName: string } | null>(null);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const resolvedRows: CommissionRow[] = useMemo(() => {
    if (rows) return rows;
    if (!commissions) return [];

    return commissions.map((commission) => ({
      id: commission.id,
      full_name: commission.student?.full_name ?? commission.student_id ?? "Unknown Student",
      commission_institution: commission.university_name ?? null,
      enrollment_date: null,
      days_waiting: commission.created_at
        ? Math.max(
            0,
            Math.floor((Date.now() - new Date(commission.created_at).getTime()) / (24 * 60 * 60 * 1000))
          )
        : 0,
      commission_due_date: commission.due_date ?? null,
      commission_amount: commission.commission_amount ?? 140000,
      commission_status:
        commission.status === "invoiced" ? "pending" : commission.status ?? "pending",
      commission_paid_date: commission.payment_date ?? null,
      phone: null,
      university_name: commission.university_name ?? null
    }));
  }, [rows, commissions]);

  const institutions = useMemo(
    () =>
      Array.from(
        new Set(
          resolvedRows
            .map((row) => row.commission_institution)
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [resolvedRows]
  );

  const institutionBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; pending: number; paid: number; overdue: number }>();
    resolvedRows.forEach((row) => {
      const key = row.commission_institution ?? "Unknown";
      const current = map.get(key) ?? { count: 0, pending: 0, paid: 0, overdue: 0 };
      current.count += 1;
      if (row.commission_status === "paid") current.paid += row.commission_amount;
      else if (isOverdue(row)) current.overdue += row.commission_amount;
      else current.pending += row.commission_amount;
      map.set(key, current);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [resolvedRows]);

  const totalPending = resolvedRows
    .filter((row) => row.commission_status !== "paid" && !isOverdue(row))
    .reduce((sum, row) => sum + row.commission_amount, 0);
  const totalPaid = resolvedRows
    .filter((row) => row.commission_status === "paid")
    .reduce((sum, row) => sum + row.commission_amount, 0);
  const totalOverdue = resolvedRows
    .filter((row) => isOverdue(row))
    .reduce((sum, row) => sum + row.commission_amount, 0);
  const avgDaysWaiting =
    resolvedRows.length > 0
      ? Math.round(resolvedRows.reduce((sum, row) => sum + row.days_waiting, 0) / resolvedRows.length)
      : 0;
  const oldestPending = resolvedRows
    .filter((row) => row.commission_status !== "paid")
    .sort((a, b) => b.days_waiting - a.days_waiting)[0] ?? null;

  function applyFilters(next: { status: StatusFilter; institution: string; sort: SortKey }) {
    const params = new URLSearchParams();
    params.set("status", next.status);
    params.set("institution", next.institution || "all");
    params.set("sort", next.sort);
    window.location.assign(`/commissions?${params.toString()}`);
  }

  function exportCsv() {
    const header = [
      "Student Name",
      "Institution",
      "Enrollment Date",
      "Days Waiting",
      "Commission Amount",
      "Status",
      "Due Date",
      "Paid Date"
    ];
    const body = resolvedRows.map((row) =>
      [
        row.full_name,
        row.commission_institution ?? "N/A",
        row.enrollment_date ?? "N/A",
        row.days_waiting,
        row.commission_amount,
        row.commission_status,
        row.commission_due_date ?? "N/A",
        row.commission_paid_date ?? "N/A"
      ]
        .map(csvEscape)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `commission-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function markPaid(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch("/api/commissions/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: modal.studentId,
          paid_date: paidDate,
          notes: notes || null
        })
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Failed to update commission.");
        return;
      }

      setSuccess("Commission marked as paid successfully.");
      setModal(null);
      setNotes("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-panel dark:border-white/10 dark:bg-[#0d1729]">
        <div className="flex flex-col gap-4 border-b border-gold/20 bg-[#0f172a] px-8 py-6 text-white dark:border-white/10 dark:bg-[linear-gradient(135deg,#09111f,#15223a)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-serif text-3xl">Commission Tracker</h1>
            <p className="mt-2 text-sm text-white/70">Track institutional commission payments (140,000 KES per student).</p>
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
          {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">{success}</div> : null}
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</div> : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard label="Pending Commissions" value={`${Math.round(totalPending).toLocaleString("en-KE")} KES`} tone="text-amber-600" />
            <SummaryCard label="Paid Commissions" value={`${Math.round(totalPaid).toLocaleString("en-KE")} KES`} tone="text-emerald-600" />
            <SummaryCard label="Overdue Commissions" value={`${Math.round(totalOverdue).toLocaleString("en-KE")} KES`} tone="text-rose-600" />
            <SummaryCard label="Avg Days Waiting" value={`${avgDaysWaiting} days`} tone="text-sky-600" />
            <SummaryCard label="Oldest Pending" value={oldestPending ? `${oldestPending.days_waiting} days` : "N/A"} tone="text-violet-600" />
          </div>

          {institutionBreakdown.length > 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.05]">
              <h3 className="mb-5 font-serif text-2xl text-ink dark:text-white">Commission Breakdown by Institution</h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {institutionBreakdown.map(([institutionName, data]) => (
                  <div key={institutionName} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <h4 className="font-semibold text-ink dark:text-white">{institutionName}</h4>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Students</span><span className="font-semibold text-ink">{data.count}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Pending</span><span className="font-semibold text-amber-600">{Math.round(data.pending).toLocaleString("en-KE")} KES</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="font-semibold text-emerald-600">{Math.round(data.paid).toLocaleString("en-KE")} KES</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Overdue</span><span className="font-semibold text-rose-600">{Math.round(data.overdue).toLocaleString("en-KE")} KES</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.05]">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <h3 className="font-serif text-2xl text-ink dark:text-white">Commission Tracker</h3>
              <button type="button" onClick={exportCsv} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">
                Export CSV
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-ink dark:text-white">Status:</span>
                {(["all", "pending", "paid", "overdue"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => applyFilters({ status, institution, sort: sortBy })}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${statusFilter === status ? "border-gold bg-gold text-ink dark:border-[#ffb89e] dark:bg-[#ff7a59] dark:text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-gold hover:text-gold dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:text-[#ffb89e]"}`}
                  >
                    {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-ink dark:text-white">Institution:</span>
                <select
                  value={institution || "all"}
                  onChange={(event) => {
                    const next = event.target.value === "all" ? "" : event.target.value;
                    setInstitution(next);
                    applyFilters({ status: statusFilter, institution: next, sort: sortBy });
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100"
                >
                  <option value="all">All Institutions</option>
                  {institutions.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
                <span className="ml-0 text-sm font-semibold text-ink md:ml-4">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(event) => applyFilters({ status: statusFilter, institution, sort: event.target.value as SortKey })}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                >
                  <option value="days_waiting">Days Waiting</option>
                  <option value="amount">Amount</option>
                  <option value="name">Student Name</option>
                  <option value="due_date">Due Date</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            {resolvedRows.length === 0 ? (
              <div className="px-6 py-16 text-center text-slate-500">
                <div className="text-5xl text-gold/70">⌕</div>
                <h3 className="mt-4 text-lg font-semibold text-ink">No Commissions Found</h3>
                <p className="mt-2 text-sm">No enrolled students match the current filters.</p>
              </div>
            ) : (
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-[#0f172a] text-left text-xs uppercase tracking-[0.08em] text-white">
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Institution</th>
                    <th className="px-4 py-3">Enrollment Date</th>
                    <th className="px-4 py-3">Days Waiting</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedRows.map((row) => {
                    const badge = statusBadge(row);
                    return (
                      <tr key={row.id} className={`${rowTone(row)} hover:bg-gold/5`}>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.tone}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink">{row.full_name}</td>
                        <td className="px-4 py-3 text-slate-600">{row.commission_institution ?? "N/A"}</td>
                        <td className="px-4 py-3">{formatDate(row.enrollment_date)}</td>
                        <td className="px-4 py-3 font-semibold">{row.days_waiting} days</td>
                        <td className="px-4 py-3">{formatDate(row.commission_due_date)}</td>
                        <td className="px-4 py-3 font-semibold">{Math.round(row.commission_amount).toLocaleString("en-KE")} KES</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={`/financial-reports`}
                              className="inline-flex rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white"
                            >
                              Invoice
                            </a>
                            <a
                              href={generateEmailLink(row)}
                              className="inline-flex rounded-xl bg-ocean px-3 py-2 text-xs font-semibold text-white"
                            >
                              Email
                            </a>
                            {row.commission_status !== "paid" ? (
                              <button
                                type="button"
                                onClick={() => setModal({ studentId: row.id, studentName: row.full_name })}
                                className="inline-flex rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                              >
                                Mark Paid
                              </button>
                            ) : (
                              <span className="inline-flex items-center rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                                Paid
                              </span>
                            )}
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
          <div className="w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-ink">Mark Commission as Paid</h2>
              <button type="button" onClick={() => setModal(null)} className="text-2xl text-slate-400">
                ×
              </button>
            </div>
            <form className="space-y-4" onSubmit={markPaid}>
              <label className="block text-sm text-slate-600">
                <span className="mb-2 block font-medium text-ink">Student</span>
                <input value={modal.studentName} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" />
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-2 block font-medium text-ink">Payment Received Date</span>
                <input type="date" required value={paidDate} onChange={(event) => setPaidDate(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" />
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-2 block font-medium text-ink">Notes</span>
                <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="Any additional notes..." />
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                  Mark as Paid
                </button>
                <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
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

function SummaryCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
      <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}
