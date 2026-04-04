import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStudentPortalSession } from "@/lib/auth";
import { updateStudentProfileFromPortal } from "@/lib/data";

const schema = z.object({
  phone: z.string().optional().nullable(),
  country_interest: z.string().optional().nullable(),
  program_level: z.string().optional().nullable(),
  university_name: z.string().optional().nullable()
});

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentStudentPortalSession();
    if (!session) {
      return NextResponse.json({ error: "Portal session expired." }, { status: 401 });
    }

    const payload = schema.parse(await request.json());
    const student = await updateStudentProfileFromPortal({
      studentId: session.student_id,
      phone: payload.phone ?? null,
      country_interest: payload.country_interest ?? null,
      program_level: payload.program_level ?? null,
      university_name: payload.university_name ?? null
    });

    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
