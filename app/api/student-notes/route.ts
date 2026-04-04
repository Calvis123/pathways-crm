import { NextResponse } from "next/server";
import { z } from "zod";
import { createStudentNote } from "@/lib/data";

const schema = z.object({
  student_id: z.string().min(1),
  note_text: z.string().min(2),
  note_type: z.enum(["general", "call", "meeting", "email", "whatsapp", "payment", "visa", "important"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  is_private: z.boolean().optional(),
  tags: z.string().optional().nullable(),
  reminder_date: z.string().optional().nullable()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const note = await createStudentNote(payload);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
