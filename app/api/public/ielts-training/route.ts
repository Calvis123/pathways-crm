import { z } from "zod";
import { createPublicIeltsLead, sendIeltsRegistrationNotification } from "@/lib/data";
import { jsonWithPublicCors, optionsWithPublicCors } from "@/lib/public-api";
import { normalizeKenyanPhone } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(9),
  location: z.string().optional(),
  target_score: z.string().optional(),
  destination: z.string().optional(),
  test_type: z.string().optional(),
  test_format: z.string().optional(),
  source: z.string().optional(),
  campaign: z.string().optional(),
  website: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    if (payload.website) {
      return jsonWithPublicCors(request, { ok: true });
    }

    const phone = normalizeKenyanPhone(payload.phone);
    if (!phone) {
      return jsonWithPublicCors(
        request,
        { error: "Enter a valid Kenyan phone number beginning with 07, 01, +2547, or +2541." },
        { status: 400 }
      );
    }

    const student = await createPublicIeltsLead({
      ...payload,
      phone
    });

    try {
      await sendIeltsRegistrationNotification({
        student,
        target_score: payload.target_score,
        destination: payload.destination,
        test_type: payload.test_type,
        test_format: payload.test_format,
        source: payload.source,
        campaign: payload.campaign
      });
    } catch (notificationError) {
      console.error("IELTS registration was saved, but the staff notification failed.", notificationError);
    }

    return jsonWithPublicCors(request, {
      ok: true,
      studentId: student.id,
      whatsappUrl: "https://wa.me/254113043315",
      consultationUrl: "/book-consultation"
    });
  } catch (error) {
    return jsonWithPublicCors(
      request,
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}

export async function OPTIONS(request: Request) {
  return optionsWithPublicCors(request);
}
