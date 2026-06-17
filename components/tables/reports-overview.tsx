"use client";

import { useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

type MetricSummary = {
  totalRevenue: number;
  activeStudents: number;
  conversionRate: number;
  pendingPaymentsLabel: string;
};

type TeamPerformanceRow = {
  created_by: string;
  count: number;
};

type StuckStudentRow = {
  id: string;
  full_name: string;
  phone: string | null;
  stage: string;
  updated_at: string;
};

type RankedRow = {
  label: string;
  count: number;
};

export function ReportsOverview({
  metrics,
  teamPerformance,
  stuckStudents,
  topUniversities,
  topPrograms
}: {
  metrics: MetricSummary;
  teamPerformance: TeamPerformanceRow[];
  stuckStudents: StuckStudentRow[];
  topUniversities: RankedRow[];
  topPrograms: RankedRow[];
}) {
  const teamMax = useMemo(
    () => Math.max(...teamPerformance.map((row) => row.count), 1),
    [teamPerformance]
  );

  return (
    <section className="overflow-hidden rounded-xl border border-[#eadacc] bg-white shadow-[0_18px_50px_rgba(120,75,42,0.1)] dark:border-white/10 dark:bg-[#182638]">
      <div className="border-b border-[#eadacc] bg-[linear-gradient(135deg,#fffaf5_0%,#fff1e6_58%,#ffe0c8_100%)] px-5 py-6 dark:border-white/10 lg:px-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b5e3c]">Analytics Workspace</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#213343] dark:text-white">Reports Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f7182] dark:text-slate-400">
          Performance overview, team analytics, and pipeline health.
        </p>
      </div>

      <div className="space-y-5 px-5 py-5 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Revenue" value={formatCurrency(metrics.totalRevenue)} hint="KES - Consultancy + IELTS" tone="text-gold" />
          <MetricCard label="Active Students" value={String(metrics.activeStudents)} hint="Currently in pipeline" />
          <MetricCard label="Conversion Rate" value={`${metrics.conversionRate}%`} hint="Inquiry to Placed" tone="text-emerald-600" />
          <MetricCard label="Pending Payments" value={metrics.pendingPaymentsLabel} hint="Check pipeline issues below" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <CardSection title="Team Performance (Students Added)" className="xl:col-span-2">
            <div className="space-y-4">
              {teamPerformance.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No team activity has been recorded yet.</p>
              ) : (
                teamPerformance.map((member) => (
                  <div key={member.created_by} className="grid gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-ink dark:text-slate-100">User ID {member.created_by}</span>
                      <span className="text-slate-500 dark:text-slate-400">{member.count} students</span>
                    </div>
                    <div className="h-3 rounded-full bg-[#fff1e6] ring-1 ring-[#eadacc] dark:bg-white/[0.08] dark:ring-white/10">
                      <div
                        className="h-3 rounded-full bg-gold transition-[width]"
                        style={{ width: `${(member.count / teamMax) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardSection>

          <CardSection title="Pipeline Issues (>30 Days)">
            {stuckStudents.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl text-emerald-600">OK</div>
                <p className="mt-3 text-sm font-medium text-emerald-700">No stuck students. Good job!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stuckStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between rounded-lg border border-[#eadacc] bg-[#fffaf5] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <div>
                      <p className="font-semibold text-ink dark:text-slate-100">{student.full_name}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{student.phone ?? "No phone"}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
                        {student.stage}
                      </span>
                      <p className="mt-2 text-xs text-rose-600">{formatDate(student.updated_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardSection>

          <CardSection title="Top Universities">
            <RankTable rows={topUniversities} emptyLabel="No university data yet." />
          </CardSection>

          <CardSection title="Top Programs">
            <RankTable rows={topPrograms} emptyLabel="No program data yet." />
          </CardSection>
        </div>

        <CardSection
          title="Employee Breakdown"
          action={
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex rounded-lg border border-[#eadacc] bg-white px-4 py-2 text-sm font-semibold text-[#213343] transition hover:bg-[#fff6ef] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
            >
              Print Report
            </button>
          }
        >
          <div className="overflow-x-auto rounded-lg border border-[#eadacc] dark:border-white/10">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[linear-gradient(135deg,#213343,#3f5a68)] text-left text-xs uppercase tracking-[0.08em] text-white dark:bg-white/[0.04] dark:text-slate-300">
                  <th className="px-4 py-3">Team Member ID</th>
                  <th className="px-4 py-3">Students Added</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {teamPerformance.map((member) => (
                  <tr key={member.created_by} className="border-b border-[#f0dfd0] hover:bg-[#fff6ef] dark:border-white/10 dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-4 text-ink dark:text-slate-100">{member.created_by}</td>
                    <td className="px-4 py-4 font-semibold text-ink dark:text-slate-100">{member.count}</td>
                    <td className="px-4 py-4">
                      {member.count > 0 ? (
                        <span className="font-semibold text-emerald-600">Active</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {teamPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No employee activity has been recorded yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardSection>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone = "text-ink"
}: {
  label: string;
  value: string;
  hint: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-[#eadacc] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(120,75,42,0.1)] dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${tone === "text-ink" ? "text-[#213343]" : tone}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}

function CardSection({
  title,
  children,
  action,
  className = ""
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-[#eadacc] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] ${className}`.trim()}>
      <div className="mb-5 flex flex-col gap-3 border-b border-[#eadacc] pb-4 dark:border-white/10 md:flex-row md:items-start md:justify-between">
        <h2 className="text-lg font-semibold text-[#213343] dark:text-slate-100">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function RankTable({ rows, emptyLabel }: { rows: RankedRow[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#eadacc] dark:border-white/10">
      <table className="min-w-full border-collapse">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-[#f0dfd0] last:border-b-0 hover:bg-[#fff6ef] dark:border-white/10 dark:hover:bg-white/[0.03]">
              <td className="px-4 py-3 text-sm text-ink dark:text-slate-100">{row.label}</td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-ink dark:text-slate-100">{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
