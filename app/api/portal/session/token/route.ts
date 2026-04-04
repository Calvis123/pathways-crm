import { NextResponse } from "next/server";
import {
  STUDENT_PORTAL_COOKIE,
  encodeStudentPortalSession
} from "@/lib/auth";
import { resolvePortalStudentByToken } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/student-portal", request.url));
  }

  const student = await resolvePortalStudentByToken(token);
  if (!student) {
    return NextResponse.redirect(new URL("/student-portal?invalid=1", request.url));
  }

  const response = NextResponse.redirect(new URL("/student-portal", request.url));
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
}
