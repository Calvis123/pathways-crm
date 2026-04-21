import { NextResponse } from "next/server";
import { z } from "zod";
import { sendBulkMessageFromCrm } from "@/lib/data";

const schema = z.object({
  student_ids: z.array(z.string().min(1)).min(1),
  channel: z.enum(["email", "whatsapp", "sms"]).default("email"),
  subject: z.string().optional(),
  message: z.string().optional(),
  body: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const content = (payload.message ?? payload.body ?? "").trim();
    if (content.length < 5) {
      return NextResponse.json({ error: "Message body is required." }, { status: 400 });
    }
    if (payload.channel === "email" && !(payload.subject ?? "").trim()) {
      return NextResponse.json({ error: "Email subject is required." }, { status: 400 });
    }

    const result = await sendBulkMessageFromCrm({
      student_ids: payload.student_ids,
      channel: payload.channel,
      subject: payload.subject,
      message: content
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
