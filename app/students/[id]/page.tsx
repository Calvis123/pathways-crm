import { notFound } from "next/navigation";
import { StudentEditor } from "@/components/forms/student-editor";
import { StudentProfileNav } from "@/components/layout/student-profile-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth";
import { getLeadTemperatureSnapshotByStudentId, getStudentActivityTimeline, getStudentById } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentById(id);
  const session = await getCurrentSession();

  if (!student) notFound();

  const [temperature, activities] = await Promise.all([
    getLeadTemperatureSnapshotByStudentId(id),
    getStudentActivityTimeline(id)
  ]);

  const temperatureTone =
    temperature?.status === "hot"
      ? "bg-red-100 text-red-800 ring-1 ring-red-300 dark:bg-red-500/20 dark:text-red-100 dark:ring-red-400/40"
      : temperature?.status === "warm"
        ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-400/40"
        : "bg-amber-200 text-amber-950 ring-1 ring-amber-500 dark:bg-amber-500/30 dark:text-amber-50 dark:ring-amber-300/70";

  return (
    <div className="space-y-6">
      <StudentProfileNav studentId={student.id} active="profile" temperature={temperature} />
      <Card>
        <CardHeader
          title={student.full_name}
          description={`${student.email} | ${student.phone ?? "No phone"} | Source: ${student.lead_source ?? "Unknown"}`}
          action={
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
          }
        />
        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-4 dark:text-slate-300">
          <p>
            <span className="font-semibold text-ink dark:text-white">Last activity:</span>{" "}
            {temperature?.lastInteractionAt
              ? formatDate(temperature.lastInteractionAt, { dateStyle: "medium", timeStyle: "short" })
              : "Not yet"}
          </p>
          <p><span className="font-semibold text-ink dark:text-white">Contacts:</span> {temperature?.contactCount ?? 0}</p>
          <p><span className="font-semibold text-ink dark:text-white">Responses:</span> {temperature?.responseCount ?? 0}</p>
          <p><span className="font-semibold text-ink dark:text-white">Score:</span> {temperature?.score ?? 0}</p>
        </div>
      </Card>
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
              <div key={activity.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
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
      <StudentEditor initial={student} readOnly={session?.role === "employee"} />
    </div>
  );
}
