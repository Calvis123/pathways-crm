import { PartnerOperationsDashboard } from "@/components/dashboard/partner-operations-dashboard";
import { getOperatingSystemSnapshot, getStudents } from "@/lib/data";

export default async function PartnerDashboardPage() {
  const [snapshot, students] = await Promise.all([getOperatingSystemSnapshot(), getStudents()]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#eadacc] bg-white px-5 py-5 shadow-sm dark:border-white/10 dark:bg-[#182638]">
        <h1 className="text-2xl font-semibold tracking-tight text-[#213343] dark:text-white">Partner Dashboard</h1>
      </div>
      <PartnerOperationsDashboard
        snapshot={snapshot}
        students={students.map((student) => ({
          id: student.id,
          full_name: student.full_name,
          country_interest: student.country_interest,
          stage: student.stage
        }))}
      />
    </div>
  );
}
