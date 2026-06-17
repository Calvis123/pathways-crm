import { notFound } from "next/navigation";
import { Activity, Mail, Phone, ThermometerSun } from "lucide-react";
import { StudentEditor } from "@/components/forms/student-editor";
import { StudentProfileNav } from "@/components/layout/student-profile-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { stageLabels } from "@/lib/constants";
import { getCurrentSession } from "@/lib/auth";
import { getLeadTemperatureSnapshotByStudentId, getStudentActivityTimeline, getStudentById } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentById(id);
  const session = await getCurrentSession();

  if (!student) notFound();

  const [temperature, activities] = await Promise.all([
    getLeadTemperatureSnapshotByStudentId(id),
    getStudentActivityTimeline(id)
  ]);
  const canEditStudent = session?.role === "admin" || session?.role === "consultant" || session?.role === "employee";
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
      ? "bg-red-100 text-red-800 ring-1 ring-red-300 dark:bg-red-500/20 dark:text-red-100 dark:ring-red-400/40"
      : temperature?.status === "warm"
        ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-400/40"
        : "bg-amber-200 text-amber-950 ring-1 ring-amber-500 dark:bg-amber-500/30 dark:text-amber-50 dark:ring-amber-300/70";

  return (
    <div className="space-y-6">
      <StudentProfileNav studentId={student.id} active="profile" temperature={temperature} />
      <section className="overflow-hidden rounded-xl border border-[#eadacc] bg-white shadow-[0_18px_50px_rgba(120,75,42,0.1)] dark:border-white/10 dark:bg-[#182638]">
        <div className="grid gap-5 bg-[linear-gradient(135deg,#fffaf5_0%,#fff1e6_58%,#ffe0c8_100%)] px-5 py-6 lg:grid-cols-[1fr_280px] lg:px-7">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#31424a,#516672)] text-lg font-semibold text-white shadow-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <Badge className={temperatureTone}>
              <span
                className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                  temperature?.status === "hot"
                    ? "bg-red-600 dark:bg-red-300"
                    : temperature?.status === "warm"
                      ? "bg-emerald-600 dark:bg-emerald-300"
                      : "bg-amber-800 dark:bg-amber-100"
                }`}
              />
              {temperature?.label ?? "Cold"}
              </Badge>
              <h1 className="mt-3 truncate text-3xl font-semibold text-[#213343]">{student.full_name}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#5f7182]">
                <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{student.email}</span>
                <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{student.phone ?? "No phone"}</span>
                <span>Source: {student.lead_source ?? "Unknown"}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#eadacc] bg-white/78 p-3 shadow-sm">
              <p className="text-xs font-semibold uppercase text-[#8b5e3c]">Stage</p>
              <p className="mt-1 font-semibold text-[#213343]">{stageLabels[student.stage]}</p>
            </div>
            <div className="rounded-lg border border-[#eadacc] bg-white/78 p-3 shadow-sm">
              <p className="text-xs font-semibold uppercase text-[#8b5e3c]">Paid</p>
              <p className="mt-1 font-semibold text-[#213343]">{formatCurrency(paid)}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 bg-[#fff6ef] p-5 text-sm text-slate-600 dark:bg-white/[0.03] md:grid-cols-4 dark:text-slate-300">
          <p><Activity className="mb-2 h-4 w-4 text-[#c9692c]" /><span className="font-semibold text-[#213343] dark:text-white">Last activity:</span><br />{temperature?.lastInteractionAt ? formatDate(temperature.lastInteractionAt, { dateStyle: "medium", timeStyle: "short" }) : "Not yet"}</p>
          <p><Phone className="mb-2 h-4 w-4 text-[#c9692c]" /><span className="font-semibold text-[#213343] dark:text-white">Contacts:</span><br />{temperature?.contactCount ?? 0}</p>
          <p><Mail className="mb-2 h-4 w-4 text-[#c9692c]" /><span className="font-semibold text-[#213343] dark:text-white">Responses:</span><br />{temperature?.responseCount ?? 0}</p>
          <p><ThermometerSun className="mb-2 h-4 w-4 text-[#c9692c]" /><span className="font-semibold text-[#213343] dark:text-white">Score:</span><br />{temperature?.score ?? 0}</p>
        </div>
      </section>
      <Card>
        <CardHeader
          title="Interaction History"
          description="Chronological timeline of calls, meetings, WhatsApp, emails, and CRM activities (latest first)."
        />
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
              No interactions logged yet.
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="rounded-lg border border-[#eadacc] bg-[#fffaf5] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-sm font-semibold text-ink dark:text-white">
                  {formatDate(activity.occurred_at, { dateStyle: "medium", timeStyle: "short" })} - {activity.channel}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Handled by {activity.actor_name ?? "System"}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{activity.description}</p>
              </div>
            ))
          )}
        </div>
      </Card>
      <StudentEditor initial={student} readOnly={!canEditStudent} />
    </div>
  );
}
