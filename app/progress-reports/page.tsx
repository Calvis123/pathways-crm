import Link from "next/link";
import { ProgressReportControls } from "@/components/dashboard/progress-report-controls";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { getStudentById, getStudentNotes, getStudents } from "@/lib/data";
import type { Student, StudentStage } from "@/lib/types";
import { formatCurrency, formatDate, normalizeKenyanPhone } from "@/lib/utils";

const reportStages: Array<{ key: StudentStage; name: string; icon: string; color: string }> = [
  { key: "lead", name: "Lead", icon: "👤", color: "#6B7280" },
  { key: "consultation", name: "Consultation", icon: "💬", color: "#3B82F6" },
  { key: "application", name: "Application", icon: "📝", color: "#8B5CF6" },
  { key: "visa", name: "Visa", icon: "✈️", color: "#EC4899" }
];

type ViewMode = "list" | "bulk" | "individual";
type QuickFilter = "all" | "urgent" | "new" | "unpaid";

function parseDate(value: string | undefined, fallback: string) {
  return value && value.length > 0 ? value : fallback;
}

function inDateRange(student: Student, from: string, to: string) {
  if (from === "all" || to === "all") return true;
  const created = new Date(student.created_at).getTime();
  const fromTime = new Date(`${from}T00:00:00`).getTime();
  const toTime = new Date(`${to}T23:59:59`).getTime();
  return created >= fromTime && created <= toTime;
}

function getFollowUpPriority(student: Student): ["urgent" | "medium" | "low", string] {
  const updated = new Date(student.updated_at || student.created_at).getTime();
  const daysSinceUpdate = Math.floor((Date.now() - updated) / (24 * 60 * 60 * 1000));

  if (student.stage === "lead") {
    if (daysSinceUpdate > 7) return ["urgent", `No contact for ${daysSinceUpdate} days`];
    if (daysSinceUpdate > 3) return ["medium", "Follow-up needed"];
    return ["low", "Recent contact"];
  }

  if (student.stage === "consultation") {
    if (daysSinceUpdate > 14) return ["urgent", "Consultation stale"];
    if (daysSinceUpdate > 7) return ["medium", "Check consultation status"];
    return ["low", "Active consultation"];
  }

  return ["low", "On track"];
}

