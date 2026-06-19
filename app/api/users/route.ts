import { NextResponse } from "next/server";
import { z } from "zod";
import { createUserRecord } from "@/lib/data";

const roles = ["superadmin", "admin", "hr", "consultant", "marketing", "operations", "employee", "ielts_trainer", "partner"] as const;

const schema = z.object({
  username: z.string().min(2),
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(roles)
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const user = await createUserRecord(payload);
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
