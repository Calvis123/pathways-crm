"use client";

import type { Route } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  Calculator,
  CalendarCheck,
  ChevronDown,
  CreditCard,
  FileCheck2,
  FileBarChart,
  FileText,
  Folder,
  Funnel,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageCircleMore,
  Mail,
  Moon,
  Network,
  PieChart,
  ReceiptText,
  School,
  ShieldCheck,
  Users2,
  UserCog
} from "lucide-react";
import { TAB_SESSION_STORAGE_KEY } from "@/components/auth/session-tab-guard";
import { BrandLogo } from "@/components/branding/brand-logo";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/types";
import { hasRouteAccess, roleLabel } from "@/lib/auth-shared";
import { Button } from "@/components/ui/button";

type Item = {
  href: Route;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const sections: Array<{ title: string; items: Item[] }> = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/operating-system", label: "Operating System", icon: Network },
      { href: "/partner-dashboard", label: "Partner Dashboard", icon: BriefcaseBusiness },
      { href: "/students", label: "Students", icon: Users2 },
      { href: "/sales-funnel", label: "Sales Funnel", icon: Funnel },
      { href: "/consultations", label: "Consultations", icon: CalendarCheck }
    ]
  },
  {
    title: "HR",
    items: [
      { href: "/hr-dashboard", label: "HR Overview", icon: IdCard },
      { href: "/hr-dashboard/team", label: "Team & Roles", icon: Users2 },
      { href: "/hr-dashboard/operations", label: "Operations Oversight", icon: ListChecks },
      { href: "/hr-dashboard/activity", label: "Activity & Compliance", icon: Activity }
    ]
  },
  {
    title: "Pipeline",
    items: [
      { href: "/progress-reports", label: "Progress Reports", icon: FileText },
      { href: "/segments", label: "Segments", icon: School },
      { href: "/payment-reminders", label: "Payment Reminders", icon: Bell }
    ]
  },
  {
    title: "Finances",
    items: [
      { href: "/financial-tools", label: "Financial Tools", icon: Calculator },
      { href: "/financial-reports", label: "Financial Reports", icon: PieChart },
      { href: "/payments", label: "Payments", icon: CreditCard },
      { href: "/payment-tracker", label: "Payment Tracker", icon: CreditCard },
      { href: "/commissions", label: "Commissions", icon: ReceiptText }
    ]
  },
  {
    title: "IELTS",
    items: [
      { href: "/ielts-dashboard", label: "IELTS Dashboard", icon: GraduationCap },
      { href: "/ielts-training", label: "IELTS Training", icon: School }
    ]
  },
  {
    title: "Reports & Analytics",
    items: [
      { href: "/reports", label: "Reports", icon: FileBarChart },
      { href: "/analytics", label: "Analytics", icon: Activity },
      { href: "/revenue-forecast", label: "Revenue Forecast", icon: PieChart },
      { href: "/audit", label: "Audit Logs", icon: Activity }
    ]
  },
  {
    title: "Communications",
    items: [
      { href: "/email-center", label: "Email Center", icon: Mail },
      { href: "/templates", label: "Email Templates", icon: Mail },
      { href: "/whatsapp-bulk", label: "WhatsApp Bulk", icon: MessageCircleMore },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/referrals", label: "Referrals", icon: Users2 }
    ]
  },
  {
    title: "Admin",
    items: [
      { href: "/users", label: "User Management", icon: UserCog },
      { href: "/system-monitor", label: "System Monitor", icon: ShieldCheck },
      { href: "/documents", label: "Documents", icon: Folder },
      { href: "/portal-manager", label: "Portal Manager", icon: BriefcaseBusiness },
      { href: "/bulk-actions", label: "Bulk Actions", icon: FileCheck2 },
      { href: "/task-manager", label: "Task Manager", icon: ListChecks }
    ]
  }
];

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

const hrVisibleSections = new Set([
  "HR",
  "Main",
  "Pipeline",
  "Finances",
  "IELTS",
  "Reports & Analytics",
  "Communications"
]);

