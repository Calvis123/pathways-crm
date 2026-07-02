import { z } from "zod";
import { createPublicConsultationLead } from "@/lib/data";
import { getPublicRequestSite, jsonWithPublicCors, optionsWithPublicCors } from "@/lib/public-api";
import { normalizeKenyanPhone } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(9),
  location: z.string().optional(),
  country_interest: z.string().min(2),
  program_level: z.string().min(2),
  start_date: z.string().optional(),
  source: z.string().optional(),
  source_site: z.string().optional(),
  campaign: z.string().optional(),
  referral_code: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const phone = normalizeKenyanPhone(payload.phone);

    if (!phone) {
      return jsonWithPublicCors(
        request,
        { error: "Please enter a valid Kenyan phone number." },
        { status: 400 }
      );
    }

    const student = await createPublicConsultationLead({
      ...payload,
      phone,
      source_site: payload.source_site ?? getPublicRequestSite(request)
    });

    return jsonWithPublicCors(request, {
      ok: true,
      studentId: student.id,
      calendlyUrl: "https://calendly.com/barakpathways/30min",
      whatsappUrl: "https://wa.me/254113043315"
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
