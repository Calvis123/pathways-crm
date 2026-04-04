import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmailFromCrm } from "@/lib/data";

const schema = z.object({
  student_ids: z.array(z.string().min(1)).min(1),
  subject: z.string().min(2),
  body: z.string().min(5)
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const result = await sendEmailFromCrm(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
