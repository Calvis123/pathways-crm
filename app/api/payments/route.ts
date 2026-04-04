import { NextResponse } from "next/server";
import { z } from "zod";
import { createPayment } from "@/lib/data";

const schema = z.object({
  student_id: z.string().min(1),
  payment_type: z.enum(["consultation", "application", "ielts", "visa", "tuition", "other"]),
  amount: z.number().positive(),
  payment_method: z.enum(["cash", "bank_transfer", "mpesa", "card"]),
  status: z.enum(["pending", "partial", "paid", "overdue", "refunded"]).optional(),
  reference_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const payment = await createPayment(payload);
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
