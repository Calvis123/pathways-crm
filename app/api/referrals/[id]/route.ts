import { NextResponse } from "next/server";
import { z } from "zod";
import { updateReferralStatus } from "@/lib/data";

const schema = z.object({
  status: z.enum(["new", "contacted", "converted", "rewarded"])
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = schema.parse(await request.json());
    const { id } = await params;
    const referral = await updateReferralStatus(id, payload.status);
    return NextResponse.json(referral);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
