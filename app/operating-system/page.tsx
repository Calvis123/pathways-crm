import { OperatingSystemDashboard } from "@/components/dashboard/operating-system-dashboard";
import { getOperatingSystemSnapshot } from "@/lib/data";

export default async function OperatingSystemPage() {
  const snapshot = await getOperatingSystemSnapshot();

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#eadacc] bg-white px-5 py-5 shadow-sm dark:border-white/10 dark:bg-[#182638]">
        <h1 className="text-2xl font-semibold tracking-tight text-[#213343] dark:text-white">Operating System</h1>
      </div>
      <OperatingSystemDashboard snapshot={snapshot} />
    </div>
  );
}
