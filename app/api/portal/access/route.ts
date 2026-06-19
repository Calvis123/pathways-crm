import { NextResponse } from "next/server";
import { z } from "zod";
import { provisionStudentPortalAccess } from "@/lib/data";

const schema = z.object({
  student_id: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const { access, delivery } = await provisionStudentPortalAccess(payload.student_id, "manual");
    return NextResponse.json({
      access,
      delivery,
      link: `/student-portal?token=${encodeURIComponent(access.access_token)}`
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
