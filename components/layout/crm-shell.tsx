"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/branding/brand-logo";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { AppRole } from "@/lib/types";

export function CrmShell({
  pathname,
  user,
  children
}: {
  pathname: string;
  user: { username: string; full_name: string; role: AppRole } | null;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activePathname = usePathname() ?? pathname;

  return (
    <div className="grid min-h-screen bg-[linear-gradient(180deg,#fffaf5_0%,#fff1e6_48%,#f8ede3_100%)] text-slate-950 transition-colors dark:bg-[#142233] dark:text-slate-50 lg:grid-cols-[292px_1fr]">
      <div className="hidden lg:block">
        <Sidebar pathname={activePathname} user={user} />
      </div>

      <div className="lg:hidden">
        <div className="sticky top-0 z-40 border-b border-[#eadacc] bg-[#fffaf5]/95 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#182638]/95">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#eadacc] bg-white text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              aria-label="Open CRM menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <BrandLogo imageClassName="w-[136px] px-2 py-1.5 shadow-[0_12px_24px_rgba(33,51,67,0.08)] dark:shadow-[0_10px_22px_rgba(255,255,255,0.08)]" />
            <ThemeToggle className="h-11 min-w-11 justify-center rounded-lg border-[#eadacc] bg-white px-3 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-white" />
          </div>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-[#213343]/55 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-label="Close CRM menu overlay"
            />
            <div className="relative h-full max-w-[320px]">
              <Sidebar
                pathname={activePathname}
                user={user}
                onNavigate={() => setMobileOpen(false)}
                className="relative z-10 h-full w-[320px] max-w-[86vw] border-r border-[#eadacc] shadow-[0_30px_80px_rgba(15,23,42,0.16)] dark:border-white/10 dark:shadow-[0_30px_80px_rgba(2,6,23,0.4)]"
              />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white"
                aria-label="Close CRM menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <main className="space-y-5 px-4 py-5 lg:px-6 lg:py-6 2xl:px-8">{children}</main>
    </div>
  );
}
