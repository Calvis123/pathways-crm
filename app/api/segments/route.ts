import { NextResponse } from "next/server";
import { z } from "zod";
import { autoSegmentStudents, bulkUpdateStudentSegments, updateStudentSegment } from "@/lib/data";

const segmentEnum = z.enum([
  "ready_to_go",
  "needs_guidance",
  "price_sensitive",
  "ielts_focused",
  "vip",
  "unsegmented"
]);

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("auto_segment")
  }),
  z.object({
    action: z.literal("update_segment"),
    student_id: z.string().min(1),
    segment: segmentEnum,
    reason: z.string().optional().nullable()
  }),
  z.object({
    action: z.literal("bulk_update"),
    student_ids: z.array(z.string().min(1)).min(1),
    segment: segmentEnum
  })
]);

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    if (payload.action === "auto_segment") {
      const result = await autoSegmentStudents();
      return NextResponse.json(result);
    }

    if (payload.action === "update_segment") {
      const student = await updateStudentSegment({
        studentId: payload.student_id,
        segment: payload.segment,
        reason: payload.reason
      });
      return NextResponse.json(student);
    }

    const result = await bulkUpdateStudentSegments({
      studentIds: payload.student_ids,
      segment: payload.segment
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
