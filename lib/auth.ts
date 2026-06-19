import { cache } from "react";
import bcrypt from "bcryptjs";
import { readLocalDb } from "@/lib/local-store";
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
    return authenticateLocalUser(normalized, password);
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
    const localUser = await authenticateLocalUser(normalized, password);
    if (localUser) return localUser;
    throw new Error("Could not reach Supabase. Check your internet connection or Supabase URL/service key, then try again.");
  }

  const { data, error } = result;

  if (error) {
    const localUser = await authenticateLocalUser(normalized, password);
    if (localUser) return localUser;
    throw new Error(error.message || "Could not read the user account from Supabase.");
  }

  if (!data || data.status !== "active" || !data.password) return authenticateLocalUser(normalized, password);

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

async function authenticateLocalUser(email: string, password: string) {
  const db = await readLocalDb();
  const user = db.users.find((item) => item.email.trim().toLowerCase() === email);

  if (!user || user.status !== "active" || !user.password) return null;

  const storedPassword = String(user.password);
  const isBcryptHash = storedPassword.startsWith("$2y$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2a$");
  const passwordMatches = isBcryptHash
    ? await bcrypt.compare(password, storedPassword.replace("$2y$", "$2b$"))
    : storedPassword === password;

  if (!passwordMatches) return null;

  return {
    username: user.username,
    full_name: user.full_name,
    role: user.role as AppRole
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
