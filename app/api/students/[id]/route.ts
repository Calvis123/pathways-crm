import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteStudent, updateStudent } from "@/lib/data";
import { stageOptions } from "@/lib/constants";

const schema = z.object({
  full_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  passport_number: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  country_interest: z.string().optional().nullable(),
  program_level: z.string().optional().nullable(),
  university_name: z.string().optional().nullable(),
  stage: z.enum(stageOptions).optional(),
  consultation_requested: z.boolean().optional(),
  consultation_status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional().nullable(),
  consultation_date: z.string().optional().nullable(),
  assigned_consultant_id: z.string().optional().nullable(),
  ielts_enrolled: z.boolean().optional(),
  ielts_amount: z.number().optional().nullable(),
  ielts_payment_status: z.enum(["paid", "unpaid"]).optional().nullable(),
  payment_status: z.string().optional().nullable(),
  consultation_upfront_paid: z.number().optional(),
  consultation_balance_paid: z.number().optional(),
  notes: z.string().optional().nullable(),
  lead_source: z.string().optional().nullable()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = schema.parse(await request.json());
    const { id } = await params;
    const student = await updateStudent(id, payload);
    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteStudent(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
