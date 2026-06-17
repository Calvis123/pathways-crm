import { stageLabels } from "@/lib/constants";
import type { Student } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";

export function StageBoard({ groups }: { groups: Array<{ stage: keyof typeof stageLabels; students: Student[] }> }) {
  return (
    <Card>
      <CardHeader
        title="Student Pipeline"
        description="This board mirrors the legacy stage-based CRM flow, from new leads through placement."
      />
      <div className="grid gap-4 xl:grid-cols-3">
        {groups.map((group) => (
          <div key={group.stage} className="rounded-xl border border-[#f0dfd0] bg-[#fffaf5] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-ink">{stageLabels[group.stage]}</h3>
              <Badge className="bg-white text-slate-600 ring-1 ring-slate-200">{group.students.length}</Badge>
            </div>
            <div className="space-y-3">
              {group.students.slice(0, 4).map((student) => (
                <div key={student.id} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                  <p className="font-medium text-ink">{student.full_name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {student.country_interest ?? "No country"} · {student.program_level ?? "No program"}
                  </p>
                </div>
              ))}
              {group.students.length === 0 ? <p className="text-sm text-slate-400">No students in this stage.</p> : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
