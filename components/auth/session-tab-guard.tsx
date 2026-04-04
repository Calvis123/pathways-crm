"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { PageLoading } from "@/components/layout/page-loading";

export const TAB_SESSION_STORAGE_KEY = "barak_crm_tab_session";

export function SessionTabGuard({
  pathname,
  children
}: {
  pathname: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const tabSession = window.sessionStorage.getItem(TAB_SESSION_STORAGE_KEY);

    if (tabSession) {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function logoutAndRedirect() {
      try {
        await fetch("/api/session/logout", { method: "POST" });
      } catch {
        // Ignore network issues and continue redirecting to force a fresh login.
      }

      if (cancelled) return;
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}` as Route);
    }

    void logoutAndRedirect();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <PageLoading
        title="Securing your CRM"
        description="We’re checking this browser tab before opening the CRM."
      />
    );
  }

  return <>{children}</>;
}
