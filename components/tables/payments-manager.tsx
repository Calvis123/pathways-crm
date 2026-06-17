"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { CONSULTATION_UPFRONT_AMOUNT } from "@/lib/finance";
import type { PaymentMethod, PaymentRecord, PaymentStatus, PaymentType, Student } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const paymentTypes: PaymentType[] = ["consultation", "application", "ielts", "visa", "tuition", "other"];
const paymentMethods: PaymentMethod[] = ["mpesa", "bank_transfer", "cash", "card"];
const statuses: PaymentStatus[] = ["paid", "pending", "partial", "overdue", "refunded"];
const ITEMS_PER_PAGE = 10;

export function PaymentsManager({
  payments,
  students
}: {
  payments: PaymentRecord[];
  students: Student[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [form, setForm] = useState({
    student_id: students[0]?.id ?? "",
    payment_type: "consultation" as PaymentType,
    amount: String(CONSULTATION_UPFRONT_AMOUNT),
    payment_method: "mpesa" as PaymentMethod,
    status: "paid" as PaymentStatus,
    reference_number: "",
    notes: ""
  });
  const pageCount = Math.max(1, Math.ceil(payments.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const paginatedPayments = payments.slice(safePage * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount)
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Failed to save payment.");
        return;
      }

      setForm((current) => ({
        ...current,
        amount: String(CONSULTATION_UPFRONT_AMOUNT),
        reference_number: "",
        notes: ""
      }));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Payment Tracker"
          description="Record consultation, IELTS, application, visa, and tuition payments like the legacy finance module."
        />
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleSubmit}>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-2 block font-medium text-ink dark:text-slate-100">Student</span>
            <select
              className="w-full rounded-lg border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              value={form.student_id}
              onChange={(event) => setForm((current) => ({ ...current, student_id: event.target.value }))}
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-2 block font-medium text-ink dark:text-slate-100">Type</span>
            <select
              className="w-full rounded-lg border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              value={form.payment_type}
              onChange={(event) =>
                setForm((current) => ({ ...current, payment_type: event.target.value as PaymentType }))
              }
            >
              {paymentTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-2 block font-medium text-ink dark:text-slate-100">Amount</span>
            <input
              className="w-full rounded-lg border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-2 block font-medium text-ink dark:text-slate-100">Method</span>
            <select
              className="w-full rounded-lg border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              value={form.payment_method}
              onChange={(event) =>
                setForm((current) => ({ ...current, payment_method: event.target.value as PaymentMethod }))
              }
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-2 block font-medium text-ink dark:text-slate-100">Status</span>
            <select
              className="w-full rounded-lg border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PaymentStatus }))}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-2 block font-medium text-ink dark:text-slate-100">Reference</span>
            <input
              className="w-full rounded-lg border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              value={form.reference_number}
              onChange={(event) =>
                setForm((current) => ({ ...current, reference_number: event.target.value }))
              }
              placeholder="M-Pesa code / transfer ref"
            />
          </label>
          <label className="text-sm text-slate-600 md:col-span-2 dark:text-slate-300">
            <span className="mb-2 block font-medium text-ink dark:text-slate-100">Notes</span>
            <input
              className="w-full rounded-lg border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Any payment context, promise date, or verification note"
            />
          </label>
          <div className="md:col-span-2 xl:col-span-4 flex items-center justify-between gap-3">
            <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
            <Button type="submit" disabled={isPending || !form.student_id}>
              {isPending ? "Saving..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="Recent Payments"
          description={`${payments.length} tracked payment records across consultation, application, IELTS, and placement work.`}
        />
        {payments.length > ITEMS_PER_PAGE ? (
          <div className="mb-4">
            <PaginationControls
              page={safePage}
              pageCount={pageCount}
              total={payments.length}
              perPage={ITEMS_PER_PAGE}
              onPageChange={setPage}
              label="payments"
            />
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.map((payment) => (
                <tr key={payment.id} className="border-t border-[#f0dfd0] dark:border-white/10">
                  <td className="py-3">
                    <p className="font-medium text-ink dark:text-slate-100">{payment.student?.full_name ?? payment.student_id}</p>
                    <p className="text-slate-500 dark:text-slate-400">{payment.student?.email ?? "No email"}</p>
                  </td>
                  <td className="py-3 capitalize dark:text-slate-200">{payment.payment_type.replace(/_/g, " ")}</td>
                  <td className="py-3 font-medium text-ink dark:text-slate-100">{formatCurrency(payment.amount)}</td>
                  <td className="py-3 capitalize dark:text-slate-200">{payment.status}</td>
                  <td className="py-3 capitalize dark:text-slate-200">{payment.payment_method.replace(/_/g, " ")}</td>
                  <td className="py-3 dark:text-slate-300">{payment.reference_number ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
