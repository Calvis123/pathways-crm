import { cache } from "react";
import bcrypt from "bcryptjs";
import { createAdminClient, hasSupabaseEnv } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/types";
import {
  SESSION_COOKIE,
  STUDENT_PORTAL_COOKIE,
  type SessionUser,
  type StudentPortalSession,
  decodeSession,
  decodeStudentPortalSession,
  encodeSession,
  encodeStudentPortalSession,
  getSessionFromRequest,
  isPublicPath,
  getDefaultRouteForRole,
  hasRouteAccess,
  filterStudentsByRole,
  permissionMatrix,
  roleLabel
} from "@/lib/auth-shared";

const getCurrentSessionCached = cache(async () => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
});

const getCurrentStudentPortalSessionCached = cache(async () => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return decodeStudentPortalSession(cookieStore.get(STUDENT_PORTAL_COOKIE)?.value);
});

export async function getCurrentSession() {
  return getCurrentSessionCached();
}

export async function getCurrentStudentPortalSession() {
  return getCurrentStudentPortalSessionCached();
}

export async function authenticateUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();

  if (!hasSupabaseEnv()) {
    throw new Error("Supabase is not configured. Add your Supabase environment variables before signing in.");
  }

  const supabase = createAdminClient();
  let result;

  try {
    result = await supabase
      .from("users")
      .select("username, full_name, role, status, password, email")
      .eq("email", normalized)
      .maybeSingle();
  } catch (error) {
    throw new Error("Could not reach the user database. Check your Supabase connection and try again.");
  }

  const { data, error } = result;

  if (error) {
    throw new Error(error.message || "Could not read the user account from Supabase.");
  }

  if (!data || data.status !== "active" || !data.password) {
    return null;
  }

  const storedPassword = String(data.password);
  const isBcryptHash = storedPassword.startsWith("$2y$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2a$");
  const passwordMatches = isBcryptHash
    ? await bcrypt.compare(password, storedPassword.replace("$2y$", "$2b$"))
    : storedPassword === password;

  if (!passwordMatches) {
    return null;
  }

  return {
    username: data.username,
    full_name: data.full_name,
    role: data.role as AppRole
  };
}

export {
  SESSION_COOKIE,
  STUDENT_PORTAL_COOKIE,
  type SessionUser,
  type StudentPortalSession,
  decodeSession,
  decodeStudentPortalSession,
  encodeSession,
  encodeStudentPortalSession,
  getSessionFromRequest,
  isPublicPath,
  getDefaultRouteForRole,
  hasRouteAccess,
  filterStudentsByRole,
  permissionMatrix,
  roleLabel
};
