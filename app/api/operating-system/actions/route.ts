import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createConsultantTrainingRecord,
  createQaCheckpointRecord,
  completeConsultantTrainingModule,
  completePartnerAgreementLegalReview,
  signOffQaCheckpoint,
  updateStudentGateFields,
  upsertMarketConfigRecord,
  verifyMarketConfig
} from "@/lib/data";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update_student_gate_fields"),
    student_id: z.string().uuid(),
    next_action_date: z.string().optional().nullable(),
    advisory_agreement_signed: z.boolean().optional(),
    deposit_paid: z.number().optional().nullable(),
    application_reference: z.string().optional().nullable(),
    offer_letter_received: z.boolean().optional(),
    testimonial_requested: z.boolean().optional(),
    referral_requested: z.boolean().optional()
  }),
  z.object({
    action: z.literal("verify_market_config"),
    id: z.string().uuid(),
    market_owner: z.string().optional().nullable(),
    source_label: z.string().optional().nullable(),
    source_url: z.string().url().optional().nullable()
  }),
  z.object({
    action: z.literal("sign_off_qa_checkpoint"),
    id: z.string().uuid()
  }),
  z.object({
    action: z.literal("complete_partner_legal_review"),
    id: z.string().uuid()
  }),
  z.object({
    action: z.literal("complete_training_module"),
    id: z.string().uuid(),
    score: z.number().min(0).max(100).optional().nullable()
  }),
  z.object({
    action: z.literal("upsert_market_config"),
    id: z.string().uuid().optional(),
    country: z.string().min(2),
    language: z.string().min(2).optional(),
    active: z.boolean().optional(),
    policy_notes: z.string().optional(),
    market_owner: z.string().optional().nullable(),
    visa_requirements: z.array(z.object({
      label: z.string().min(2),
      timeline: z.string().optional(),
      fee: z.string().optional()
    })).optional(),
    official_sources: z.array(z.object({
      label: z.string().min(2),
      url: z.string().url(),
      last_checked: z.string()
    })).optional()
  }),
  z.object({
    action: z.literal("create_qa_checkpoint"),
    entity_type: z.enum(["student", "application", "visa_record", "partner_agreement", "partner"]),
    entity_id: z.string().uuid(),
    stage: z.enum(["intake", "counselling", "application", "visa", "partner_agreement", "partner_onboarding", "partner_performance"]),
    label: z.string().min(2),
    passed: z.boolean().optional()
  }),
  z.object({
    action: z.literal("create_training_module"),
    consultant_username: z.string().min(2),
    module_name: z.string().min(2),
    module_type: z.enum(["onboarding", "certification", "skill_development"]),
    completed: z.boolean().optional(),
    score: z.number().min(0).max(100).optional().nullable()
  })
]);

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    if (payload.action === "update_student_gate_fields") {
      const result = await updateStudentGateFields(payload);
      return NextResponse.json({ result });
    }

    if (payload.action === "verify_market_config") {
      const result = await verifyMarketConfig(payload);
      return NextResponse.json({ result });
    }

    if (payload.action === "sign_off_qa_checkpoint") {
      const result = await signOffQaCheckpoint(payload.id);
      return NextResponse.json({ result });
    }

    if (payload.action === "complete_partner_legal_review") {
      const result = await completePartnerAgreementLegalReview(payload.id);
      return NextResponse.json({ result });
    }

    if (payload.action === "upsert_market_config") {
      const result = await upsertMarketConfigRecord(payload);
      return NextResponse.json({ result });
    }

    if (payload.action === "create_qa_checkpoint") {
      const result = await createQaCheckpointRecord(payload);
      return NextResponse.json({ result });
    }

    if (payload.action === "create_training_module") {
      const result = await createConsultantTrainingRecord(payload);
      return NextResponse.json({ result });
    }

    const result = await completeConsultantTrainingModule({ id: payload.id, score: payload.score });
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not run operating-system action." },
      { status: 400 }
    );
  }
}
