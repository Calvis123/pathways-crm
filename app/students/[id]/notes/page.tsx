import { notFound } from "next/navigation";
import { StudentNotesManager } from "@/components/tables/student-notes-manager";
import { getStudentById, getStudentNotes } from "@/lib/data";

export default async function StudentNotesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentById(id);

  if (!student) notFound();

  const notes = await getStudentNotes(id);
  return <StudentNotesManager student={student} notes={notes} />;
}
