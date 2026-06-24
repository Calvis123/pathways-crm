import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  FileText,
  Mail,
  MessageCircle,
  MessageSquarePlus,
  Phone,
  Receipt,
  Timer,
  UserRound
} from "lucide-react";
import { StudentEditor } from "@/components/forms/student-editor";
import { StudentProfileNav } from "@/components/layout/student-profile-nav";
import { StudentOperatingActions } from "@/components/students/student-operating-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { stageLabels } from "@/lib/constants";
import { canAccessFinance, getCurrentSession, isPrivilegedRole } from "@/lib/auth";
import {
  getConsultations,
  getDocuments,
  getLeadTemperatureSnapshotByStudentId,
  getUsers,
  getPayments,
  getOperatingSystemSnapshot,
  getStudentActivityTimeline,
  getStudentById,
  getStudentNotes
} from "@/lib/data";
import {
  calculateDaysInGate,
  getDecisionRecommendation,
  getFranchiseGateExitChecks,
  getGateForStage,
  getQaGateResult
} from "@/lib/operating-system";
import { formatCurrency, formatDate, normalizeKenyanPhone } from "@/lib/utils";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentById(id);
  const session = await getCurrentSession();

  if (!student) notFound();

  const [temperature, activities, notes, documents, payments, consultations, operatingSnapshot, users] = await Promise.all([
    getLeadTemperatureSnapshotByStudentId(id),
    getStudentActivityTimeline(id),
    getStudentNotes(id),
    getDocuments(),
    getPayments(),
    getConsultations(),
    getOperatingSystemSnapshot(),
    getUsers()
  ]);

  const studentDocuments = documents.filter((document) => document.student_id === id);
  const studentPayments = payments.filter((payment) => payment.student_id === id);
  const studentConsultations = consultations.filter((consultation) => consultation.student_id === id);
  const studentProfile = operatingSnapshot.studentProfiles.find((profile) => profile.student_id === id);
  const studentApplications = operatingSnapshot.applications.filter((application) => application.student_id === id);
  const studentVisaRecords = operatingSnapshot.visaRecords.filter((record) => record.student_id === id);
  const studentContext = {
    student,
    profile: studentProfile,
    documents: studentDocuments,
    payments: studentPayments,
    applications: studentApplications,
    visaRecords: studentVisaRecords,
    qaCheckpoints: operatingSnapshot.qaCheckpoints.filter((checkpoint) => checkpoint.entity_type === "student" && checkpoint.entity_id === id)
  };
  const gate = getGateForStage(student.stage);
  const gateStatus = {
    gate: gate.gate,
    label: gate.label,
    owner: gate.owner,
    stage: gate.stage,
    maxDays: gate.maxDays,
    daysInGate: calculateDaysInGate(student),
    exitChecklist: getFranchiseGateExitChecks(studentContext, gate)
  };
  const qaGate = getQaGateResult(studentContext);
  const recommendation = getDecisionRecommendation(studentProfile);
  const openQaCheckpoints = operatingSnapshot.qaCheckpoints
    .filter((checkpoint) => checkpoint.entity_type === "student" && checkpoint.entity_id === id && !checkpoint.passed)
    .map((checkpoint) => ({ id: checkpoint.id, stage: checkpoint.stage, label: checkpoint.label }));
  const consultants = users
    .filter((user) => ["superadmin", "admin", "consultant", "operations", "employee"].includes(user.role) && user.status === "active")
    .map((user) => ({ id: user.id, username: user.username, full_name: user.full_name, role: user.role }));
  const canEditStudent = isPrivilegedRole(session?.role) || session?.role === "consultant" || session?.role === "employee";
  const canSeeFinance = canAccessFinance(session?.role);
  const paid = student.consultation_upfront_paid + student.consultation_balance_paid;
  const initials = student.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();
  const temperatureTone =
    temperature?.status === "hot"
      ? "bg-red-100 text-red-800 ring-red-300"
      : temperature?.status === "warm"
        ? "bg-emerald-100 text-emerald-800 ring-emerald-300"
        : "bg-amber-100 text-amber-900 ring-amber-300";
  const whatsappPhone = student.phone ? normalizeKenyanPhone(student.phone) : null;
  const whatsappMessage = encodeURIComponent(
    `Hello ${student.full_name}, this is Barak Pathways following up on your study abroad application.`
  );
  const whatsappHref = whatsappPhone ? `https://wa.me/${whatsappPhone.replace("+", "")}?text=${whatsappMessage}` : null;

  const quickActions = [
    { label: "Add Interaction", href: `/students/${student.id}/notes`, icon: MessageSquarePlus },
    { label: "Timeline", href: `/students/${student.id}/timeline`, icon: Timer },
    { label: "Email", href: `/email-center?student=${student.id}`, icon: Mail },
    { label: "Documents", href: `/documents?student=${student.id}`, icon: FileText },
    ...(canSeeFinance ? [{ label: "Payments", href: `/payments?student=${student.id}`, icon: Receipt }] : []),
    { label: "Consultation", href: `/consultations?student=${student.id}`, icon: CalendarPlus }
  ];

  return (
    <div className="space-y-5">
      <StudentProfileNav studentId={student.id} active="profile" temperature={temperature} />

      <section className="overflow-hidden rounded-xl border border-[#eadacc] bg-white shadow-sm dark:border-white/10 dark:bg-[#182638]">
        <div className="grid gap-5 bg-[#fff6ef] p-5 dark:bg-white/[0.03] lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#213343] text-lg font-semibold text-white dark:bg-[#ff7a59]">
              {initials || <UserRound className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
              <Link href="/students" className="inline-flex items-center gap-2 text-sm font-semibold text-[#8b5e3c] hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Students
              </Link>
              <h1 className="mt-2 truncate text-3xl font-semibold text-[#213343] dark:text-white">{student.full_name}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{student.email}</span>
                <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{student.phone ?? "No phone"}</span>
                <span>Registered via {student.lead_source ?? "Unknown source"}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[560px]">
            <Stat label="Stage" value={stageLabels[student.stage]} />
            {canSeeFinance ? <Stat label="Paid" value={formatCurrency(paid)} /> : null}
            <Stat label="Docs" value={`${studentDocuments.length}`} />
            <Stat label="Notes" value={`${notes.length}`} />
          </div>
        </div>
      </section>

      <Card className="p-4">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="This student does not have a valid WhatsApp-ready phone number."
              className="flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-[#eadacc] bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-500"
            >
              <MessageCircle className="h-4 w-4" />
              No WhatsApp
            </button>
          )}
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href as Route}
                className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#eadacc] bg-[#fffaf5] px-3 py-2 text-center text-sm font-semibold text-[#213343] transition hover:bg-[#fff1e6] dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
              >
                <Icon className="h-4 w-4 text-[#c9692c]" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-5">
          <StudentOperatingActions
            student={student}
            gateStatus={gateStatus}
            qaGate={qaGate}
            recommendation={recommendation}
            openQaCheckpoints={openQaCheckpoints}
            consultants={consultants}
          />

          <details className="rounded-lg border border-[#eadacc] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#182638]">
            <summary className="cursor-pointer text-sm font-semibold text-[#213343] dark:text-white">Edit full student profile</summary>
            <div className="mt-5">
              <StudentEditor initial={student} readOnly={!canEditStudent} compact canSeeFinance={canSeeFinance} />
            </div>
          </details>
        </main>

        <aside className="space-y-5">
          <Card>
            <CardHeader title="Case Snapshot" />
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-[#fffaf5] px-3 py-2 dark:bg-white/[0.04]">
                <span className="text-slate-500 dark:text-slate-400">Lead status</span>
                <Badge className={`${temperatureTone} ring-1`}>{temperature?.label ?? "Cold"}</Badge>
              </div>
              <Info label="Destination" value={student.country_interest ?? "Not set"} />
              <Info label="Program" value={student.program_level ?? "Not set"} />
              <Info label="University" value={student.university_name ?? "Not set"} />
              <Info label="Location" value={student.location ?? "Not set"} />
              <Info label="Passport" value={student.passport_number ?? "Not set"} />
              <Info label="Registered" value={formatDate(student.created_at)} />
              <Info label="Registration source" value={student.lead_source ?? "Unknown source"} />
            </div>
          </Card>

          <Card>
            <CardHeader title="File Summary" />
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniStat label="Consult" value={`${studentConsultations.length}`} />
              <MiniStat label="Docs" value={`${studentDocuments.length}`} />
              {canSeeFinance ? <MiniStat label="Pay" value={`${studentPayments.length}`} /> : null}
            </div>
          </Card>

          <Card>
            <CardHeader title="Recent Activity" action={<Link href={`/students/${student.id}/timeline` as Route} className="text-sm font-semibold text-[#c9692c] hover:underline">View all</Link>} />
            <div className="space-y-3">
              {activities.slice(0, 3).length === 0 ? (
                <Empty text="No activity yet." />
              ) : (
                activities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="rounded-lg border border-[#eadacc] bg-[#fffaf5] p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8b5e3c]">{activity.channel}</p>
                    <p className="mt-1 text-sm font-medium text-[#213343] dark:text-white">
                      {formatDate(activity.occurred_at, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{activity.description}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Latest Note" action={<Link href={`/students/${student.id}/notes` as Route} className="text-sm font-semibold text-[#c9692c] hover:underline">Notes</Link>} />
            {notes[0] ? (
              <div className="rounded-lg border border-[#eadacc] bg-[#fffaf5] p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8b5e3c]">{notes[0].note_type} | {notes[0].priority}</p>
                <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{notes[0].note_text}</p>
              </div>
            ) : (
              <Empty text="No notes yet." />
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#eadacc] bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8b5e3c]">{label}</p>
      <p className="mt-1 truncate font-semibold text-[#213343] dark:text-white">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#fffaf5] px-3 py-2 dark:bg-white/[0.04]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8b5e3c] dark:text-slate-400">{label}</p>
      <p className="mt-1 break-words font-medium text-[#213343] dark:text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#eadacc] bg-[#fffaf5] px-2 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-lg font-semibold text-[#213343] dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#8b5e3c] dark:text-slate-400">{label}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-[#eadacc] px-3 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
      {text}
    </p>
  );
}
