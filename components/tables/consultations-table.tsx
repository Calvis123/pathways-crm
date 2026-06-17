import type { Consultation } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";

const tones: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800"
};

export function ConsultationsTable({ consultations }: { consultations: Consultation[] }) {
  return (
    <Card>
      <CardHeader title="Consultations" description="The public booking page in the old system fed this operational queue." />
      <div className="grid gap-4 lg:grid-cols-2">
        {consultations.map((consultation) => (
          <div key={consultation.id} className="rounded-xl border border-[#eadacc] bg-[#fffaf5] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-ink">{consultation.student?.full_name ?? consultation.student_id}</p>
                <p className="mt-1 text-sm text-slate-500">{consultation.student?.email ?? "No email"}</p>
              </div>
              <Badge className={tones[consultation.status]}>{consultation.status}</Badge>
            </div>
            <p className="mt-4 text-sm text-slate-600">Scheduled for {formatDate(consultation.scheduled_at, { timeStyle: "short" })}</p>
            {consultation.notes ? <p className="mt-2 text-sm text-slate-500">{consultation.notes}</p> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
