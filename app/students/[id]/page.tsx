import { notFound } from "next/navigation";
import Link from "next/link";
import { StudentEditor } from "@/components/forms/student-editor";
import { getCurrentSession } from "@/lib/auth";
import { getStudentById } from "@/lib/data";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentById(id);
  const session = await getCurrentSession();

  if (!student) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Link href={`/students/${student.id}/timeline`} className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-slate-200">
          View Timeline
        </Link>
        <Link href={`/students/${student.id}/notes`} className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-slate-200">
          Manage Notes
        </Link>
        <Link href={`/email-center?student=${student.id}`} className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-slate-200">
          Email Student
        </Link>
      </div>
      <StudentEditor initial={student} readOnly={session?.role === "employee"} />
    </div>
  );
}
