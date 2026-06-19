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

  if (isPublic) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#fff8f3_0%,#fff1e8_36%,#fffaf6_100%)] transition-colors dark:bg-[linear-gradient(180deg,#111d2b_0%,#213343_18%,#1b2a3d_18%,#182638_100%)]">
        {children}
      </div>
    );
  }

  return (
    <SessionTabGuard pathname={pathname}>
      <CrmShell pathname={pathname} user={session}>{children}</CrmShell>
    </SessionTabGuard>
  );
}
