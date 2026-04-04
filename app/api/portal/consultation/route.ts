import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStudentPortalSession } from "@/lib/auth";
import { requestConsultationFromPortal } from "@/lib/data";

const schema = z.object({
  preferred_date: z.string().min(1),
  preferred_time: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const session = await getCurrentStudentPortalSession();
    if (!session) {
      return NextResponse.json({ error: "Portal session expired." }, { status: 401 });
    }

    const payload = schema.parse(await request.json());
    await requestConsultationFromPortal({
      studentId: session.student_id,
      preferred_date: payload.preferred_date,
      preferred_time: payload.preferred_time
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
