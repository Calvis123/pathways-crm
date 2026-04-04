import { ModuleShell } from "@/components/dashboard/module-shell";
import { StudentsTable } from "@/components/tables/students-table";
import { getCurrentSession } from "@/lib/auth";
import { getStudents } from "@/lib/data";

export default async function BulkActionsPage() {
  const session = await getCurrentSession();
  const students = await getStudents();

  return (
    <ModuleShell
      title="Bulk Actions"
      description="Bulk stage, payment, export, and delete operations for student records."
    >
      <StudentsTable students={students} role={session?.role ?? null} />
    </ModuleShell>
  );
}
