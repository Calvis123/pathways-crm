import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPortalMessage } from "@/lib/data";

const schema = z.object({
  student_id: z.string().min(1),
  subject: z.string().min(2),
  message: z.string().min(2)
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const message = await sendPortalMessage(payload);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
