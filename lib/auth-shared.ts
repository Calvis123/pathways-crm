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
const publicPrefixes = ["/api/session/", "/api/public/", "/api/portal/", "/_next/", "/favicon.ico"];
const publicAssetPattern = /\.[a-z0-9]+$/i;
const allAppRoles: AppRole[] = ["admin", "hr", "consultant", "marketing", "operations", "employee", "ielts_trainer", "partner"];

const routeAccess: Array<{ prefix: string; roles: AppRole[] }> = [
  { prefix: "/dashboard", roles: ["admin", "consultant", "marketing", "operations", "employee", "ielts_trainer"] },
  { prefix: "/operating-system", roles: ["admin", "hr", "consultant", "operations", "employee"] },
  { prefix: "/partner-dashboard", roles: ["admin", "operations", "employee", "partner"] },
  { prefix: "/users", roles: ["admin"] },
  { prefix: "/hr-dashboard", roles: ["admin", "hr", "employee"] },
  { prefix: "/payments", roles: ["admin", "consultant", "operations", "employee"] },
  { prefix: "/payment-tracker", roles: ["admin", "employee"] },
  { prefix: "/payment-reminders", roles: ["admin", "consultant", "operations", "employee"] },
  { prefix: "/financial-tools", roles: allAppRoles },
  { prefix: "/financial-reports", roles: ["admin", "employee"] },
  { prefix: "/students", roles: ["admin", "hr", "consultant", "marketing", "operations", "employee", "ielts_trainer"] },
  { prefix: "/sales-funnel", roles: ["admin", "hr", "consultant", "marketing", "operations", "employee"] },
  { prefix: "/progress-reports", roles: ["admin", "hr", "consultant", "marketing", "operations", "employee"] },
  { prefix: "/segments", roles: ["admin", "hr", "consultant", "marketing", "operations", "employee"] },
  { prefix: "/consultations", roles: ["admin", "hr"] },
  { prefix: "/reports", roles: ["admin", "hr"] },
  { prefix: "/analytics", roles: ["admin", "hr", "operations", "employee"] },
  { prefix: "/revenue-forecast", roles: ["admin", "hr", "operations", "employee"] },
  { prefix: "/audit", roles: ["admin"] },
  { prefix: "/system-monitor", roles: ["admin"] },
  { prefix: "/referrals", roles: ["admin", "consultant", "marketing", "employee"] },
  { prefix: "/portal-manager", roles: ["admin", "consultant", "operations", "employee"] },
  { prefix: "/ielts-dashboard", roles: ["admin", "hr", "ielts_trainer", "employee", "operations"] },
  { prefix: "/ielts-training", roles: ["admin", "hr", "ielts_trainer", "employee", "operations"] },
  { prefix: "/documents", roles: ["admin", "operations", "employee"] },
  { prefix: "/commissions", roles: ["admin", "operations", "employee"] },
  { prefix: "/templates", roles: ["admin", "hr", "consultant", "marketing", "ielts_trainer"] },
  { prefix: "/email-center", roles: ["admin", "hr", "consultant", "marketing", "operations", "employee", "ielts_trainer"] },
  { prefix: "/whatsapp-bulk", roles: ["admin", "hr", "consultant", "marketing", "employee"] },
  { prefix: "/notifications", roles: ["admin", "hr", "operations", "employee"] },
  { prefix: "/bulk-actions", roles: ["admin", "consultant", "employee"] },
  { prefix: "/task-manager", roles: ["admin", "consultant", "operations", "employee"] }
];

export const permissionMatrix = [
  { label: "User Management", prefix: "/users", roles: ["admin"] },
  { label: "Operating System", prefix: "/operating-system", roles: ["admin", "hr", "consultant", "operations", "employee"] },
  { label: "Partner Dashboard", prefix: "/partner-dashboard", roles: ["admin", "operations", "employee", "partner"] },
  { label: "HR Dashboard", prefix: "/hr-dashboard", roles: ["admin", "hr", "employee"] },
  { label: "System Monitor", prefix: "/system-monitor", roles: ["admin"] },
  { label: "Reports", prefix: "/reports", roles: ["admin", "hr"] },
  { label: "Audit Logs", prefix: "/audit", roles: ["admin"] },
  { label: "Analytics", prefix: "/analytics", roles: ["admin", "hr", "operations", "employee"] },
  { label: "Financial Tools", prefix: "/financial-tools", roles: allAppRoles },
  { label: "Financial Reports", prefix: "/financial-reports", roles: ["admin", "employee"] },
  { label: "Revenue Forecast", prefix: "/revenue-forecast", roles: ["admin", "hr", "operations", "employee"] },
  { label: "Students", prefix: "/students", roles: ["admin", "hr", "consultant", "marketing", "operations", "employee", "ielts_trainer"] as AppRole[] },
  { label: "Consultations", prefix: "/consultations", roles: ["admin", "hr"] },
  { label: "Documents", prefix: "/documents", roles: ["admin", "operations", "employee"] },
  { label: "Email Center", prefix: "/email-center", roles: ["admin", "hr", "consultant", "marketing", "operations", "employee", "ielts_trainer"] as AppRole[] },
  { label: "WhatsApp Bulk", prefix: "/whatsapp-bulk", roles: ["admin", "hr", "consultant", "marketing", "employee"] },
  { label: "Notifications", prefix: "/notifications", roles: ["admin", "hr", "operations", "employee"] },
  { label: "Portal Manager", prefix: "/portal-manager", roles: ["admin", "consultant", "operations", "employee"] }
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
  if (role === "consultant") return "/students";
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
