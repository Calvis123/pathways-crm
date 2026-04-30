import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, ClipboardList, LayoutDashboard, Users2 } from "lucide-react";

const hrLinks: Array<{ href: Route; label: string; description: string; icon: ReactNode }> = [
  {
    href: "/hr-dashboard",
    label: "HR Overview",
    description: "System health, queues, team load, and quick oversight.",
    icon: <LayoutDashboard className="h-4 w-4" />
  },
  {
    href: "/hr-dashboard/team",
    label: "Team & Roles",
    description: "User coverage, active roles, permissions, and ownership.",
    icon: <Users2 className="h-4 w-4" />
  },
  {
    href: "/hr-dashboard/operations",
    label: "Operations Oversight",
    description: "Documents, consultations, tasks, and student response queues.",
    icon: <ClipboardList className="h-4 w-4" />
  },
  {
    href: "/hr-dashboard/activity",
    label: "Activity & Compliance",
    description: "Recent audit activity and system accountability signals.",
    icon: <Activity className="h-4 w-4" />
  }
];

export function HrSectionNav() {
  return (
    <nav className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {hrLinks.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#efc3a5] hover:shadow-[0_16px_34px_rgba(33,51,67,0.08)] dark:border-white/10 dark:bg-[#0d1729] dark:hover:border-[#ff7a59]/30"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#173042] text-white dark:bg-[#ff7a59]/15 dark:text-[#ffbeab]">
              {item.icon}
            </span>
            <p className="font-semibold text-ink dark:text-white">{item.label}</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">{item.description}</p>
        </Link>
      ))}
    </nav>
  );
}
