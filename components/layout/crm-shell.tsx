"use client";

import type { ReactNode } from "react";
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

  return (
    <div className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(198,155,59,0.12),transparent_24%),linear-gradient(180deg,#f7f3ea_0%,#f8fafc_24%,#eef3f8_100%)] transition-colors dark:bg-[radial-gradient(circle_at_top_left,rgba(255,122,89,0.14),transparent_22%),linear-gradient(180deg,#08111f_0%,#0d1728_28%,#101a2d_100%)] lg:grid-cols-[300px_1fr]">
      <div className="hidden lg:block">
        <Sidebar pathname={pathname} user={user} />
      </div>

      <div className="lg:hidden">
        <div className="sticky top-0 z-40 border-b border-[#ead7c9] bg-[linear-gradient(180deg,#fffaf5_0%,#fff3ea_100%)] px-4 py-3 shadow-[0_16px_40px_rgba(168,116,84,0.1)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(180deg,#0c1628_0%,#101a2d_100%)] dark:shadow-[0_16px_40px_rgba(8,17,31,0.28)]">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e7d3c4] bg-white/80 text-[#17324d] shadow-[0_12px_24px_rgba(33,51,67,0.06)] dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              aria-label="Open CRM menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <BrandLogo imageClassName="w-[136px] px-2 py-1.5 shadow-[0_12px_24px_rgba(33,51,67,0.08)] dark:shadow-[0_10px_22px_rgba(255,255,255,0.08)]" />
            <ThemeToggle className="h-11 min-w-11 justify-center px-3 border-[#e7d3c4] bg-white/80 text-[#17324d] dark:border-white/10 dark:bg-white/[0.06] dark:text-white" />
          </div>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-[#09111f]/55 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-label="Close CRM menu overlay"
            />
            <div className="relative h-full max-w-[320px]">
              <Sidebar
                pathname={pathname}
                user={user}
                onNavigate={() => setMobileOpen(false)}
                className="relative z-10 h-full w-[320px] max-w-[86vw] border-r border-[#ead7c9] shadow-[0_30px_80px_rgba(33,51,67,0.18)] dark:border-white/10 dark:shadow-[0_30px_80px_rgba(2,6,23,0.4)]"
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

      <main className="space-y-6 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
