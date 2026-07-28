"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  GraduationCap,
  Search,
  Target,
  Trophy,
  UsersRound
} from "lucide-react";

type IeltsRow = {
  id: string;
  full_name: string;
  phone: string | null;
  location: string | null;
  targetScore: string | null;
  currentScore: number | null;
  sessionCount: number;
  testDate: string | null;
  paymentStatus: "paid" | "unpaid" | null;
};

function scoreTone(score: number | null) {
  if (score === null) return "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300";
  if (score >= 7.5) return "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/15 dark:text-emerald-300";
  if (score >= 6.5) return "bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/15 dark:text-sky-300";
  if (score >= 5.5) return "bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/15 dark:text-amber-300";
  return "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/15 dark:text-rose-300";
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function getProgressLabel(student: IeltsRow) {
  if (student.currentScore !== null) return "Result recorded";
  if (student.testDate) return "Test scheduled";
  if (student.sessionCount > 0) return "In training";
  return "New enrolment";
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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "training" | "scheduled" | "results">("all");

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return rows.filter((student) => {
      const matchesSearch =
        !search ||
        student.full_name.toLowerCase().includes(search) ||
        student.phone?.toLowerCase().includes(search) ||
        student.location?.toLowerCase().includes(search);
      const matchesFilter =
        filter === "all" ||
        (filter === "training" && student.currentScore === null && !student.testDate) ||
        (filter === "scheduled" && student.currentScore === null && Boolean(student.testDate)) ||
        (filter === "results" && student.currentScore !== null);
      return matchesSearch && matchesFilter;
    });
  }, [filter, query, rows]);

  function pageHref(nextPage: number) {
    return { pathname: "/ielts-dashboard", query: { page: String(nextPage) } } as const;
  }

  const maxTargetCount = Math.max(...targetScoreBreakdown.map((item) => item.count), 1);

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(125deg,#172c3a_0%,#274c59_55%,#826f2a_145%)] px-6 py-7 text-white shadow-[0_24px_70px_rgba(26,48,60,0.2)] sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[42px] border-white/[0.04]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#f3d987]">
              <GraduationCap className="h-4 w-4" />
              IELTS Training Centre
            </div>
            <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">IELTS performance dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              Monitor every learner from first training session to final band score.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <HeroStat label="Active learners" value={String(totalStudents)} />
            <HeroStat label="Average band" value={stats.avgScore ? stats.avgScore.toFixed(1) : "—"} accent />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={UsersRound}
          label="IELTS learners"
          value={String(totalStudents)}
          detail="Total enrolled"
          color="navy"
        />
        <MetricCard
          icon={BookOpenCheck}
          label="Training sessions"
          value={String(stats.totalSessions)}
          detail={`${stats.avgSessions.toFixed(1)} average per learner`}
          color="gold"
        />
        <MetricCard
          icon={Trophy}
          label="Results recorded"
          value={String(stats.withResults)}
          detail={`${stats.pendingResults} still in progress`}
          color="green"
        />
        <MetricCard
          icon={Target}
          label="Average band"
          value={stats.avgScore ? stats.avgScore.toFixed(1) : "—"}
          detail="Across completed tests"
          color="blue"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-2xl border border-[#e8ded2] bg-white shadow-[0_10px_35px_rgba(33,51,67,0.06)] dark:border-white/10 dark:bg-[#111d2f]">
          <div className="border-b border-[#eee4da] px-5 py-5 dark:border-white/10 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-ink dark:text-white">Learner progress</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">IELTS preparation, test dates, and band results.</p>
              </div>
              <div className="relative w-full lg:w-72">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search IELTS learners"
                  className="w-full rounded-xl border border-[#dfd4c8] bg-[#fcfaf7] py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {([
                ["all", "All learners"],
                ["training", "In training"],
                ["scheduled", "Test scheduled"],
                ["results", "Results recorded"]
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
                    filter === value
                      ? "bg-ink text-white shadow-sm dark:bg-[#e8b767] dark:text-[#172c3a]"
                      : "bg-[#f5f1ec] text-slate-600 hover:bg-[#ece5dd] dark:bg-white/[0.06] dark:text-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <EmptyState hasStudents={rows.length > 0} />
          ) : (
            <div className="divide-y divide-[#eee7df] dark:divide-white/[0.07]">
              {filteredRows.map((student) => (
                <article key={student.id} className="group grid gap-4 px-5 py-5 transition hover:bg-[#fcfaf7] dark:hover:bg-white/[0.025] sm:px-6 lg:grid-cols-[minmax(220px,1.35fr)_minmax(170px,0.8fr)_minmax(200px,1fr)_auto] lg:items-center">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#213b49,#3c6571)] text-sm font-bold text-white">
                      {student.full_name.split(/\s+/).slice(0, 2).map((name) => name[0]).join("").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-ink dark:text-white">{student.full_name}</h3>
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        {student.location ?? "Location not provided"} · {student.phone ?? "No phone"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Band progress</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Target {student.targetScore ?? "—"}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${scoreTone(student.currentScore)}`}>
                        {student.currentScore !== null ? student.currentScore.toFixed(1) : "Pending"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <ProgressDatum icon={BookOpenCheck} label="Sessions" value={String(student.sessionCount)} />
                    <ProgressDatum icon={CalendarDays} label="Test date" value={formatDate(student.testDate)} />
                  </div>

                  <div className="flex items-center justify-between gap-3 lg:justify-end">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 lg:hidden">{getProgressLabel(student)}</span>
                    <Link
                      href={`/students/${student.id}` as Route}
                      aria-label={`Open IELTS record for ${student.full_name}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2d4b59] dark:bg-[#e8b767] dark:text-[#172c3a]"
                    >
                      IELTS record
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex flex-col gap-3 border-t border-[#eee4da] bg-[#fcfaf7] px-5 py-4 dark:border-white/10 dark:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {showingFrom}–{showingTo} of {totalStudents} IELTS learners
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={pageHref(Math.max(1, page - 1))}
                  aria-disabled={page === 1}
                  className={`rounded-lg border p-2 ${page === 1 ? "pointer-events-none opacity-40" : "hover:bg-white"} border-[#dfd4c8] dark:border-white/10`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                <span className="px-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Page {page} of {totalPages}</span>
                <Link
                  href={pageHref(Math.min(totalPages, page + 1))}
                  aria-disabled={page === totalPages}
                  className={`rounded-lg border p-2 ${page === totalPages ? "pointer-events-none opacity-40" : "hover:bg-white"} border-[#dfd4c8] dark:border-white/10`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-[#e8ded2] bg-white p-6 shadow-[0_10px_35px_rgba(33,51,67,0.06)] dark:border-white/10 dark:bg-[#111d2f]">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gold/15 p-2.5 text-[#90751f] dark:text-[#f3d987]"><Target className="h-5 w-5" /></div>
              <div>
                <h2 className="font-bold text-ink dark:text-white">Target bands</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Current IELTS cohort</p>
              </div>
            </div>
            {targetScoreBreakdown.length > 0 ? (
              <div className="mt-6 space-y-4">
                {targetScoreBreakdown.map((item) => (
                  <div key={item.score}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-ink dark:text-white">Band {item.score}</span>
                      <span className="text-xs text-slate-500">{item.count} learner{item.count === 1 ? "" : "s"}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#eee9e3] dark:bg-white/10">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,#ad9133,#dcc36e)]" style={{ width: `${(item.count / maxTargetCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-xl bg-[#f8f5f1] px-4 py-5 text-center text-sm text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
                Target bands will appear when IELTS learners register.
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-[linear-gradient(145deg,#203945,#2d5360)] p-6 text-white shadow-[0_16px_40px_rgba(33,57,69,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e2c96e]">Cohort status</p>
            <div className="mt-5 space-y-4">
              <StatusRow icon={CheckCircle2} label="Results recorded" value={stats.withResults} />
              <StatusRow icon={CircleDashed} label="Awaiting results" value={stats.pendingResults} />
              <StatusRow icon={BookOpenCheck} label="Sessions delivered" value={stats.totalSessions} />
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function HeroStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-32 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-[#f3d987]" : "text-white"}`}>{value}</p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  color
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
  detail: string;
  color: "navy" | "gold" | "green" | "blue";
}) {
  const tones = {
    navy: "bg-[#eaf0f2] text-[#294b58] dark:bg-sky-400/10 dark:text-sky-300",
    gold: "bg-[#f7f1dc] text-[#947921] dark:bg-amber-400/10 dark:text-amber-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    blue: "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300"
  };
  return (
    <div className="rounded-2xl border border-[#e8ded2] bg-white p-5 shadow-[0_8px_28px_rgba(33,51,67,0.05)] dark:border-white/10 dark:bg-[#111d2f]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-ink dark:text-white">{value}</p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${tones[color]}`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

function ProgressDatum({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400"><Icon className="h-3 w-3" />{label}</p>
      <p className="mt-1.5 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

function StatusRow({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0">
      <span className="flex items-center gap-2.5 text-sm text-white/75"><Icon className="h-4 w-4 text-[#e2c96e]" />{label}</span>
      <strong className="text-lg">{value}</strong>
    </div>
  );
}

function EmptyState({ hasStudents }: { hasStudents: boolean }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf2f3] text-[#315766] dark:bg-white/[0.06] dark:text-[#e8c970]">
        {hasStudents ? <Search className="h-7 w-7" /> : <GraduationCap className="h-8 w-8" />}
      </div>
      <h3 className="mt-5 text-lg font-bold text-ink dark:text-white">{hasStudents ? "No matching learners" : "No IELTS learners yet"}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
        {hasStudents ? "Try another name or progress filter." : "New registrations from the public IELTS training page will appear here automatically."}
      </p>
      {!hasStudents ? (
        <Link href="/ielts-training" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white dark:bg-[#e8b767] dark:text-[#172c3a]">
          Open IELTS registration <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
