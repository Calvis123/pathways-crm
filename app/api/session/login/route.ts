import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  authenticateUser,
  encodeSession,
  getDefaultRouteForRole,
  hasRouteAccess
} from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json().catch(() => null));
    const user = await authenticateUser(payload.email, payload.password);

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const redirectTo =
      payload.next && payload.next.startsWith("/") && hasRouteAccess(payload.next, user.role)
        ? payload.next
        : getDefaultRouteForRole(user.role);

    const response = NextResponse.json({
      ok: true,
      redirectTo,
      user: { username: user.username, full_name: user.full_name, role: user.role }
    });

    response.cookies.set(
      SESSION_COOKIE,
      encodeSession({
        username: user.username,
        full_name: user.full_name,
        role: user.role
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Enter a valid email address and password." },
        { status: 400 }
      );
    }

    console.error("Login failed", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not sign in. Please try again." },
      { status: 500 }
    );
  }
}
