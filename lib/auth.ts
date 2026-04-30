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

export interface DemoUser extends SessionUser {
  email: string;
  password: string;
}

export const demoUsers: DemoUser[] = [
  { username: "admin", email: "admin@barakpathways.com", password: "barak123", full_name: "Amina Admin", role: "admin" },
  { username: "hr", email: "hr@barakpathways.com", password: "barak123", full_name: "Hannah HR", role: "hr" },
  { username: "consultant", email: "consultant@barakpathways.com", password: "barak123", full_name: "Caleb Consultant", role: "consultant" },
  { username: "marketing", email: "marketing@barakpathways.com", password: "barak123", full_name: "Maya Marketing", role: "marketing" },
  { username: "operations", email: "operations@barakpathways.com", password: "barak123", full_name: "Oscar Operations", role: "operations" },
  { username: "employee", email: "employee@barakpathways.com", password: "barak123", full_name: "Evelyn Employee", role: "employee" },
  { username: "ielts", email: "ielts@barakpathways.com", password: "barak123", full_name: "Ian IELTS", role: "ielts_trainer" }
];


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

export function authenticateDemoUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  return (
    demoUsers.find((user) => user.email === normalized && user.password === password) ?? null
  );
}

export async function authenticateUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();

  if (!hasSupabaseEnv()) {
    return authenticateDemoUser(normalized, password);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("username, full_name, role, status, password, email")
    .eq("email", normalized)
    .maybeSingle();

  if (error) throw error;

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
