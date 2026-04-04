import { ModuleShell } from "@/components/dashboard/module-shell";
import { SalesFunnelBoard } from "@/components/dashboard/sales-funnel-board";
import { getStudents } from "@/lib/data";

export default async function SalesFunnelPage() {
  const students = await getStudents();

  return (
    <ModuleShell
      title="Sales Funnel Tracker"
      description="Visual pipeline showing where students are in the journey, with drag-and-drop stage updates."
    >
      <SalesFunnelBoard students={students} />
    </ModuleShell>
  );
}
