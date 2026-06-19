import { ReferralsManager } from "@/components/tables/referrals-manager";
import { canAccessFinance, getCurrentSession } from "@/lib/auth";
import { getReferrals } from "@/lib/data";

export default async function ReferralsPage() {
  const [referrals, session] = await Promise.all([getReferrals(), getCurrentSession()]);
  return <ReferralsManager referrals={referrals} canSeeFinance={canAccessFinance(session?.role)} />;
}
