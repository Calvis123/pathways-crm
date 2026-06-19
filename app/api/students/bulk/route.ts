import { NextResponse } from "next/server";
import { z } from "zod";
import { runStudentBulkAction } from "@/lib/data";
import { stageOptions } from "@/lib/constants";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update_stage"),
    studentIds: z.array(z.string().uuid()).min(1),
    stage: z.enum(stageOptions)
  }),
  z.object({
    action: z.literal("update_payment"),
    studentIds: z.array(z.string().uuid()).min(1),
    paymentMode: z.enum(["full", "partial", "none"])
  }),
  z.object({
    action: z.literal("delete"),
    studentIds: z.array(z.string().uuid()).min(1)
  }),
  z.object({
    action: z.literal("export"),
    studentIds: z.array(z.string().uuid()).min(1)
  })
]);

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    if (payload.action === "export") {
      const result = (await runStudentBulkAction(payload)) as { count: number; csv: string };
      return new NextResponse(result.csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="students-export.csv"'
        }
      });
    }

    const result = await runStudentBulkAction(payload);
    return NextResponse.json({ ok: true, count: result.count });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
