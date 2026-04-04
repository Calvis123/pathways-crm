import { NextResponse } from "next/server";
import { z } from "zod";
import { bulkSendPaymentReminders, sendPaymentReminder } from "@/lib/data";

const methodEnum = z.enum(["whatsapp", "sms"]);

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("send_reminder"),
    student_id: z.string().min(1),
    method: methodEnum.optional()
  }),
  z.object({
    action: z.literal("bulk_send"),
    student_ids: z.array(z.string().min(1)).min(1),
    method: methodEnum.optional()
  })
]);

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    if (payload.action === "send_reminder") {
      const result = await sendPaymentReminder({
        studentId: payload.student_id,
        method: payload.method
      });
      return NextResponse.json(result);
    }

    const result = await bulkSendPaymentReminders({
      studentIds: payload.student_ids,
      method: payload.method
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