export function Sidebar({
  pathname,
  user,
  className,
  onNavigate
}: {
  pathname: string;
  user: { username: string; full_name: string; role: AppRole } | null;
  className?: string;
  onNavigate?: () => void;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextTheme = window.localStorage.getItem("barak-theme") === "dark" ? "dark" : "light";
    setTheme(nextTheme);
  }, []);

  async function handleLogout() {
    window.sessionStorage.removeItem(TAB_SESSION_STORAGE_KEY);
    await fetch("/api/session/logout", { method: "POST" });
    window.location.href = "/";
  }

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("barak-theme", nextTheme);
  }

  const visibleSections = useMemo(
    () =>
      user
        ? (user.role === "hr" ? sections.filter((section) => hrVisibleSections.has(section.title)) : sections)
            .map((section) => ({
              ...section,
              items: section.items.filter((item) => hasRouteAccess(item.href, user.role))
            }))
            .filter((section) => section.items.length > 0)
        : [],
    [user]
  );

  const currentPath = normalizePath(pathname);

  const activeSectionTitles = useMemo(
    () =>
      new Set(
        visibleSections
          .filter((section) =>
            section.items.some((item) => {
              const itemPath = normalizePath(item.href);
              return (
                currentPath === itemPath ||
                currentPath.startsWith(`${itemPath}/`) ||
                (itemPath === "/dashboard" && currentPath === "/")
              );
            })
          )
          .map((section) => section.title)
      ),
    [currentPath, visibleSections]
  );

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenSections((current) => {
      const next: Record<string, boolean> = {};

      for (const section of visibleSections) {
        next[section.title] = current[section.title] ?? activeSectionTitles.has(section.title);
      }

      return next;
    });
  }, [activeSectionTitles, visibleSections]);

  function toggleSection(title: string) {
    setOpenSections((current) => ({
      ...current,
      [title]: !current[title]
    }));
  }

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col overflow-hidden border-r border-[#eadacc] bg-[#fff6ef] text-slate-900 shadow-[8px_0_30px_rgba(120,75,42,0.08)] transition-colors dark:border-white/10 dark:bg-[#172434] dark:text-white",
        className
      )}
    >
      <div className="border-b border-[#eadacc] px-4 py-4 dark:border-white/10">
        <div className="rounded-lg border border-[#eadacc] bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between gap-3">
            <BrandLogo imageClassName="w-[104px] drop-shadow-none" />
            <span className="rounded-md border border-[#eadacc] bg-[#fff6ef] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b5e3c] dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-300">
              CRM
            </span>
          </div>

          {user ? (
            <div className="mt-3 rounded-lg border border-[#d9c1ad] bg-[linear-gradient(135deg,#31424a_0%,#516672_100%)] p-3 text-white shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-semibold text-[#213343] shadow-sm dark:bg-[#ff7a59] dark:text-white">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60 dark:text-slate-400">
                    {roleLabel(user.role)}
                  </p>
                  <p className="truncate text-sm font-semibold text-white">{user.full_name}</p>
                  <p className="truncate text-xs text-white/60">@{user.username}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 rounded-lg border-white/10 bg-white/10 px-2.5 text-[12px] text-white hover:bg-white/15"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  Sign out
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 rounded-lg border-white/10 bg-white/10 px-2.5 text-[12px] text-white hover:bg-white/15"
                  onClick={toggleTheme}
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  <Moon className="mr-1.5 h-3.5 w-3.5" />
                  {theme === "dark" ? "Light" : "Dark"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-2.5">
          {visibleSections.map((section) => {
            const sectionActive = activeSectionTitles.has(section.title);

            return (
              <section
                key={section.title}
                className={cn(
                  "rounded-lg border p-1.5 shadow-sm transition-colors",
                  sectionActive
                    ? "border-[#ffb79f] bg-[#fff1e6] dark:border-[#ff7a59]/40 dark:bg-[#ff7a59]/10"
                    : "border-[#eadacc] bg-white/88 dark:border-white/10 dark:bg-white/[0.03]"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition hover:bg-[#fff6ef] dark:hover:bg-white/[0.05]",
                    sectionActive ? "bg-white/70 dark:bg-white/[0.06]" : ""
                  )}
                >
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-[0.16em]",
                        sectionActive ? "text-[#213343] dark:text-white" : "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      {section.title}
                    </p>
                    <span
                      className={cn(
                        "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                        sectionActive
                          ? "border-[#ffb79f] bg-[#ff7a59] text-white dark:border-[#ff7a59]/40 dark:bg-[#ff7a59]"
                          : "border-[#eadacc] bg-[#fff6ef] text-[#8b5e3c] dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-300"
                      )}
                    >
                      {section.items.length}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      sectionActive ? "text-[#ff7a59] dark:text-[#ffb79f]" : "text-slate-400 dark:text-slate-400",
                      openSections[section.title] ? "rotate-180" : ""
                    )}
                  />
                </button>

                <nav className={cn("space-y-1 px-1 pb-1", openSections[section.title] ? "block" : "hidden")}>
                  {section.items.map((item) => {
                  const Icon = item.icon;
                  const itemPath = normalizePath(item.href);
                  const active =
                    currentPath === itemPath ||
                    currentPath.startsWith(`${itemPath}/`) ||
                    (itemPath === "/dashboard" && currentPath === "/");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center gap-2.5 overflow-hidden rounded-md px-2.5 py-2.5 text-[13px] font-medium transition",
                        active
                          ? "border border-[#eadacc] bg-[#fff1e6] text-slate-950 shadow-sm dark:border-white/10 dark:bg-white/[0.1] dark:text-white"
                          : "border border-transparent text-slate-600 hover:border-[#eadacc] hover:bg-[#fff6ef] hover:text-slate-950 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/[0.06] dark:hover:text-white"
                      )}
                    >
                      {active ? <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-[#ff7a59]" /> : null}
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition",
                          active
                            ? "bg-[#213343] text-white dark:bg-[#ff7a59]"
                            : "bg-[#fffaf5] text-[#9b7b62] ring-1 ring-[#eadacc] group-hover:text-slate-700 dark:bg-white/[0.04] dark:text-slate-400 dark:ring-white/10 dark:group-hover:bg-white/[0.08] dark:group-hover:text-white"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                  })}
                </nav>
              </section>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
