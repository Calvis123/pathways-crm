import { notFound } from "next/navigation";
import { StudentProfileNav } from "@/components/layout/student-profile-nav";
import { StudentTimelineView } from "@/components/tables/student-timeline-view";
import { getDocuments, getLeadTemperatureSnapshotByStudentId, getStudentActivityTimeline, getStudentById, getStudentNotes } from "@/lib/data";

export default async function StudentTimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentById(id);

  if (!student) notFound();

  const [documents, notes, activities, temperature] = await Promise.all([
    getDocuments(),
    getStudentNotes(id),
    getStudentActivityTimeline(id),
    getLeadTemperatureSnapshotByStudentId(id)
  ]);

  return (
    <div className="space-y-6">
      <StudentProfileNav studentId={student.id} active="timeline" temperature={temperature} />
      <StudentTimelineView
        student={student}
        documents={documents.filter((document) => document.student_id === id)}
        notes={notes}
        activities={activities}
      />
    </div>
  );
}
