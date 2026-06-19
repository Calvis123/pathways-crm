import { StudentEditor } from "@/components/forms/student-editor";
import { canAccessFinance, getCurrentSession } from "@/lib/auth";

export default async function NewStudentPage() {
  const session = await getCurrentSession();
  return <StudentEditor canSeeFinance={canAccessFinance(session?.role)} />;
}
