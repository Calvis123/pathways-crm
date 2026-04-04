import { NextResponse } from "next/server";
import { z } from "zod";
import { markCommissionAsPaid } from "@/lib/data";

const schema = z.object({
  student_id: z.string().min(1),
  paid_date: z.string().min(1),
  notes: z.string().optional().nullable()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const student = await markCommissionAsPaid({
      studentId: payload.student_id,
      paidDate: payload.paid_date,
      notes: payload.notes
    });
    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
