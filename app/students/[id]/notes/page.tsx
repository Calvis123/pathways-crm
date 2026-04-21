import { notFound } from "next/navigation";
import { StudentProfileNav } from "@/components/layout/student-profile-nav";
import { StudentNotesManager } from "@/components/tables/student-notes-manager";
import { getLeadTemperatureSnapshotByStudentId, getStudentById, getStudentNotes } from "@/lib/data";

export default async function StudentNotesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentById(id);

  if (!student) notFound();

  const [notes, temperature] = await Promise.all([
    getStudentNotes(id),
    getLeadTemperatureSnapshotByStudentId(id)
  ]);
  return (
    <div className="space-y-6">
      <StudentProfileNav studentId={student.id} active="notes" temperature={temperature} />
      <StudentNotesManager student={student} notes={notes} />
    </div>
  );
}
