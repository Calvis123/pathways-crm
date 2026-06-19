import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import type { DocumentRecord, Student, StudentActivityEvent, StudentNote } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const progressByStage: Record<Student["stage"], number> = {
  lead: 5,
  qualified: 10,
  inquiry: 10,
  engaged: 20,
  consultation: 25,
  application_ready: 40,
  application: 50,
  submitted: 60,
  offer_secured: 70,
  visa: 80,
  visa_lodged: 85,
  enrolled: 90,
  placed: 100,
  employment: 100,
  lost: 0
};

export function StudentTimelineView({
  student,
  documents,
  notes,
  activities
}: {
  student: Student;
  documents: DocumentRecord[];
  notes: StudentNote[];
  activities: StudentActivityEvent[];
}) {
  const progress = progressByStage[student.stage] ?? 0;
  const milestones = [
    { title: "Inquiry Received", done: true, detail: `Lead source: ${student.lead_source ?? "Website"}` },
    { title: "Consultation", done: progress >= 25, detail: student.consultation_status ?? "Pending scheduling" },
    { title: "Application", done: progress >= 50, detail: student.university_name ?? "University not selected" },
    { title: "Visa", done: progress >= 80, detail: student.visa_status ?? "Visa not started" },
    { title: "Placement", done: progress >= 100, detail: student.country_interest ?? "Country not set" }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={`${student.full_name} Timeline`}
          description={`${student.email} · ${student.country_interest ?? "Country not set"} · ${student.stage}`}
          action={<Link href={`/students/${student.id}`} className="text-sm font-medium text-ink underline">Back to student</Link>}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-[#eadacc] bg-[#fffaf5] p-4">
            <p className="text-sm text-slate-500">Progress</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{progress}%</p>
          </div>
          <div className="rounded-lg border border-[#eadacc] bg-[#fffaf5] p-4">
            <p className="text-sm text-slate-500">Total Paid</p>
            <p className="mt-2 text-3xl font-semibold text-ink">
              {formatCurrency(student.consultation_upfront_paid + student.consultation_balance_paid)}
            </p>
          </div>
          <div className="rounded-lg border border-[#eadacc] bg-[#fffaf5] p-4">
            <p className="text-sm text-slate-500">Documents</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{documents.length}</p>
          </div>
        </div>
        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Journey Milestones" description="Snapshot of the student journey similar to the legacy timeline view." />
        <div className="space-y-4">
          {milestones.map((item, index) => (
            <div key={item.title} className="flex gap-4">
              <div className={`mt-1 h-4 w-4 rounded-full ${item.done ? "bg-gold" : "bg-slate-200"}`} />
              <div className="flex-1 rounded-lg border border-[#eadacc] bg-[#fffaf5] p-4">
                <p className="font-medium text-ink">{index + 1}. {item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Documents" description={`${documents.length} uploaded records`} />
          <div className="space-y-3">
            {documents.map((document) => (
              <div key={document.id} className="rounded-lg border border-[#eadacc] bg-[#fffaf5] p-4">
                <p className="font-medium text-ink">{document.document_type}</p>
                <p className="text-sm text-slate-500">{document.original_filename}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {document.status} · {formatDate(document.uploaded_at)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Notes" description="Internal CRM notes tied to this student." />
          <div className="space-y-3">
            {notes.slice(0, 6).map((note) => (
              <div key={note.id} className="rounded-lg border border-[#eadacc] bg-[#fffaf5] p-4">
                <p className="font-medium text-ink">{note.note_type} · {note.priority}</p>
                <p className="mt-2 text-sm text-slate-700">{note.note_text}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {note.creator_name ?? "System"} · {formatDate(note.created_at, { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Activities & Conversations"
          description="Unified follow-up history across notes, meetings, email, WhatsApp, portal messages, payments, and document actions."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={`/students/${student.id}/notes`} className="text-sm font-medium text-ink underline">
                Log follow-up
              </Link>
              <Link href="/email-center" className="text-sm font-medium text-ink underline">
                Open Email Center
              </Link>
            </div>
          }
        />
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#d9c1ad] px-4 py-10 text-center text-sm text-slate-500">
              No activity has been logged for this student yet.
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className={`mt-1 h-4 w-4 rounded-full ${channelTone(activity.channel)}`} />
                <div className="flex-1 rounded-lg border border-[#eadacc] bg-[#fffaf5] p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium text-ink">{activity.title}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        {activity.channel} · {activity.direction}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDate(activity.occurred_at, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{activity.description}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    {activity.actor_name ? <span>By {activity.actor_name}</span> : null}
                    {activity.meta ? <span>{activity.meta}</span> : null}
                    <span>Source: {activity.source.replace(/_/g, " ")}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function channelTone(channel: StudentActivityEvent["channel"]) {
  if (channel === "call") return "bg-sky-500";
  if (channel === "meeting") return "bg-violet-500";
  if (channel === "email") return "bg-amber-500";
  if (channel === "whatsapp") return "bg-emerald-500";
  if (channel === "reminder") return "bg-rose-500";
  if (channel === "portal") return "bg-indigo-500";
  if (channel === "payment") return "bg-gold";
  if (channel === "document") return "bg-[#516672]";
  return "bg-slate-300";
}
