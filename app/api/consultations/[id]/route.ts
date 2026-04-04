import { NextResponse } from "next/server";
import { z } from "zod";
import { updateConsultation } from "@/lib/data";

const schema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  notes: z.string().optional(),
  append_note: z.string().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = schema.parse(await request.json());
    const { id } = await params;
    const consultation = await updateConsultation({ id, ...payload });
    return NextResponse.json(consultation);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
