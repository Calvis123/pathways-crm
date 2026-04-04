import { NextResponse } from "next/server";
import { z } from "zod";
import { updateDocumentStatus } from "@/lib/data";

const schema = z.object({
  status: z.enum(["pending", "uploaded", "verified", "rejected"]),
  review_notes: z.string().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = schema.parse(await request.json());
    const { id } = await params;
    const document = await updateDocumentStatus({ id, ...payload });
    return NextResponse.json(document);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
