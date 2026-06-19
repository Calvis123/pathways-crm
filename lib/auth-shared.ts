import type { NextRequest } from "next/server";
import type { AppRole } from "@/lib/types";

export const SESSION_COOKIE = "barak_crm_session";
export const STUDENT_PORTAL_COOKIE = "barak_student_portal";

export interface SessionUser {
  username: string;
  full_name: string;
  role: AppRole;
}

export interface StudentPortalSession {
  student_id: string;
  full_name: string;
  email: string;
}

const publicExactPaths = new Set(["/", "/login", "/book-consultation", "/ielts-training", "/student-portal"]);
const publicPrefixes = ["/api/session/", "/api/public/", "/api/portal/", "/api/students/register", "/_next/", "/favicon.ico"];
const publicAssetPattern = /\.[a-z0-9]+$/i;
export const allAppRoles: AppRole[] = ["superadmin", "admin", "hr", "consultant", "marketing", "operations", "employee", "ielts_trainer", "partner"];
export const privilegedRoles: AppRole[] = ["superadmin", "admin"];
export const financeRoles: AppRole[] = privilegedRoles;

export function isPrivilegedRole(role: AppRole | null | undefined) {
  return role === "superadmin" || role === "admin";
}

export function canAccessFinance(role: AppRole | null | undefined) {
  return isPrivilegedRole(role);
}

const routeAccess: Array<{ prefix: string; roles: AppRole[] }> = [
  { prefix: "/dashboard", roles: ["superadmin", "admin", "consultant", "marketing", "operations", "employee", "ielts_trainer"] },
  { prefix: "/operating-system", roles: ["superadmin", "admin", "hr", "consultant", "operations", "employee"] },
  { prefix: "/partner-dashboard", roles: ["superadmin", "admin", "operations", "employee", "partner"] },
  { prefix: "/users", roles: privilegedRoles },
  { prefix: "/hr-dashboard", roles: ["superadmin", "admin", "hr", "employee"] },
  { prefix: "/payments", roles: financeRoles },
  { prefix: "/payment-tracker", roles: financeRoles },
  { prefix: "/payment-reminders", roles: financeRoles },
  { prefix: "/financial-tools", roles: financeRoles },
  { prefix: "/financial-reports", roles: financeRoles },
  { prefix: "/students", roles: ["superadmin", "admin", "hr", "consultant", "marketing", "operations", "employee", "ielts_trainer"] },
  { prefix: "/sales-funnel", roles: financeRoles },
  { prefix: "/progress-reports", roles: financeRoles },
  { prefix: "/segments", roles: financeRoles },
  { prefix: "/consultations", roles: ["superadmin", "admin", "hr"] },
  { prefix: "/reports", roles: financeRoles },
  { prefix: "/analytics", roles: financeRoles },
  { prefix: "/revenue-forecast", roles: financeRoles },
  { prefix: "/audit", roles: privilegedRoles },
  { prefix: "/system-monitor", roles: privilegedRoles },
  { prefix: "/referrals", roles: ["superadmin", "admin", "consultant", "marketing", "employee"] },
  { prefix: "/portal-manager", roles: ["superadmin", "admin", "consultant", "operations", "employee"] },
  { prefix: "/ielts-dashboard", roles: ["superadmin", "admin", "hr", "ielts_trainer", "employee", "operations"] },
  { prefix: "/ielts-training", roles: ["superadmin", "admin", "hr", "ielts_trainer", "employee", "operations"] },
  { prefix: "/documents", roles: ["superadmin", "admin", "operations", "employee"] },
  { prefix: "/commissions", roles: financeRoles },
  { prefix: "/templates", roles: ["superadmin", "admin", "hr", "consultant", "marketing", "ielts_trainer"] },
  { prefix: "/email-center", roles: ["superadmin", "admin", "hr", "consultant", "marketing", "operations", "employee", "ielts_trainer"] },
  { prefix: "/whatsapp-bulk", roles: ["superadmin", "admin", "hr", "consultant", "marketing", "employee"] },
  { prefix: "/notifications", roles: ["superadmin", "admin", "hr", "operations", "employee"] },
  { prefix: "/bulk-actions", roles: ["superadmin", "admin", "consultant", "employee"] },
  { prefix: "/task-manager", roles: ["superadmin", "admin", "consultant", "operations", "employee"] }
];

export const permissionMatrix = [
  ...routeAccess.map((entry) => ({
    label: entry.prefix
      .slice(1)
      .split("-")
      .map((word) => roleLabel(word as AppRole))
      .join(" "),
    prefix: entry.prefix,
    roles: entry.roles
  }))
] satisfies Array<{ label: string; prefix: string; roles: AppRole[] }>;

export function roleLabel(role: AppRole) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function encodeSession(session: SessionUser) {
  return encodeURIComponent(JSON.stringify(session));
}

export function encodeStudentPortalSession(session: StudentPortalSession) {
  return encodeURIComponent(JSON.stringify(session));
}

export function decodeSession(value?: string | null): SessionUser | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as SessionUser;

    if (!parsed.username || !parsed.full_name || !parsed.role) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function decodeStudentPortalSession(value?: string | null): StudentPortalSession | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as StudentPortalSession;

    if (!parsed.student_id || !parsed.full_name || !parsed.email) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest) {
  return decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
}

export function isPublicPath(pathname: string) {
  return (
    publicExactPaths.has(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    publicAssetPattern.test(pathname)
  );
}

export function getDefaultRouteForRole(role: AppRole) {
  if (role === "hr") return "/hr-dashboard";
  if (role === "operations") return "/documents";
  if (role === "marketing") return "/students";
  if (role === "consultant") return "/dashboard";
  if (role === "ielts_trainer") return "/ielts-dashboard";
  if (role === "partner") return "/partner-dashboard";
  return "/dashboard";
}

export function hasRouteAccess(pathname: string, role: AppRole) {
  const match = routeAccess.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  if (!match) return true;
  return match.roles.includes(role);
}

export function filterStudentsByRole<T extends { created_by: string | null; stage: string; ielts_enrolled: boolean }>(
  students: T[],
  session: SessionUser | null
) {
  if (!session) return students;

  if (session.role === "marketing") {
    return students.filter(
      (student) =>
        student.created_by === null ||
        student.created_by === session.username ||
        student.stage === "consultation"
    );
  }

  if (session.role === "ielts_trainer") {
    return students.filter((student) => student.ielts_enrolled);
  }

  return students;
}
