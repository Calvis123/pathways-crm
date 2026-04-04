import { NextResponse } from "next/server";
import { z } from "zod";
import { recordTrackedStudentPayment } from "@/lib/data";

const schema = z.object({
  student_id: z.string().min(1),
  payment_type: z.enum(["Consultation Balance", "Consultation Upfront", "IELTS Fee"]),
  amount_paid: z.number().positive(),
  payment_date: z.string().min(1),
  payment_method: z.enum(["mpesa", "bank_transfer", "cash", "card", "bank"]),
  payment_notes: z.string().optional().nullable()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const method =
      payload.payment_method === "bank" ? "bank_transfer" : payload.payment_method;

    const student = await recordTrackedStudentPayment({
      studentId: payload.student_id,
      paymentType: payload.payment_type,
      amountPaid: payload.amount_paid,
      paymentDate: payload.payment_date,
      paymentMethod: method,
      notes: payload.payment_notes
    });

    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