function getStudentHistory(student: Student, noteItems: Awaited<ReturnType<typeof getStudentNotes>>) {
  const history: Array<{ date: string; title: string; details: string }> = [
    {
      date: student.created_at,
      title: "Student registered in system",
      details: `Source: ${student.lead_source ?? "Direct"}`
    }
  ];

  if (student.consultation_date) {
    history.push({
      date: student.consultation_date,
      title: "Consultation scheduled",
      details: `Date: ${formatDate(student.consultation_date, { dateStyle: "medium", timeStyle: "short" })}`
    });
  }

  if (student.consultation_upfront_paid > 0) {
    history.push({
      date: student.updated_at ?? student.created_at,
      title: "Upfront payment received",
      details: `Amount: ${formatCurrency(student.consultation_upfront_paid)}`
    });
  }

  if (student.consultation_balance_paid > 0) {
    history.push({
      date: student.updated_at ?? student.created_at,
      title: "Balance payment received",
      details: `Amount: ${formatCurrency(student.consultation_balance_paid)}`
    });
  }

  noteItems.forEach((note) => {
    history.push({
      date: note.created_at,
      title: `Note added (${note.note_type})`,
      details: note.note_text
    });
  });

  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function applyQuickFilter(students: Student[], quickFilter: QuickFilter) {
  if (quickFilter === "all") return students;
  const today = new Date().toISOString().slice(0, 10);

  return students.filter((student) => {
    const [priority] = getFollowUpPriority(student);
    const totalPaid = student.consultation_upfront_paid + student.consultation_balance_paid;

    if (quickFilter === "urgent") return priority === "urgent";
    if (quickFilter === "new") return student.created_at.slice(0, 10) === today;
    if (quickFilter === "unpaid") return totalPaid === 0;
    return true;
  });
}

export default async function ProgressReportsPage({
  searchParams
}: {
  searchParams: Promise<{
    stage?: string;
    student_id?: string;
    date_from?: string;
    date_to?: string;
    view?: string;
    range?: string;
    quick_filter?: string;
  }>;
}) {
  const params = await searchParams;
  const stageFilter = (params.stage as StudentStage | undefined) ?? "lead";
  const studentId = params.student_id;
  const view = (params.view as ViewMode | undefined) ?? "list";
  const quickFilter = (params.quick_filter as QuickFilter | undefined) ?? "all";
  const range = params.range;

  let dateFrom = parseDate(params.date_from, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  let dateTo = parseDate(params.date_to, new Date().toISOString().slice(0, 10));

  if (range === "30" || range === "90") {
    const days = Number(range);
    dateTo = new Date().toISOString().slice(0, 10);
    dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  const students = await getStudents();
  const stageStudentsBase = students.filter((student) => student.stage === stageFilter && inDateRange(student, dateFrom, dateTo));
  const stageStudents = applyQuickFilter(stageStudentsBase, quickFilter);

  const stats = {
    total: stageStudentsBase.length,
    activeLast7Days: stageStudentsBase.filter((student) => new Date(student.updated_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
    activeLast30Days: stageStudentsBase.filter((student) => new Date(student.updated_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length,
    paid: stageStudentsBase.filter((student) => student.consultation_upfront_paid + student.consultation_balance_paid > 0).length,
    avgPayment:
      stageStudentsBase.length > 0
        ? Math.round(stageStudentsBase.reduce((sum, student) => sum + student.consultation_upfront_paid + student.consultation_balance_paid, 0) / stageStudentsBase.length)
        : 0
  };

  const individualStudent = view === "individual" && studentId ? await getStudentById(studentId) : null;
  const individualNotes = individualStudent ? await getStudentNotes(individualStudent.id) : [];
  const history = individualStudent ? getStudentHistory(individualStudent, individualNotes) : [];
  const selectedStageMeta = reportStages.find((stage) => stage.key === stageFilter) ?? reportStages[0];

  return (
    <ModuleShell
      title="Client Progress Report"
      description="Track leads, consultations, and student progress with stage and date based reporting."
    >
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-panel dark:border-white/10 dark:bg-[#0d1729]">
        <div className="flex flex-col gap-4 bg-[#0f172a] px-8 py-6 text-white dark:bg-[linear-gradient(135deg,#09111f,#15223a)] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-serif text-3xl">{selectedStageMeta.name} Stage Report</h2>
            <p className="mt-2 text-sm text-white/70">
              Period:{" "}
              <strong>
                {dateFrom === "all" || dateTo === "all"
                  ? "All Time"
                  : `${formatDate(dateFrom)} - ${formatDate(dateTo)}`}
              </strong>
            </p>
          </div>
          <ProgressReportControls
            stages={reportStages}
            stageFilter={stageFilter}
            view={view}
            dateFrom={dateFrom}
            dateTo={dateTo}
            quickFilter={quickFilter}
            showQuickFilter={false}
            studentId={studentId}
            renderFilters={false}
          />
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 px-8 pt-4 dark:border-white/10">
          <Link href={`/progress-reports?view=list&stage=${stageFilter}&date_from=${dateFrom}&date_to=${dateTo}`} className={`rounded-t-xl px-4 py-3 text-sm font-medium ${view === "list" ? "border-b-2 border-gold text-gold dark:text-[#ffb89e]" : "text-slate-500 dark:text-slate-400"}`}>
            List View
          </Link>
          <Link href={`/progress-reports?view=bulk&stage=${stageFilter}&date_from=${dateFrom}&date_to=${dateTo}`} className={`rounded-t-xl px-4 py-3 text-sm font-medium ${view === "bulk" ? "border-b-2 border-gold text-gold dark:text-[#ffb89e]" : "text-slate-500 dark:text-slate-400"}`}>
            Bulk Report
          </Link>
          {view === "individual" && individualStudent ? (
            <span className="rounded-t-xl border-b-2 border-gold px-4 py-3 text-sm font-medium text-gold dark:text-[#ffb89e]">Individual Report</span>
          ) : null}
        </div>

        <ProgressReportControls
          stages={reportStages}
          stageFilter={stageFilter}
          view={view}
          dateFrom={dateFrom}
          dateTo={dateTo}
          quickFilter={quickFilter}
          showQuickFilter={view === "list"}
          studentId={studentId}
          renderPrintButton={false}
        />

        {view === "individual" && individualStudent ? (
          <div className="space-y-8 px-8 py-8">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-white/10 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="font-serif text-4xl text-ink dark:text-white">{individualStudent.full_name}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  Stage: {individualStudent.stage} | Created: {formatDate(individualStudent.created_at)}
                </p>
              </div>
              <Link href={`/progress-reports?view=list&stage=${stageFilter}&date_from=${dateFrom}&date_to=${dateTo}`} className="inline-flex rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-200">
                Back to List
              </Link>
            </div>

            {(() => {
              const [priority, reason] = getFollowUpPriority(individualStudent);
              const tone =
                priority === "urgent"
                  ? "bg-rose-50 text-rose-700"
                  : priority === "medium"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700";

              return (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.05]">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">Follow-up Priority</p>
                    <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${tone}`}>
                      {priority}
                    </span>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{reason}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.05]">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">Phone</p>
                    <p className="mt-3 text-lg font-semibold text-ink dark:text-white">{individualStudent.phone ?? "Not set"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.05]">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">Email</p>
                    <p className="mt-3 text-lg font-semibold text-ink dark:text-white">{individualStudent.email}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.05]">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">Destination</p>
                    <p className="mt-3 text-lg font-semibold text-ink dark:text-white">{individualStudent.country_interest ?? "Not specified"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.05]">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">Program</p>
                    <p className="mt-3 text-lg font-semibold text-ink dark:text-white">{individualStudent.program_level ?? "Not specified"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.05]">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">Total Paid</p>
                    <p className="mt-3 text-lg font-semibold text-ink dark:text-white">
                      {formatCurrency(individualStudent.consultation_upfront_paid + individualStudent.consultation_balance_paid)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.05]">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">Last Updated</p>
                    <p className="mt-3 text-lg font-semibold text-ink dark:text-white">{formatDate(individualStudent.updated_at)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.05]">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">Lead Source</p>
                    <p className="mt-3 text-lg font-semibold text-ink dark:text-white">{individualStudent.lead_source ?? "Direct"}</p>
                  </div>
                </div>
              );
            })()}

            <Card className="border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.04]">
              <CardHeader title="Progress History" description="Synthesized interaction timeline from the student record and notes." />
              <div className="space-y-4">
                {history.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-300">No history recorded yet.</p> : null}
                {history.map((item, index) => (
                  <div key={`${item.date}-${index}`} className="flex gap-4 border-b border-slate-200 pb-4 last:border-b-0 dark:border-white/10">
                    <div className="min-w-[140px] text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(item.date, { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-ink dark:text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Link href={`/students/${individualStudent.id}`} className="inline-flex rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">
                View Full Profile
              </Link>
              {individualStudent.phone && normalizeKenyanPhone(individualStudent.phone) ? (
                <a
                  href={`https://wa.me/${normalizeKenyanPhone(individualStudent.phone)?.replace("+", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 bg-slate-50 px-8 py-8 dark:bg-white/[0.03] md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-white/10 dark:bg-white/[0.05]">
                <p className="text-4xl font-semibold text-gold">{stats.total}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Total {selectedStageMeta.name}s</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-white/10 dark:bg-white/[0.05]">
                <p className="text-4xl font-semibold text-gold">{stats.activeLast7Days}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Active (7 Days)</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-white/10 dark:bg-white/[0.05]">
                <p className="text-4xl font-semibold text-gold">{stats.paid}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Made Payment</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-white/10 dark:bg-white/[0.05]">
                <p className="text-4xl font-semibold text-gold">{formatCurrency(stats.avgPayment)}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Avg Payment</p>
              </div>
            </div>

            {view === "bulk" ? (
              <div className="grid gap-4 px-8 py-8 md:grid-cols-2 xl:grid-cols-3">
                {stageStudents.map((student) => {
                  const [priority, reason] = getFollowUpPriority(student);
                  return (
                    <Card key={student.id} className="border-slate-200 dark:border-white/10 dark:bg-white/[0.05]">
                      <p className="font-semibold text-ink dark:text-white">{student.full_name}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{student.email}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-full px-2.5 py-1 ${priority === "urgent" ? "bg-rose-50 text-rose-700" : priority === "medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {priority}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-white/[0.08] dark:text-slate-200">{student.stage}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{reason}</p>
                      <p className="mt-3 text-sm font-medium text-ink dark:text-slate-100">
                        Paid: {formatCurrency(student.consultation_upfront_paid + student.consultation_balance_paid)}
                      </p>
                      <div className="mt-4">
                        <Link href={`/progress-reports?view=individual&student_id=${student.id}&stage=${stageFilter}&date_from=${dateFrom}&date_to=${dateTo}`} className="text-sm font-medium text-ocean underline">
                          Open individual report
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto px-8 pb-8">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-[#0f172a] text-left text-xs uppercase tracking-[0.08em] text-white">
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Stage</th>
                      <th className="px-4 py-3">Destination</th>
                      <th className="px-4 py-3">Program</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stageStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-slate-500 dark:text-slate-300">
                          No students found in this stage for the selected period.
                        </td>
                      </tr>
                    ) : null}
                    {stageStudents.map((student) => {
                      const [priority, reason] = getFollowUpPriority(student);
                      const tone =
                        priority === "urgent"
                          ? "bg-rose-50 text-rose-700"
                          : priority === "medium"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700";

                      return (
                        <tr key={student.id} className="border-b border-slate-200 hover:bg-gold/5 dark:border-white/10 dark:hover:bg-white/[0.04]">
                          <td className="px-4 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${tone}`}>
                              {priority}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-ink dark:text-white">{student.full_name}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{reason}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                            <p>{student.phone ?? "-"}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                              style={{ backgroundColor: `${selectedStageMeta.color}20`, color: selectedStageMeta.color }}
                            >
                              {selectedStageMeta.icon} {student.stage}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{student.country_interest ?? "-"}</td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{student.program_level ?? "-"}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-ink dark:text-slate-100">
                            {formatCurrency(student.consultation_upfront_paid + student.consultation_balance_paid)}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(student.created_at)}</td>
                          <td className="px-4 py-4">
                            <Link href={`/progress-reports?view=individual&student_id=${student.id}&stage=${stageFilter}&date_from=${dateFrom}&date_to=${dateTo}`} className="inline-flex rounded-xl bg-ocean px-3 py-2 text-xs font-semibold text-white">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </ModuleShell>
  );
}
