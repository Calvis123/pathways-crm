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
  LayoutDashboard,
  ListChecks,
  MessageCircleMore,
  Mail,
  PieChart,
  ReceiptText,
  School,
  Send,
  ShieldCheck,
  Users2,
  UserCog
} from "lucide-react";
import { TAB_SESSION_STORAGE_KEY } from "@/components/auth/session-tab-guard";
import { BrandLogo } from "@/components/branding/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
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
      { href: "/students", label: "Students", icon: Users2 },
      { href: "/sales-funnel", label: "Sales Funnel", icon: Funnel },
      { href: "/consultations", label: "Consultations", icon: CalendarCheck }
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
  async function handleLogout() {
    window.sessionStorage.removeItem(TAB_SESSION_STORAGE_KEY);
    await fetch("/api/session/logout", { method: "POST" });
    window.location.href = "/";
  }

  const visibleSections = useMemo(
    () =>
      user
        ? sections
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
    <aside className={cn("sticky top-0 flex h-screen flex-col overflow-hidden border-r border-[#ead7c9] bg-[radial-gradient(circle_at_top,rgba(255,122,89,0.16),transparent_20%),linear-gradient(180deg,#fff8f2_0%,#fff2e8_30%,#fff7f1_62%,#fffdf9_100%)] text-slate-900 shadow-[0_28px_80px_rgba(168,116,84,0.16)] transition-colors dark:border-[#21324c] dark:bg-[radial-gradient(circle_at_top,rgba(255,122,89,0.16),transparent_22%),linear-gradient(180deg,#08111f_0%,#0d1728_20%,#111d34_58%,#132038_100%)] dark:text-white dark:shadow-[0_28px_80px_rgba(8,17,31,0.34)]", className)}>
      <div className="border-b border-[#eadbcf] px-5 py-5 dark:border-white/10">
        <div className="rounded-[1.75rem] border border-[#ecdccf] bg-white/70 p-4 shadow-[0_20px_45px_rgba(221,184,159,0.18),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-4">
            <BrandLogo imageClassName="w-[156px] rounded-xl bg-white px-2.5 py-2 shadow-[0_14px_30px_rgba(214,176,150,0.28)] dark:shadow-[0_12px_28px_rgba(255,255,255,0.08)]" />
          </div>
          {user ? (
            <div className="mt-4 rounded-[1.5rem] border border-[#ecdccf] bg-white/72 p-4 shadow-[0_18px_40px_rgba(221,184,159,0.18),inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff7a59,#e09a54)] text-sm font-semibold text-white shadow-[0_14px_24px_rgba(255,122,89,0.22)]">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-[#b5794d] dark:text-gold/80">{roleLabel(user.role)}</p>
                  <p className="truncate text-sm font-medium text-[#17324d] dark:text-white">{user.full_name}</p>
                  <p className="truncate text-xs text-[#6d8093] dark:text-slate-400">@{user.username}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="mt-4 w-full rounded-2xl border border-[#e7d3c4] bg-white/80 text-[#17324d] hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
                onClick={handleLogout}
              >
                <Send className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          ) : null}
          <ThemeToggle className="mt-4 w-full justify-center border-[#e7d3c4] bg-white/75 text-[#17324d] hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.12]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {visibleSections.map((section) => (
          <div key={section.title} className="mb-5">
            <button
              type="button"
              onClick={() => toggleSection(section.title)}
              className="mb-2 flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-white/50 dark:hover:bg-white/[0.04]"
            >
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#b5794d] dark:text-gold/80">
                {section.title}
              </p>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[#b5794d] transition-transform dark:text-gold/80",
                  openSections[section.title] ? "rotate-180" : ""
                )}
              />
            </button>
            <nav className={cn("space-y-1.5", openSections[section.title] ? "block" : "hidden")}>
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
                      "group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3 text-sm font-medium transition",
                      active
                        ? "border border-[#efc3a5] bg-[linear-gradient(135deg,rgba(255,122,89,0.24),rgba(255,236,225,0.96),rgba(255,255,255,0.92))] text-[#17324d] shadow-[0_18px_36px_rgba(202,145,104,0.18)] dark:border-[#f4b089]/35 dark:bg-[linear-gradient(135deg,rgba(255,122,89,0.42),rgba(224,154,84,0.18),rgba(255,255,255,0.08))] dark:text-white dark:shadow-[0_18px_36px_rgba(8,17,31,0.28)]"
                        : "border border-transparent text-[#5f7286] hover:border-[#ecd8c9] hover:bg-white/60 hover:text-[#17324d] dark:text-slate-300 dark:hover:border-white/8 dark:hover:bg-white/[0.045] dark:hover:text-white"
                    )}
                  >
                    {active ? (
                      <span className="absolute inset-y-1.5 left-0 w-1.5 rounded-r-full bg-[linear-gradient(180deg,#ff7a59,#e09a54)] shadow-[0_0_22px_rgba(255,122,89,0.95)]" />
                    ) : null}
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-2xl transition",
                        active
                          ? "bg-white/85 text-[#d6864f] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_8px_18px_rgba(255,122,89,0.12)] dark:bg-white/14 dark:text-gold dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_18px_rgba(255,122,89,0.16)]"
                          : "bg-white/55 text-[#8c97a5] group-hover:bg-white group-hover:text-[#d6864f] dark:bg-white/[0.04] dark:text-slate-400 dark:group-hover:bg-white/[0.07] dark:group-hover:text-gold"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {active ? (
                      <span className="inline-flex items-center rounded-full border border-[#efdbc9] bg-white/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c27e49] shadow-[0_0_18px_rgba(198,155,59,0.12)] dark:border-white/10 dark:bg-white/12 dark:text-gold dark:shadow-[0_0_18px_rgba(198,155,59,0.18)]">
                        Active
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t border-[#eadbcf] px-4 py-4 dark:border-white/10">
        <div className="rounded-[1.75rem] border border-[#ecdccf] bg-white/72 p-4 shadow-[0_18px_40px_rgba(221,184,159,0.18),inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff7a59,#e09a54)] text-white shadow-[0_14px_24px_rgba(255,122,89,0.24)]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.24em] text-[#b5794d] dark:text-gold/90">Barak CRM</p>
              <p className="mt-1 text-sm font-medium text-[#17324d] dark:text-white">Admissions CRM Platform</p>
              <p className="mt-2 text-sm leading-6 text-[#5a7089] dark:text-slate-300">Admissions, finance, IELTS, and operations in one place.</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
