import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicConsultationLead } from "@/lib/data";
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
  campaign: z.string().optional(),
  referral_code: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const phone = normalizeKenyanPhone(payload.phone);

    if (!phone) {
      return NextResponse.json(
        { error: "Please enter a valid Kenyan phone number." },
        { status: 400 }
      );
    }

    const student = await createPublicConsultationLead({
      ...payload,
      phone
    });

    return NextResponse.json({
      ok: true,
      studentId: student.id,
      calendlyUrl: "https://calendly.com/barakpathways/30min",
      whatsappUrl: "https://wa.me/254113043315"
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
