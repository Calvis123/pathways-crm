import { IeltsDashboardTable } from "@/components/tables/ielts-dashboard-table";
import { getStudents } from "@/lib/data";
import type { Student } from "@/lib/types";

const STUDENTS_PER_PAGE = 25;
const TARGET_SCORE_PATTERN = /Target Score:\s*([0-9.]+)/i;

function extractTargetScore(student: Student) {
  const matches = student.notes?.match(TARGET_SCORE_PATTERN);
  return matches?.[1] ?? null;
}

export default async function IeltsDashboardPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const pageParam = resolvedSearchParams.page;
  const rawPage = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);

  const students = await getStudents();
  const ieltsStudents = students
    .filter((student) => student.ielts_enrolled)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalStudents = ieltsStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / STUDENTS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * STUDENTS_PER_PAGE;
  const paginatedStudents = ieltsStudents.slice(offset, offset + STUDENTS_PER_PAGE);

  const withResults = ieltsStudents.filter(
    (student) => student.ielts_overall_score !== null && student.ielts_overall_score !== undefined
  ).length;
  const pendingResults = Math.max(totalStudents - withResults, 0);

  const scores = ieltsStudents
    .map((student) => student.ielts_overall_score)
    .filter((score): score is number => score !== null && score !== undefined);
  const avgScore = scores.length > 0 ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)) : 0;

  const totalSessions = ieltsStudents.reduce((sum, student) => sum + (student.ielts_session_count ?? 0), 0);
  const avgSessions = totalStudents > 0 ? Number((totalSessions / totalStudents).toFixed(1)) : 0;

  const targetScoreCounts = new Map<string, number>();
  for (const student of ieltsStudents) {
    const targetScore = extractTargetScore(student);
    if (!targetScore) {
      continue;
    }

    targetScoreCounts.set(targetScore, (targetScoreCounts.get(targetScore) ?? 0) + 1);
  }

  const targetScoreBreakdown = Array.from(targetScoreCounts.entries())
    .sort((a, b) => Number.parseFloat(a[0]) - Number.parseFloat(b[0]))
    .map(([score, count]) => ({ score, count }));

  const showingFrom = totalStudents > 0 ? offset + 1 : 0;
  const showingTo = totalStudents > 0 ? Math.min(offset + STUDENTS_PER_PAGE, totalStudents) : 0;

  const rows = paginatedStudents.map((student) => ({
    id: student.id,
    full_name: student.full_name,
    phone: student.phone,
    location: student.location,
    targetScore: extractTargetScore(student),
    currentScore: student.ielts_overall_score ?? null,
    sessionCount: student.ielts_session_count ?? 0,
    testDate: student.ielts_test_date ?? null,
    paymentStatus: student.ielts_payment_status ?? null
  }));

  return (
    <IeltsDashboardTable
      rows={rows}
      page={safePage}
      totalPages={totalPages}
      totalStudents={totalStudents}
      showingFrom={showingFrom}
      showingTo={showingTo}
      stats={{
        withResults,
        pendingResults,
        avgScore,
        totalSessions,
        avgSessions
      }}
      targetScoreBreakdown={targetScoreBreakdown}
    />
  );
}
