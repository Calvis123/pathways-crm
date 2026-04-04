import { NextResponse } from "next/server";
import { revokePortalAccess } from "@/lib/data";

export async function PATCH(_request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    await revokePortalAccess(studentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
