import { NextResponse } from "next/server";
import { z } from "zod";
import { resetStudentPortalPasswordByEmail } from "@/lib/data";

const schema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    await resetStudentPortalPasswordByEmail(payload.email);
    return NextResponse.json({
      ok: true,
      message: "If this email is registered, a new temporary password has been sent."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
