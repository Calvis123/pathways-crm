import type { PropsWithChildren } from "react";
import { headers } from "next/headers";
import { SessionTabGuard } from "@/components/auth/session-tab-guard";
import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentSession, isPublicPath } from "@/lib/auth";

export async function AppShell({ children }: PropsWithChildren) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "/";
  const session = await getCurrentSession();
  const isPublic = isPublicPath(pathname);

  if (isPublic && !session) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#fff8f3_0%,#fff1e8_36%,#fffaf6_100%)] transition-colors dark:bg-[linear-gradient(180deg,#050b15_0%,#09111f_18%,#0d1728_18%,#101a2d_100%)]">
        {children}
      </div>
    );
  }

  if (isPublic) {
    return (
      <div className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(198,155,59,0.12),transparent_24%),linear-gradient(180deg,#f7f3ea_0%,#f8fafc_24%,#eef3f8_100%)] transition-colors dark:bg-[radial-gradient(circle_at_top_left,rgba(255,122,89,0.14),transparent_22%),linear-gradient(180deg,#08111f_0%,#0d1728_28%,#101a2d_100%)] lg:grid-cols-[300px_1fr]">
        <Sidebar pathname={pathname} user={session} />
        <main className="space-y-6 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    );
  }

  return (
    <SessionTabGuard pathname={pathname}>
      <div className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(198,155,59,0.12),transparent_24%),linear-gradient(180deg,#f7f3ea_0%,#f8fafc_24%,#eef3f8_100%)] transition-colors dark:bg-[radial-gradient(circle_at_top_left,rgba(255,122,89,0.14),transparent_22%),linear-gradient(180deg,#08111f_0%,#0d1728_28%,#101a2d_100%)] lg:grid-cols-[300px_1fr]">
        <Sidebar pathname={pathname} user={session} />
        <main className="space-y-6 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </SessionTabGuard>
  );
}
