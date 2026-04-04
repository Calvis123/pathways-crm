import { NextResponse } from "next/server";
import { z } from "zod";
import {
  STUDENT_PORTAL_COOKIE,
  encodeStudentPortalSession
} from "@/lib/auth";
import { authenticateStudentPortalUser } from "@/lib/data";

const schema = z.object({
  email: z.string().email(),
  phone: z.string().min(7)
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const student = await authenticateStudentPortalUser(payload);

    if (!student) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your email and phone number." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      student: {
        id: student.id,
        full_name: student.full_name,
        email: student.email
      }
    });

    response.cookies.set(
      STUDENT_PORTAL_COOKIE,
      encodeStudentPortalSession({
        student_id: student.id,
        full_name: student.full_name,
        email: student.email
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 12
      }
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
