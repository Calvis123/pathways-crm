import { NextResponse } from "next/server";
import { z } from "zod";
import { checkStudentDuplicates } from "@/lib/data";

const schema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  passport_number: z.string().optional(),
  excludeId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const duplicates = await checkStudentDuplicates(payload);
    return NextResponse.json({ duplicates });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
