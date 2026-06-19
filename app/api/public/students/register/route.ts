import { z } from "zod";
import { createPublicStudentRegistration } from "@/lib/data";
import { stageOptions } from "@/lib/constants";
import { jsonWithPublicCors, optionsWithPublicCors } from "@/lib/public-api";
import { normalizeKenyanPhone } from "@/lib/utils";

const stageSchema = z.enum(stageOptions);

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional()
);

const optionalNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return value;
  },
  z.coerce.number().optional()
);

const optionalBoolean = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return value;
}, z.boolean().optional());

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: optionalText,
  passport_number: optionalText,
  location: optionalText,
  country_interest: optionalText,
  program_level: optionalText,
  university_name: optionalText,
  stage: stageSchema.optional(),
  lead_source: optionalText,
  payment_status: optionalText,
  consultation_upfront_paid: optionalNumber,
  consultation_balance_paid: optionalNumber,
  ielts_enrolled: optionalBoolean,
  ielts_amount: optionalNumber,
  ielts_payment_status: z.enum(["paid", "unpaid"]).optional(),
  notes: optionalText,
  source: optionalText,
  campaign: optionalText,
  referral_code: optionalText,
  website: optionalText
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    // Honeypot field for bot submissions.
    if (payload.website) {
      return jsonWithPublicCors(request, { ok: true });
    }

    const phone = payload.phone ? normalizeKenyanPhone(payload.phone) : null;
    if (payload.phone && !phone) {
      return jsonWithPublicCors(
        request,
        { error: "Please enter a valid Kenyan phone number." },
        { status: 400 }
      );
    }

    const student = await createPublicStudentRegistration({
      ...payload,
      phone
    });

    return jsonWithPublicCors(
      request,
      {
        ok: true,
        success: true,
        message: "Application sent successfully.",
        studentId: student.id
      },
      { status: 200 }
    );
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
