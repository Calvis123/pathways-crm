import { SegmentsTable } from "@/components/tables/segments-table";
import { getSegmentSummaries, getStudents } from "@/lib/data";
import type { SegmentKey } from "@/lib/types";

type SegmentFilter = SegmentKey | "all";
const validSegments = new Set<SegmentKey>([
  "ready_to_go",
  "needs_guidance",
  "price_sensitive",
  "ielts_focused",
  "vip",
  "unsegmented"
]);

export default async function SegmentsPage({
  searchParams
}: {
  searchParams: Promise<{ segment?: string }>;
}) {
  const params = await searchParams;
  const requestedSegment = params.segment;
  const filterSegment =
    requestedSegment && validSegments.has(requestedSegment as SegmentKey)
      ? (requestedSegment as SegmentKey)
      : "all";

  const [students, summaries] = await Promise.all([getStudents(), getSegmentSummaries()]);

  const rows = students
    .map((student) => ({
      ...student,
      effective_segment:
        student.segment && validSegments.has(student.segment as SegmentKey)
          ? (student.segment as SegmentKey)
          : "unsegmented",
      effective_segment_score: student.segment_score ?? 0,
      total_paid:
        student.payment_status === "full"
          ? 40000
          : (student.consultation_upfront_paid ?? 0) + (student.consultation_balance_paid ?? 0)
    }))
    .filter((student) => filterSegment === "all" || student.effective_segment === filterSegment)
    .sort((a, b) => {
      if (b.effective_segment_score !== a.effective_segment_score) {
        return b.effective_segment_score - a.effective_segment_score;
      }
      return b.created_at.localeCompare(a.created_at);
    });

  return (
    <SegmentsTable
      students={rows}
      summaries={summaries}
      totalStudents={students.length}
      filterSegment={filterSegment as SegmentFilter}
    />
  );
}
