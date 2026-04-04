import { DashboardWorkspace } from "@/components/dashboard/workspace";
import { getCurrentSession } from "@/lib/auth";
import { getAuditLogs, getDashboardStats, getStudents } from "@/lib/data";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const [students, stats, auditLogs] = await Promise.all([
    getStudents(),
    getDashboardStats(),
    getAuditLogs(20)
  ]);

  return <DashboardWorkspace students={students} stats={stats} auditLogs={auditLogs} user={session} />;
}
