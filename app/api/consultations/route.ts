import { NextResponse } from "next/server";
import { z } from "zod";
import { createConsultation } from "@/lib/data";

const schema = z.object({
  student_id: z.string().uuid(),
  scheduled_at: z.string(),
  notes: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const consultation = await createConsultation(payload);
    return NextResponse.json(consultation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
