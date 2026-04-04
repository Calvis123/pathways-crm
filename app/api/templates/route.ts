import { NextResponse } from "next/server";
import { z } from "zod";
import { createEmailTemplate } from "@/lib/data";

const schema = z.object({
  template_name: z.string().min(2),
  category: z.string().min(2),
  subject: z.string().optional().default(""),
  body: z.string().min(5)
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const template = await createEmailTemplate(payload);
    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
