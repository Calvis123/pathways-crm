import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteUserRecord, resetUserPassword, updateUserRecord } from "@/lib/data";

const updateSchema = z.object({
  username: z.string().min(2),
  full_name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["admin", "hr", "consultant", "marketing", "operations", "employee", "ielts_trainer"]),
  status: z.enum(["active", "inactive"]),
  phone: z.string().optional().nullable()
});

const passwordSchema = z.object({
  password: z.string().min(8)
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = updateSchema.parse(await request.json());
    const { id } = await params;
    const user = await updateUserRecord({ id, ...payload });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = passwordSchema.parse(await request.json());
    const { id } = await params;
    const user = await resetUserPassword(id, payload.password);
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await deleteUserRecord(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
