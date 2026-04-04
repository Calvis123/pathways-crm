import { redirect } from "next/navigation";
import { StudentPortalDashboard } from "@/components/portal/student-portal-dashboard";
import { getCurrentPortalStudentSnapshot } from "@/lib/data";

export default async function StudentPortalPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; invalid?: string }>;
}) {
  const { token, invalid } = await searchParams;

  if (token) {
    redirect(`/api/portal/session/token?token=${encodeURIComponent(token)}`);
  }

  const snapshot = await getCurrentPortalStudentSnapshot();
  return <StudentPortalDashboard snapshot={snapshot} invalidToken={invalid === "1"} />;
}
