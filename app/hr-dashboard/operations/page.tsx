import { ModuleShell } from "@/components/dashboard/module-shell";
import { HrSectionNav } from "@/components/hr/hr-section-nav";
import { Card, CardHeader } from "@/components/ui/card";
import { getConsultations, getDocuments, getPortalMessages, getStudents, getTasks } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function HrOperationsPage() {
  const [students, consultations, documents, tasks, messages] = await Promise.all([
    getStudents(),
    getConsultations(),
    getDocuments(),
    getTasks(),
    getPortalMessages()
  ]);

  const pendingConsultations = consultations.filter((item) => ["pending", "confirmed"].includes(item.status));
  const pendingDocuments = documents.filter((item) => ["pending", "uploaded", "under_review"].includes(item.status));
  const openTasks = tasks.filter((item) => !["completed", "cancelled"].includes(item.status));
  const unreadMessages = messages.filter((item) => item.direction === "student_to_crm" && !item.is_read);
  const earlyPipeline = students.filter((student) => ["lead", "inquiry", "consultation"].includes(student.stage));

  const queues = [
    { label: "Consultations", value: pendingConsultations.length, detail: "Pending or confirmed meetings" },
    { label: "Documents", value: pendingDocuments.length, detail: "Files waiting for review" },
    { label: "Tasks", value: openTasks.length, detail: "Open operational work" },
    { label: "Portal Replies", value: unreadMessages.length, detail: "Unread student messages" }
  ];

  return (
    <ModuleShell
      title="Operations Oversight"
      description="HR oversight of the daily queues that show whether the system is moving cleanly."
    >
      <div className="space-y-6">
        <HrSectionNav />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {queues.map((queue) => (
            <div key={queue.label} className="rounded-xl border border-[#eadacc] bg-white p-5 dark:border-white/10 dark:bg-[#182638]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{queue.label}</p>
              <p className="mt-4 text-3xl font-semibold text-ink dark:text-white">{queue.value}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{queue.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="dark:border-white/10 dark:bg-[#182638]">
            <CardHeader title="Consultation Queue" description="Upcoming work that should be watched for response quality." />
            <div className="space-y-3">
              {pendingConsultations.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#f0dfd0] bg-[#fffaf5] p-4 dark:border-white/10 dark:bg-white/[0.05]">
                  <p className="font-medium text-ink dark:text-white">{item.student?.full_name ?? "Unknown student"}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    {item.status} - {formatDate(item.scheduled_at, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="dark:border-white/10 dark:bg-[#182638]">
            <CardHeader title="Document Queue" description="Student files still needing attention." />
            <div className="space-y-3">
              {pendingDocuments.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#f0dfd0] bg-[#fffaf5] p-4 dark:border-white/10 dark:bg-white/[0.05]">
                  <p className="font-medium text-ink dark:text-white">{item.original_filename}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    {item.student?.full_name ?? "Unknown student"} - {item.status}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="dark:border-white/10 dark:bg-[#182638]">
          <CardHeader title="Pipeline Pressure" description="Early-stage students that still need conversion and follow-through." />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {earlyPipeline.slice(0, 9).map((student) => (
              <div key={student.id} className="rounded-2xl border border-[#f0dfd0] bg-[#fffaf5] p-4 dark:border-white/10 dark:bg-white/[0.05]">
                <p className="font-medium text-ink dark:text-white">{student.full_name}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  {student.stage} - {student.country_interest ?? "Country not set"}
                </p>
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Updated {formatDate(student.updated_at)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </ModuleShell>
  );
}
