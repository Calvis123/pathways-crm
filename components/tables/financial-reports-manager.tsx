"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { cashOutline, flashOutline, warningOutline } from "ionicons/icons";
import { IonIcon } from "@/components/ui/ion-icon";
import { formatCurrency, formatDate } from "@/lib/utils";

type ReportType = "overview" | "cashflow" | "credit" | "expenses";

export function FinancialReportsManager({
  reportType,
  startDate,
  endDate,
  alerts,
  metrics,
  monthlyRevenue,
  paymentsByMethod,
  expensesByCategory,
  credit,
  health
}: {
  reportType: ReportType;
  startDate: string;
  endDate: string;
  alerts: Array<{ tone: "critical" | "warning" | "info"; title: string; body: string }>;
  metrics: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    expenseRatio: number;
    creditExposure: number;
    cashFlowHealth: "good" | "fair" | "warning" | "critical";
    periodLabel: string;
  };
  monthlyRevenue: Array<{ label: string; amount: number }>;
  paymentsByMethod: Array<{ method: string; amount: number; percentage: number }>;
  expensesByCategory: Array<{ category: string; amount: number; percentage: number }>;
  credit: {
    totalBilled: number;
    totalPaid: number;
    outstanding: number;
    overdueAmount: number;
    overdueStudents: Array<{
      name: string;
      phone: string | null;
      balance: number;
      days_overdue: number;
      due_date: string;
    }>;
  };
  health: {
    score: number;
    rating: string;
    colorClass: string;
    barColor: string;
    breakdown: Array<{ label: string; score: number; max: number }>;
  };
}) {
  const router = useRouter();
  const [filters, setFilters] = useState({ report: reportType, startDate, endDate });

  function applyFilters(next = filters) {
    const params = new URLSearchParams({
      report: next.report,
      start_date: next.startDate,
      end_date: next.endDate
    });
    startTransition(() => {
      router.replace(`/financial-reports?${params.toString()}`);
    });
  }

  function exportReport() {
    window.print();
  }

  const showOverview = reportType === "overview";
  const showCashflow = showOverview || reportType === "cashflow";
  const showCredit = showOverview || reportType === "credit";
  const showExpenses = showOverview || reportType === "expenses";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-panel transition-colors dark:border-white/10 dark:bg-[#0d1729] dark:shadow-[0_22px_70px_rgba(2,6,23,0.32)]">
        <div className="flex flex-col gap-4 border-b border-gold/20 bg-[#0f172a] px-8 py-6 text-white dark:border-white/10 dark:bg-[linear-gradient(135deg,#09111f,#15223a)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-serif text-3xl">Financial Reports</h1>
            <p className="mt-2 text-sm text-white/70">
              Comprehensive financial analysis for Barak Pathways.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportReport}
              className="rounded-2xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Print / Export PDF
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
          <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <label className="min-w-[180px] flex-1 text-sm text-slate-600 dark:text-slate-400">
              <span className="mb-2 block font-medium text-ink dark:text-slate-100">Report Type</span>
              <select
                value={filters.report}
                onChange={(event) => {
                  const next = { ...filters, report: event.target.value as ReportType };
                  setFilters(next);
                  applyFilters(next);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-[#0f1b31] dark:text-slate-100"
              >
                <option value="overview">Overview</option>
                <option value="cashflow">Cash Flow</option>
                <option value="credit">Credit & Collections</option>
                <option value="expenses">Expense Analysis</option>
              </select>
            </label>
            <label className="min-w-[180px] flex-1 text-sm text-slate-600 dark:text-slate-400">
              <span className="mb-2 block font-medium text-ink dark:text-slate-100">Start Date</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-[#0f1b31] dark:text-slate-100"
              />
            </label>
            <label className="min-w-[180px] flex-1 text-sm text-slate-600 dark:text-slate-400">
              <span className="mb-2 block font-medium text-ink dark:text-slate-100">End Date</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-[#0f1b31] dark:text-slate-100"
              />
            </label>
            <button
              type="button"
              onClick={() => applyFilters()}
              className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white dark:bg-[#ff7a59]"
            >
              Apply Filters
            </button>
          </div>

          {alerts.map((alert, index) => (
            <div
              key={`${alert.title}-${index}`}
              className={`flex items-start gap-4 rounded-2xl border px-5 py-4 ${
                alert.tone === "critical"
                  ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100"
                  : alert.tone === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
                    : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100"
              }`}
            >
              <span className="text-current">
                <IonIcon
                  icon={alert.tone === "critical" ? warningOutline : alert.tone === "warning" ? flashOutline : cashOutline}
                  className="h-6 w-6"
                />
              </span>
              <span className="hidden text-2xl">
                {alert.tone === "critical" ? "⚠️" : alert.tone === "warning" ? "⚡" : "💰"}
              </span>
              <div>
                <p className="font-semibold">{alert.title}</p>
                <p className="mt-1 text-sm">{alert.body}</p>
              </div>
            </div>
          ))}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Revenue" value={formatCurrency(metrics.totalRevenue)} sub={metrics.periodLabel} />
            <MetricCard label="Total Expenses" value={formatCurrency(metrics.totalExpenses)} accent="text-rose-600" sub={`Expense Ratio: ${metrics.expenseRatio.toFixed(1)}%`} />
            <MetricCard label="Net Profit" value={formatCurrency(metrics.netProfit)} accent={metrics.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"} sub={`Profit Margin: ${metrics.profitMargin.toFixed(1)}%`} badge={metrics.cashFlowHealth} />
            <MetricCard label="Credit Exposure" value={formatCurrency(metrics.creditExposure)} accent="text-amber-600" sub="Outstanding balances" />
          </div>

          {showCashflow ? (
            <ReportSection title="Revenue vs Expenses">
              <div className="grid gap-6 xl:grid-cols-2">
                <div>
                  <h4 className="mb-4 font-semibold text-ink">Monthly Trend</h4>
                  <div className="space-y-4">
                    {monthlyRevenue.length === 0 ? (
                      <p className="text-sm text-slate-500">No payment data for this period.</p>
                    ) : (
                      monthlyRevenue.map((item) => {
                        const max = Math.max(...monthlyRevenue.map((row) => row.amount), 1);
                        return (
                          <div key={item.label}>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="text-slate-600">{item.label}</span>
                              <span className="font-semibold text-ink">{formatCurrency(item.amount)}</span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gold"
                                style={{ width: `${(item.amount / max) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="mb-4 font-semibold text-ink">Payment Methods</h4>
                  <div className="space-y-4">
                    {paymentsByMethod.length === 0 ? (
                      <p className="text-sm text-slate-500">No payment methods recorded for this period.</p>
                    ) : (
                      paymentsByMethod.map((item) => (
                        <div key={item.method}>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-slate-600">{item.method}</span>
                            <span className="font-semibold text-ink">
                              {formatCurrency(item.amount)} ({item.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#0f172a]"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </ReportSection>
          ) : null}

          {showOverview || showExpenses ? (
            <ReportSection title="Detailed Breakdown">
              <div className="grid gap-6 xl:grid-cols-2">
                <BreakdownTable
                  title="Revenue by Payment Method"
                  rows={paymentsByMethod.map((item) => ({
                    label: item.method,
                    amount: item.amount,
                    percentage: item.percentage
                  }))}
                  emptyLabel="No revenue recorded"
                  total={metrics.totalRevenue}
                />
                <BreakdownTable
                  title="Expenses by Category"
                  rows={expensesByCategory.map((item) => ({
                    label: item.category,
                    amount: item.amount,
                    percentage: item.percentage
                  }))}
                  emptyLabel="No expenses recorded"
                  total={metrics.totalExpenses}
                />
              </div>
            </ReportSection>
          ) : null}

          {showCredit ? (
            <ReportSection title="Credit & Collections">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total Billed" value={formatCurrency(credit.totalBilled)} />
                <MetricCard label="Total Collected" value={formatCurrency(credit.totalPaid)} accent="text-emerald-600" />
                <MetricCard label="Outstanding Balance" value={formatCurrency(credit.outstanding)} accent="text-amber-600" />
                <MetricCard label="Overdue Amount" value={formatCurrency(credit.overdueAmount)} accent={credit.overdueAmount > 0 ? "text-rose-600" : "text-emerald-600"} sub={`${credit.overdueStudents.length} students`} />
              </div>

              {credit.overdueStudents.length > 0 ? (
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-[#0f172a] text-left text-xs uppercase tracking-[0.08em] text-white">
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Balance</th>
                        <th className="px-4 py-3">Days Overdue</th>
                        <th className="px-4 py-3">Due Date</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {credit.overdueStudents.map((student) => (
                        <tr key={`${student.name}-${student.due_date}`} className="border-b border-slate-100 hover:bg-gold/5">
                          <td className="px-4 py-3 text-sm font-medium text-ink">{student.name}</td>
                          <td className="px-4 py-3 text-sm">{formatCurrency(student.balance)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${student.days_overdue > 30 ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                              {student.days_overdue} days
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{formatDate(student.due_date)}</td>
                          <td className="px-4 py-3 text-sm">
                            <a
                              href={`https://wa.me/${(student.phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${student.name}, friendly reminder about your outstanding balance of KES ${student.balance.toLocaleString("en-KE")}`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-xl bg-[#25d366] px-3 py-2 text-xs font-semibold text-white"
                            >
                              WhatsApp
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </ReportSection>
          ) : null}

          {showOverview ? (
            <ReportSection title="Financial Health Assessment">
              <div className="flex flex-col gap-8 xl:flex-row xl:items-center">
                <div className="flex flex-col items-center text-center">
                  <div className={`flex h-40 w-40 items-center justify-center rounded-full border-8 ${health.colorClass}`}>
                    <div>
                      <p className="text-4xl font-extrabold">{health.score}</p>
                      <p className="text-xs text-slate-500">out of 100</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xl font-bold text-ink">{health.rating}</p>
                </div>
                <div className="flex-1">
                  <h4 className="mb-4 font-semibold text-ink">Score Breakdown</h4>
                  <div className="space-y-4">
                    {health.breakdown.map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-slate-600">{item.label}</span>
                          <span className="font-semibold text-ink">
                            {item.score}/{item.max}
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${health.barColor}`}
                            style={{ width: `${(item.score / item.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ReportSection>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent = "text-ink",
  badge
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  badge?: "good" | "fair" | "warning" | "critical";
}) {
  const badgeTone =
    badge === "good"
      ? "bg-emerald-50 text-emerald-700"
      : badge === "fair"
        ? "bg-sky-50 text-sky-700"
        : badge === "warning"
          ? "bg-amber-50 text-amber-700"
          : badge === "critical"
            ? "bg-rose-50 text-rose-700"
            : "";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-extrabold ${accent}`}>{value}</p>
      {sub ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{sub}</p> : null}
      {badge ? <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${badgeTone}`}>{badge}</span> : null}
    </div>
  );
}

function ReportSection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f1b31]/88">
      <div className="border-b border-slate-100 px-6 py-5 dark:border-white/10">
        <h2 className="font-serif text-2xl text-ink dark:text-slate-50">{title}</h2>
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function BreakdownTable({
  title,
  rows,
  emptyLabel,
  total
}: {
  title: string;
  rows: Array<{ label: string; amount: number; percentage: number }>;
  emptyLabel: string;
  total: number;
}) {
  return (
    <div>
      <h4 className="mb-4 font-semibold text-ink">{title}</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#0f172a] text-left text-xs uppercase tracking-[0.08em] text-white">
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                  {emptyLabel}
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-slate-100 hover:bg-gold/5">
                <td className="px-4 py-3 text-sm text-ink">{row.label}</td>
                <td className="px-4 py-3 text-sm">{formatCurrency(row.amount)}</td>
                <td className="px-4 py-3 text-sm">{row.percentage.toFixed(1)}%</td>
              </tr>
            ))}
            {rows.length > 0 ? (
              <tr className="bg-gold/10 font-semibold">
                <td className="px-4 py-3 text-sm text-ink">Total</td>
                <td className="px-4 py-3 text-sm">{formatCurrency(total)}</td>
                <td className="px-4 py-3 text-sm">100%</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
