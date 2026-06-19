import { DashboardWorkspace } from "@/components/dashboard/workspace";
import { canAccessFinance, getCurrentSession } from "@/lib/auth";
import { getAuditLogs, getDashboardStats, getStudents } from "@/lib/data";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const [students, stats, auditLogs] = await Promise.all([
    getStudents(),
    getDashboardStats(),
    getAuditLogs(20)
  ]);

  const safeStats = canAccessFinance(session?.role)
    ? stats
    : { ...stats, totalRevenue: 0, pendingRevenue: 0, overdueCommissions: 0 };

  return <DashboardWorkspace students={students} stats={safeStats} auditLogs={auditLogs} user={session} />;
}
