import { NextResponse } from "next/server";
import { z } from "zod";
import { createReferral } from "@/lib/data";

const schema = z.object({
  referrer_name: z.string().min(2),
  referrer_email: z.string().email().optional().or(z.literal("")).nullable(),
  referrer_phone: z.string().optional().or(z.literal("")).nullable(),
  referral_code: z.string().min(2),
  referred_student_name: z.string().min(2),
  referred_student_email: z.string().email().optional().or(z.literal("")).nullable(),
  reward_amount: z.number().min(0).optional(),
  notes: z.string().optional().or(z.literal("")).nullable()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const referral = await createReferral({
      ...payload,
      referrer_email: payload.referrer_email || null,
      referrer_phone: payload.referrer_phone || null,
      referred_student_email: payload.referred_student_email || null,
      notes: payload.notes || null
    });

    return NextResponse.json(referral, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
