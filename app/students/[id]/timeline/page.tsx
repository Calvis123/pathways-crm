import { notFound } from "next/navigation";
import { StudentTimelineView } from "@/components/tables/student-timeline-view";
import { getDocuments, getStudentActivityTimeline, getStudentById, getStudentNotes } from "@/lib/data";

export default async function StudentTimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentById(id);

  if (!student) notFound();

  const [documents, notes, activities] = await Promise.all([
    getDocuments(),
    getStudentNotes(id),
    getStudentActivityTimeline(id)
  ]);

  return (
    <StudentTimelineView
      student={student}
      documents={documents.filter((document) => document.student_id === id)}
      notes={notes}
      activities={activities}
    />
  );
}
