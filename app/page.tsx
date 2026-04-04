import { redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/landing-page";
import { getCurrentSession, getDefaultRouteForRole } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect(getDefaultRouteForRole(session.role));
  }

  return <LandingPage />;
}
