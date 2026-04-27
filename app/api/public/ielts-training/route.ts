import { z } from "zod";
import { createPublicIeltsLead } from "@/lib/data";
import { jsonWithPublicCors, optionsWithPublicCors } from "@/lib/public-api";
import { normalizeKenyanPhone } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(9),
  location: z.string().optional(),
  target_score: z.string().optional(),
  destination: z.string().optional(),
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
        { error: "Please enter a valid Kenyan phone number." },
        { status: 400 }
      );
    }

    const student = await createPublicIeltsLead({
      ...payload,
      phone
    });

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
