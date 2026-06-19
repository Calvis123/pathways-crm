import { NextResponse } from "next/server";
import { z } from "zod";
import { generateVisaChecklistForStudent } from "@/lib/data";

const schema = z.object({
  student_id: z.string().uuid()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const visaRecord = await generateVisaChecklistForStudent(payload.student_id);
    return NextResponse.json({ visaRecord });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not generate visa checklist." },
      { status: 400 }
    );
  }
}
