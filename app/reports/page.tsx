import { ReportsOverview } from "@/components/tables/reports-overview";
import { getStudents } from "@/lib/data";
import { CONSULTATION_FEE, getConsultationPaid } from "@/lib/finance";
import type { Student } from "@/lib/types";

export default async function ReportsPage() {
  const students = await getStudents();
  const totalStudents = students.length;
  const placedStudents = students.filter((student) => student.stage === "placed").length;
  const conversionRate = totalStudents > 0 ? Number(((placedStudents / totalStudents) * 100).toFixed(1)) : 0;

  const consultationRevenue = students.reduce((sum, student) => {
    if (student.payment_status === "full" || student.payment_status === "paid") return sum + CONSULTATION_FEE;
    return sum + getConsultationPaid(student);
  }, 0);

  const ieltsRevenue = students.reduce((sum, student) => {
    if (student.ielts_payment_status !== "paid") return sum;
    return sum + (student.ielts_amount ?? 0);
  }, 0);

  const teamMap = new Map<string, number>();
  for (const student of students) {
    if (!student.created_by) continue;
    teamMap.set(student.created_by, (teamMap.get(student.created_by) ?? 0) + 1);
  }

  const teamPerformance = Array.from(teamMap.entries())
    .map(([created_by, count]) => ({ created_by, count }))
    .sort((a, b) => b.count - a.count);

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const stuckStudents = students
    .slice()
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 50)
    .filter((student) => new Date(student.updated_at) < cutoff)
    .slice(0, 10)
    .map((student) => ({
      id: student.id,
      full_name: student.full_name,
      phone: student.phone,
      stage: student.stage,
      updated_at: student.updated_at
    }));

  function topCounts(items: Student[], key: (student: Student) => string | null | undefined, limit = 5) {
    const counts = new Map<string, number>();
    for (const item of items) {
      const value = key(item)?.trim();
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, limit);
  }

  const topUniversities = topCounts(students, (student) => student.university_name ?? null);
  const topPrograms = topCounts(students, (student) => student.program_level ?? null);

  return (
    <ReportsOverview
      metrics={{
        totalRevenue: consultationRevenue + ieltsRevenue,
        activeStudents: totalStudents,
        conversionRate,
        pendingPaymentsLabel: stuckStudents.length > 0 ? `${stuckStudents.length} flagged` : "Processing"
      }}
      teamPerformance={teamPerformance}
      stuckStudents={stuckStudents}
      topUniversities={topUniversities}
      topPrograms={topPrograms}
    />
  );
}
