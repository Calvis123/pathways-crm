import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteStudentNote, updateStudentNote } from "@/lib/data";

const schema = z.object({
  note_text: z.string().min(2)
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = schema.parse(await request.json());
    const { id } = await params;
    const note = await updateStudentNote(id, payload.note_text);
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteStudentNote(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
