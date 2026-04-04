import { NextResponse } from "next/server";
import { z } from "zod";
import { createExpense } from "@/lib/data";

const schema = z.object({
  category: z.enum([
    "rent",
    "salaries",
    "marketing",
    "utilities",
    "office_supplies",
    "travel",
    "training",
    "internet",
    "software",
    "other"
  ]),
  amount: z.number().positive(),
  description: z.string().optional().nullable(),
  expense_date: z.string().min(1),
  payment_method: z.enum(["cash", "mpesa", "bank", "card"]).optional().nullable(),
  receipt_number: z.string().optional().nullable(),
  vendor: z.string().optional().nullable()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const expense = await createExpense(payload);
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
