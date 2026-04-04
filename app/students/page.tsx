import { StudentsTable } from "@/components/tables/students-table";
import { getCurrentSession } from "@/lib/auth";
import { getStudents } from "@/lib/data";

export default async function StudentsPage() {
  const session = await getCurrentSession();
  const students = await getStudents();
  return <StudentsTable students={students} role={session?.role ?? null} />;
}
