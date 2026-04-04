import type { PropsWithChildren } from "react";
import { headers } from "next/headers";
import { CrmShell } from "@/components/layout/crm-shell";
import { SessionTabGuard } from "@/components/auth/session-tab-guard";
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
      <CrmShell pathname={pathname} user={session}>{children}</CrmShell>
    );
  }

  return (
    <SessionTabGuard pathname={pathname}>
      <CrmShell pathname={pathname} user={session}>{children}</CrmShell>
    </SessionTabGuard>
  );
}
