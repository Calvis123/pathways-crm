import { NextResponse } from "next/server";
import { z } from "zod";
import { createFollowUpLog, getStudents, logAudit } from "@/lib/data";
import { normalizeKenyanPhone } from "@/lib/utils";

const schema = z.object({
  student_ids: z.array(z.string().min(1)).min(1),
  message: z.string().min(5)
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const students = await getStudents();
    const selected = students.filter((student) => payload.student_ids.includes(student.id));

    if (selected.length === 0) {
      return NextResponse.json({ error: "No valid students were selected." }, { status: 400 });
    }

    const recipients = selected.flatMap((student) => {
        const normalizedPhone = student.phone ? normalizeKenyanPhone(student.phone) : null;
        if (!normalizedPhone) return [];

        const personalizedMessage = payload.message
          .replace(/\{name\}/g, student.full_name)
          .replace(/\{country\}/g, student.country_interest ?? "your study destination");

        return [{
          id: student.id,
          full_name: student.full_name,
          phone: normalizedPhone,
          link: `https://wa.me/${normalizedPhone.replace("+", "")}?text=${encodeURIComponent(personalizedMessage)}`
        }];
      });

    if (recipients.length === 0) {
      return NextResponse.json({ error: "None of the selected students have valid WhatsApp numbers." }, { status: 400 });
    }

    for (const recipient of recipients) {
      const student = selected.find((item) => item.id === recipient.id);
      if (!student) continue;
      await createFollowUpLog({
        student_id: student.id,
        note_type: "whatsapp",
        priority: "medium",
        tags: "whatsapp,bulk,outgoing",
        note_text: payload.message
          .replace(/\{name\}/g, student.full_name)
          .replace(/\{country\}/g, student.country_interest ?? "your study destination")
      });
    }

    await logAudit({
      action: "WhatsApp Bulk Campaign Prepared",
      table_name: "students",
      record_label: `${recipients.length} recipients`,
      new_value: JSON.stringify({
        student_ids: selected.map((student) => student.id),
        message: payload.message
      })
    });

    return NextResponse.json({
      ok: true,
      recipients
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
