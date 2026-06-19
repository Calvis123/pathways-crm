import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStudentPortalSession } from "@/lib/auth";
import { changeStudentPortalPassword } from "@/lib/data";

const schema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8)
});

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentStudentPortalSession();
    if (!session) {
      return NextResponse.json({ error: "Portal session expired." }, { status: 401 });
    }

    const payload = schema.parse(await request.json());
    await changeStudentPortalPassword({
      studentId: session.student_id,
      current_password: payload.current_password,
      new_password: payload.new_password
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
