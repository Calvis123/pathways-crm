"use client";

import Link from "next/link";
import type { Route } from "next";

type IeltsRow = {
  id: string;
  full_name: string;
  phone: string | null;
  location: string | null;
  targetScore: string | null;
  currentScore: number | null;
  sessionCount: number;
  testDate: string | null;
};

function scoreTone(score: number | null) {
  if (score === null) return "bg-slate-200 text-slate-600";
  if (score >= 7.5) return "bg-emerald-100 text-emerald-700";
  if (score >= 6.5) return "bg-sky-100 text-sky-700";
  if (score >= 5.5) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export function IeltsDashboardTable({
  rows,
  page,
  totalPages,
  totalStudents,
  showingFrom,
  showingTo,
  stats,
  targetScoreBreakdown
}: {
  rows: IeltsRow[];
  page: number;
  totalPages: number;
  totalStudents: number;
  showingFrom: number;
  showingTo: number;
  stats: {
    withResults: number;
    pendingResults: number;
    avgScore: number;
    totalSessions: number;
    avgSessions: number;
  };
  targetScoreBreakdown: Array<{ score: string; count: number }>;
}) {
  function pageHref(nextPage: number) {
    return {
      pathname: "/ielts-dashboard",
      query: { page: String(nextPage) }
    } as const;
  }

  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-panel">
        <div className="border-b border-gold/20 bg-[#0f172a] px-8 py-6 text-white">
          <h1 className="font-serif text-3xl">IELTS Training Dashboard</h1>
          <p className="mt-2 text-sm text-white/70">
            Track IELTS student progress, scores, and training sessions.
          </p>
        </div>

        <div className="space-y-6 px-8 py-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="Total Students" value={String(totalStudents)} sub="Enrolled in IELTS" />
            <MetricCard label="With Results" value={String(stats.withResults)} sub="Test completed" tone="text-emerald-600" />
            <MetricCard label="Pending Results" value={String(stats.pendingResults)} sub="Awaiting test" />
            <MetricCard label="Avg Score" value={stats.avgScore.toFixed(1)} sub="Overall band" tone="text-gold" />
            <MetricCard label="Total Sessions" value={String(stats.totalSessions)} sub="Training sessions" />
            <MetricCard label="Avg Sessions" value={stats.avgSessions.toFixed(1)} sub="Per student" />
          </div>

          {targetScoreBreakdown.length > 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-ink">Target Score Breakdown</h3>
              <div className="flex flex-wrap gap-3">
                {targetScoreBreakdown.map((item) => (
                  <span key={item.score} className="rounded-full border border-gold/30 bg-slate-50 px-4 py-2 text-sm text-slate-700">
                    <strong className="text-gold">{item.score}</strong>: {item.count} student(s)
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="font-serif text-2xl text-ink">IELTS Students</h2>
            <Link
              href="/"
              className="inline-flex rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            {rows.length === 0 ? (
              <div className="px-6 py-20 text-center text-slate-500">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-gold/70">IELTS</div>
                <h3 className="mt-4 text-xl font-semibold text-ink">No IELTS Students Yet</h3>
                <p className="mt-2 text-sm">Students enrolled in IELTS training will appear here.</p>
              </div>
            ) : (
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-[#0f172a] text-left text-xs uppercase tracking-[0.08em] text-white">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Current Score</th>
                    <th className="px-4 py-3">Sessions</th>
                    <th className="px-4 py-3">Test Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((student) => (
                    <tr key={student.id} className="border-b border-slate-100 hover:bg-gold/5">
                      <td className="px-4 py-4 font-semibold text-ink">{student.full_name}</td>
                      <td className="px-4 py-4">{student.phone ?? "-"}</td>
                      <td className="px-4 py-4">{student.location ?? "-"}</td>
                      <td className="px-4 py-4 font-semibold">{student.targetScore ?? "N/A"}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${scoreTone(student.currentScore)}`}>
                          {student.currentScore !== null ? student.currentScore.toFixed(1) : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-gold/15 px-3 py-1 text-sm font-semibold text-gold">
                          {student.sessionCount}
                        </span>
                      </td>
                      <td className="px-4 py-4">{formatDate(student.testDate)}</td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/students/${student.id}` as Route}
                          className="inline-flex rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-slate-500">
                Showing <strong>{showingFrom}</strong> to <strong>{showingTo}</strong> of{" "}
                <strong>{totalStudents}</strong> students
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {page > 1 ? (
                  <>
                    <Link href={pageHref(1)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                      First
                    </Link>
                    <Link href={pageHref(page - 1)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                      Previous
                    </Link>
                  </>
                ) : null}

                {startPage > 1 ? <span className="px-2 text-slate-400">...</span> : null}

                {Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index).map((pageNumber) =>
                  pageNumber === page ? (
                    <span key={pageNumber} className="rounded-xl bg-gold px-3 py-2 text-sm font-semibold text-ink">
                      {pageNumber}
                    </span>
                  ) : (
                    <Link key={pageNumber} href={pageHref(pageNumber)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                      {pageNumber}
                    </Link>
                  )
                )}

                {endPage < totalPages ? <span className="px-2 text-slate-400">...</span> : null}

                {page < totalPages ? (
                  <>
                    <Link href={pageHref(page + 1)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                      Next
                    </Link>
                    <Link href={pageHref(totalPages)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                      Last
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
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
  tone = "text-ink"
}: {
  label: string;
  value: string;
  sub: string;
  tone?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-extrabold ${tone}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-500">{sub}</p>
    </div>
  );
}
