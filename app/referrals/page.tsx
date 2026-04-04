import { ReferralsManager } from "@/components/tables/referrals-manager";
import { getReferrals } from "@/lib/data";

export default async function ReferralsPage() {
  const referrals = await getReferrals();
  return <ReferralsManager referrals={referrals} />;
}
