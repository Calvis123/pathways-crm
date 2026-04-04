"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { ReferralRecord, ReferralStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const statuses: ReferralStatus[] = ["new", "contacted", "converted", "rewarded"];

export function ReferralsManager({ referrals }: { referrals: ReferralRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    referrer_name: "",
    referrer_email: "",
    referrer_phone: "",
    referral_code: "",
    referred_student_name: "",
    referred_student_email: "",
    reward_amount: "5000",
    notes: ""
  });

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          reward_amount: Number(form.reward_amount)
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Failed to save referral.");
        return;
      }

      setForm({
        referrer_name: "",
        referrer_email: "",
        referrer_phone: "",
        referral_code: "",
        referred_student_name: "",
        referred_student_email: "",
        reward_amount: "5000",
        notes: ""
      });
      router.refresh();
    });
  }

  async function handleStatusChange(id: string, status: ReferralStatus) {
    startTransition(async () => {
      const response = await fetch(`/api/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Failed to update referral.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="dark:border-white/10 dark:bg-[#0d1729]">
        <CardHeader
          title="Referral Program"
          description="Capture alumni and partner referrals, track conversion, and manage reward payouts."
        />
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleCreate}>
          {[
            ["referrer_name", "Referrer name"],
            ["referrer_email", "Referrer email"],
            ["referrer_phone", "Referrer phone"],
            ["referral_code", "Referral code"],
            ["referred_student_name", "Referred student"],
            ["referred_student_email", "Student email"],
            ["reward_amount", "Reward amount"],
            ["notes", "Notes"]
          ].map(([key, label]) => (
            <label key={key} className="text-sm text-slate-600 dark:text-slate-300">
              <span className="mb-2 block font-medium text-ink dark:text-slate-100">{label}</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                value={form[key as keyof typeof form]}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [key]: event.target.value }))
                }
              />
            </label>
          ))}
          <div className="md:col-span-2 xl:col-span-4 flex items-center justify-between gap-3">
            <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Create Referral"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="dark:border-white/10 dark:bg-[#0d1729]">
        <CardHeader
          title="Referral Tracker"
          description={`${referrals.length} referral records tracked across outreach, conversion, and rewards.`}
        />
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Referrer</th>
                <th className="pb-3 font-medium">Referred Student</th>
                <th className="pb-3 font-medium">Code</th>
                <th className="pb-3 font-medium">Reward</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((referral) => (
                <tr key={referral.id} className="border-t border-slate-100 dark:border-white/10">
                  <td className="py-3">
                    <p className="font-medium text-ink dark:text-slate-100">{referral.referrer_name}</p>
                    <p className="text-slate-500 dark:text-slate-400">{referral.referrer_email ?? referral.referrer_phone ?? "-"}</p>
                  </td>
                  <td className="py-3">
                    <p className="font-medium text-ink dark:text-slate-100">{referral.referred_student_name}</p>
                    <p className="text-slate-500 dark:text-slate-400">{referral.referred_student_email ?? "-"}</p>
                  </td>
                  <td className="py-3 font-medium text-ink dark:text-slate-100">{referral.referral_code}</td>
                  <td className="py-3 dark:text-slate-200">{formatCurrency(referral.reward_amount)}</td>
                  <td className="py-3">
                    <select
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 capitalize dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                      value={referral.status}
                      onChange={(event) => handleStatusChange(referral.id, event.target.value as ReferralStatus)}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
