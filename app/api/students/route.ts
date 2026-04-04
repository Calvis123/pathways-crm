import { NextResponse } from "next/server";
import { z } from "zod";
import { createStudent } from "@/lib/data";

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  passport_number: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  country_interest: z.string().optional().nullable(),
  program_level: z.string().optional().nullable(),
  university_name: z.string().optional().nullable(),
  stage: z.enum(["lead", "inquiry", "consultation", "application", "visa", "enrolled", "placed", "employment", "lost"]).optional(),
  lead_source: z.string().optional().nullable(),
  consultation_requested: z.union([z.literal("true"), z.literal("false"), z.boolean()]).optional(),
  ielts_enrolled: z.boolean().optional(),
  ielts_amount: z.number().optional(),
  ielts_payment_status: z.enum(["paid", "unpaid"]).optional(),
  payment_status: z.string().optional().nullable(),
  consultation_upfront_paid: z.number().optional(),
  consultation_balance_paid: z.number().optional(),
  notes: z.string().optional().nullable()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const student = await createStudent({
      ...payload,
      consultation_requested:
        typeof payload.consultation_requested === "boolean"
          ? payload.consultation_requested
          : payload.consultation_requested === "true"
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
