import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createApplicationRecord,
  createPartnerAgreementRecord,
  createPartnerRecord,
  createProgrammeRecord,
  createRevenueRecord,
  deletePartnerRecord,
  updateApplicationRecord,
  updatePartnerAgreementRecord,
  updatePartnerRecord,
  updateProgrammeRecord
} from "@/lib/data";

const nullableText = z.preprocess((value) => (value === "" ? null : value), z.string().nullable().optional());
const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().optional().nullable()
);

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create_partner"),
    name: z.string().min(2),
    type: z.enum(["university", "digital_skills_platform", "employer"]),
    country: nullableText,
    agreement_status: z.enum(["negotiation", "legal_review", "signed", "active", "renewal_due", "cancelled"]).optional(),
    primary_contact_name: nullableText,
    primary_contact_email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
    response_time_hours: optionalNumber,
    satisfaction_score: optionalNumber
  }),
  z.object({
    action: z.literal("update_partner"),
    id: z.string().uuid(),
    name: z.string().min(2).optional(),
    type: z.enum(["university", "digital_skills_platform", "employer"]).optional(),
    country: nullableText,
    agreement_status: z.enum(["negotiation", "legal_review", "signed", "active", "renewal_due", "cancelled"]).optional(),
    primary_contact_name: nullableText,
    primary_contact_email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
    response_time_hours: optionalNumber,
    satisfaction_score: optionalNumber
  }),
  z.object({
    action: z.literal("delete_partner"),
    id: z.string().uuid()
  }),
  z.object({
    action: z.literal("create_agreement"),
    partner_id: z.string().uuid(),
    agreement_type: z.enum(["retainer", "commission", "bonus"]),
    status: z.enum(["negotiation", "legal_review", "signed", "active", "renewal_due", "cancelled"]).optional(),
    legal_review_complete: z.boolean().optional(),
    commission_rate: optionalNumber,
    retainer_amount: optionalNumber,
    renewal_date: nullableText
  }),
  z.object({
    action: z.literal("update_agreement"),
    id: z.string().uuid(),
    status: z.enum(["negotiation", "legal_review", "signed", "active", "renewal_due", "cancelled"]).optional(),
    legal_review_complete: z.boolean().optional(),
    commission_rate: optionalNumber,
    retainer_amount: optionalNumber,
    renewal_date: nullableText
  }),
  z.object({
    action: z.literal("create_programme"),
    partner_id: z.string().uuid(),
    name: z.string().min(2),
    destination: z.string().min(2),
    level: z.enum(["certificate", "diploma", "undergraduate", "masters", "professional", "employment"]),
    tuition_fee: z.coerce.number().optional(),
    currency: z.string().min(3).max(3).optional(),
    active: z.boolean().optional()
  }),
  z.object({
    action: z.literal("update_programme"),
    id: z.string().uuid(),
    name: z.string().min(2).optional(),
    destination: z.string().min(2).optional(),
    level: z.enum(["certificate", "diploma", "undergraduate", "masters", "professional", "employment"]).optional(),
    tuition_fee: z.coerce.number().optional(),
    currency: z.string().min(3).max(3).optional(),
    active: z.boolean().optional()
  }),
  z.object({
    action: z.literal("create_application"),
    student_id: z.string().uuid(),
    programme_id: z.string().uuid(),
    status: z.enum(["draft", "submitted", "accepted", "rejected", "deferred"]).optional(),
    offer_letter_url: nullableText
  }),
  z.object({
    action: z.literal("update_application"),
    id: z.string().uuid(),
    status: z.enum(["draft", "submitted", "accepted", "rejected", "deferred"]).optional(),
    offer_letter_url: nullableText
  }),
  z.object({
    action: z.literal("create_revenue"),
    student_id: z.string().uuid().optional().nullable(),
    partner_id: z.string().uuid().optional().nullable(),
    type: z.enum(["retainer", "commission", "royalty", "bonus"]),
    amount: z.coerce.number().min(0),
    currency: z.string().min(3).max(3).optional(),
    recognized_at: nullableText,
    notes: nullableText
  })
]);

function stripAction<T extends { action: string }>(payload: T) {
  const { action: _action, ...rest } = payload;
  return rest;
}

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    if (payload.action === "create_partner") return NextResponse.json({ result: await createPartnerRecord(stripAction(payload)) });
    if (payload.action === "update_partner") return NextResponse.json({ result: await updatePartnerRecord(payload.id, stripAction(payload)) });
    if (payload.action === "delete_partner") return NextResponse.json({ result: await deletePartnerRecord(payload.id) });
    if (payload.action === "create_agreement") return NextResponse.json({ result: await createPartnerAgreementRecord(stripAction(payload)) });
    if (payload.action === "update_agreement") return NextResponse.json({ result: await updatePartnerAgreementRecord(payload.id, stripAction(payload)) });
    if (payload.action === "create_programme") return NextResponse.json({ result: await createProgrammeRecord(stripAction(payload)) });
    if (payload.action === "update_programme") return NextResponse.json({ result: await updateProgrammeRecord(payload.id, stripAction(payload)) });
    if (payload.action === "create_application") return NextResponse.json({ result: await createApplicationRecord(stripAction(payload)) });
    if (payload.action === "update_application") return NextResponse.json({ result: await updateApplicationRecord(payload.id, stripAction(payload)) });

    return NextResponse.json({ result: await createRevenueRecord(stripAction(payload)) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not run partner action." },
      { status: 400 }
    );
  }
}
