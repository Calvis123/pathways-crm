"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  airplaneOutline,
  attachOutline,
  bookOutline,
  businessOutline,
  cashOutline,
  cubeOutline,
  flashOutline,
  globeOutline,
  laptopOutline,
  megaphoneOutline
} from "ionicons/icons";
import { IonIcon } from "@/components/ui/ion-icon";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ExpenseCategory, ExpensePaymentMethod, ExpenseRecord } from "@/lib/types";

type TabKey = "cashflow" | "credit" | "expenses" | "reminders";

const legacyExpenseCategories: Record<ExpenseCategory, string> = {
  rent: "🏢 Rent & Office",
  salaries: "💰 Salaries & Wages",
  marketing: "📢 Marketing & Ads",
  utilities: "⚡ Utilities",
  office_supplies: "📎 Office Supplies",
  travel: "✈️ Travel & Transport",
  training: "📚 Training & Development",
  internet: "🌐 Internet & Phone",
  software: "💻 Software & Subscriptions",
  other: "📦 Other"
};

const expenseCategories: Record<ExpenseCategory, { label: string; icon: string }> = {
  rent: { label: "Rent & Office", icon: businessOutline },
  salaries: { label: "Salaries & Wages", icon: cashOutline },
  marketing: { label: "Marketing & Ads", icon: megaphoneOutline },
  utilities: { label: "Utilities", icon: flashOutline },
  office_supplies: { label: "Office Supplies", icon: attachOutline },
  travel: { label: "Travel & Transport", icon: airplaneOutline },
  training: { label: "Training & Development", icon: bookOutline },
  internet: { label: "Internet & Phone", icon: globeOutline },
  software: { label: "Software & Subscriptions", icon: laptopOutline },
  other: { label: "Other", icon: cubeOutline }
};

const paymentMethodOptions: ExpensePaymentMethod[] = ["cash", "mpesa", "bank", "card"];

export function FinancialToolsManager({
  startDate,
  endDate,
  metrics,
  cashFlow,
  creditRecords,
  expenses,
  expensesByCategory,
  currentUsername,
  reminderItems
}: {
  startDate: string;
  endDate: string;
  metrics: {
    totalCreditExposure: number;
    totalOverdue: number;
    collectionRate: number;
    netProfit: number;
    profitMargin: number;
    totalIncome: number;
    totalExpenses: number;
    currentReceivables: number;
  };
  cashFlow: Array<{ date: string; in: number; out: number; net: number }>;
  creditRecords: Array<{
    id: string;
    full_name: string;
    phone: string | null;
    amount_owed: number;
    payment_due_date: string | null;
    days_overdue: number | null;
  }>;
  expenses: ExpenseRecord[];
  expensesByCategory: Array<{ category: ExpenseCategory; amount: number }>;
  currentUsername: string | null;
  reminderItems: Array<{
    id: string;
    full_name: string;
    amount_owed: number;
    payment_due_date: string;
    is_overdue: boolean;
  }>;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("cashflow");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState({ startDate, endDate });
  const [form, setForm] = useState({
    category: "marketing" as ExpenseCategory,
    amount: "",
    description: "",
    expense_date: new Date().toISOString().slice(0, 10),
    payment_method: "" as ExpensePaymentMethod | "",
    receipt_number: "",
    vendor: ""
  });

  function showTab(tab: TabKey) {
    setActiveTab(tab);
  }

  function filterCashFlow() {
    if (!filters.startDate || !filters.endDate) return;
    window.location.assign(
      `/financial-tools?start_date=${filters.startDate}&end_date=${filters.endDate}`
    );
  }

  async function handleExpenseSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          payment_method: form.payment_method || null,
          receipt_number: form.receipt_number || null,
          vendor: form.vendor || null,
          description: form.description || null
        })
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Failed to add expense.");
        return;
      }

      setSuccess("Expense added successfully.");
      setForm((current) => ({
        ...current,
        amount: "",
        description: "",
        receipt_number: "",
        vendor: ""
      }));
      router.refresh();
    });
  }

  async function handleDeleteExpense(id: string) {
    setError(null);
    setSuccess(null);

    if (!window.confirm("Delete this expense?")) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to delete expense.");
        return;
      }

      setSuccess("Expense deleted successfully.");
      router.refresh();
    });
  }

  function reminderLink(name: string, amount: number, dueDate: string) {
    const text = `Hi ${name}, payment of KES ${amount.toLocaleString("en-KE")} is due on ${dueDate}.`;
    return `https://wa.me/254113043315?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-panel dark:border-white/10 dark:bg-[#0d1729]">
        <div className="border-b border-gold/20 bg-[#0f172a] px-8 py-6 text-white dark:border-white/10 dark:bg-[linear-gradient(135deg,#09111f,#15223a)]">
          <h1 className="font-serif text-3xl">Financial Management Tools</h1>
          <p className="mt-2 text-sm text-white/70">
            Complete financial tracking: credit, cash flow, expenses, and payment reminders.
          </p>
        </div>

        <div className="space-y-6 px-8 py-8">
          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              {success}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="Credit Exposure" value={formatCurrency(metrics.totalCreditExposure)} sub="Total outstanding" />
            <MetricCard label="Total Overdue" value={formatCurrency(metrics.totalOverdue)} sub="Past due date" accent={metrics.totalOverdue > 0 ? "text-rose-600" : "text-emerald-600"} />
            <MetricCard label="Collection Rate" value={`${metrics.collectionRate.toFixed(1)}%`} sub="Payment collection" />
            <MetricCard label="Profit Margin" value={`${metrics.profitMargin.toFixed(1)}%`} sub="Target: 5%+" accent={metrics.profitMargin >= 5 ? "text-emerald-600" : metrics.profitMargin >= 0 ? "text-amber-600" : "text-rose-600"} />
            <MetricCard label="Net Profit/Loss" value={formatCurrency(metrics.netProfit)} sub="Income - Expenses" accent={metrics.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"} />
            <MetricCard label="Current Receivables" value={formatCurrency(metrics.currentReceivables)} sub="Outstanding - Overdue" />
          </div>

          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-white/10">
            <TabButton active={activeTab === "cashflow"} onClick={() => showTab("cashflow")}>Cash Flow</TabButton>
            <TabButton active={activeTab === "credit"} onClick={() => showTab("credit")}>Credit Records</TabButton>
            <TabButton active={activeTab === "expenses"} onClick={() => showTab("expenses")}>Expenses</TabButton>
            <TabButton active={activeTab === "reminders"} onClick={() => showTab("reminders")}>Payment Reminders</TabButton>
          </div>

          {activeTab === "cashflow" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-white/[0.04]">
                <label className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="mb-2 block font-medium text-ink dark:text-white">From</span>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:[color-scheme:dark]"
                  />
                </label>
                <label className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="mb-2 block font-medium text-ink dark:text-white">To</span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:[color-scheme:dark]"
                  />
                </label>
                <button type="button" onClick={filterCashFlow} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">
                  Update
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Total In" value={formatCurrency(metrics.totalIncome)} accent="text-emerald-600" />
                <MetricCard label="Total Out" value={formatCurrency(metrics.totalExpenses)} accent="text-rose-600" />
                <MetricCard label="Net Cash Flow" value={formatCurrency(metrics.netProfit)} accent={metrics.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"} />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full">
                  <thead className="bg-[#0f172a] text-left text-xs uppercase tracking-[0.08em] text-white">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Cash In</th>
                      <th className="px-4 py-3">Cash Out</th>
                      <th className="px-4 py-3">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlow.map((day) => (
                      <tr key={day.date} className={day.net < 0 ? "bg-rose-50" : ""}>
                        <td className="px-4 py-3">{formatDate(day.date)}</td>
                        <td className="px-4 py-3 text-emerald-700">{formatCurrency(day.in)}</td>
                        <td className="px-4 py-3 text-rose-700">{formatCurrency(day.out)}</td>
                        <td className={`px-4 py-3 font-semibold ${day.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {formatCurrency(day.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeTab === "credit" ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full">
                <thead className="bg-[#0f172a] text-left text-xs uppercase tracking-[0.08em] text-white">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Amount Owed</th>
                    <th className="px-4 py-3">Payment Due</th>
                    <th className="px-4 py-3">Days Overdue</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {creditRecords.map((student) => {
                    const tone =
                      student.days_overdue && student.days_overdue > 30
                        ? "bg-rose-100 text-rose-800"
                        : student.days_overdue && student.days_overdue > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800";

                    const label =
                      student.days_overdue && student.days_overdue > 30
                        ? `${student.days_overdue} Days`
                        : student.days_overdue && student.days_overdue > 0
                          ? "0-30 Days"
                          : "Current";

                    return (
                      <tr key={student.id} className="border-b border-slate-100 hover:bg-gold/5">
                        <td className="px-4 py-3 font-semibold text-ink">{student.full_name}</td>
                        <td className="px-4 py-3">{student.phone ?? "-"}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(student.amount_owed)}</td>
                        <td className="px-4 py-3">{student.payment_due_date ? formatDate(student.payment_due_date) : "Not set"}</td>
                        <td className="px-4 py-3">{student.days_overdue ?? "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href="https://wa.me/254113043315"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-xl bg-[#25d366] px-3 py-2 text-sm font-semibold text-white"
                          >
                            Follow Up
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {activeTab === "expenses" ? (
            <div className="space-y-8">
              <form onSubmit={handleExpenseSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-2">
                <label className="text-sm text-slate-600">
                  <span className="mb-2 block font-medium text-ink">Category</span>
                  <select
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ExpenseCategory }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    {Object.entries(expenseCategories).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-600">
                  <span className="mb-2 block font-medium text-ink">Amount (KES)</span>
                  <input
                    value={form.amount}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                    placeholder="0.00"
                  />
                </label>
                <label className="text-sm text-slate-600 md:col-span-2">
                  <span className="mb-2 block font-medium text-ink">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                    rows={2}
                    placeholder="What was this expense for?"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  <span className="mb-2 block font-medium text-ink">Expense Date</span>
                  <input
                    type="date"
                    value={form.expense_date}
                    onChange={(event) => setForm((current) => ({ ...current, expense_date: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  <span className="mb-2 block font-medium text-ink">Payment Method</span>
                  <select
                    value={form.payment_method}
                    onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value as ExpensePaymentMethod | "" }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <option value="">Select method...</option>
                    {paymentMethodOptions.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-600">
                  <span className="mb-2 block font-medium text-ink">Receipt / Invoice Number</span>
                  <input
                    value={form.receipt_number}
                    onChange={(event) => setForm((current) => ({ ...current, receipt_number: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                    placeholder="INV-001"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  <span className="mb-2 block font-medium text-ink">Vendor / Paid To</span>
                  <input
                    value={form.vendor}
                    onChange={(event) => setForm((current) => ({ ...current, vendor: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                    placeholder="Who was paid?"
                  />
                </label>
                <div className="md:col-span-2 flex justify-end">
                  <button type="submit" disabled={isPending} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                    Add Expense
                  </button>
                </div>
              </form>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {expensesByCategory.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                    No expenses recorded yet.
                  </div>
                ) : (
                  expensesByCategory.map((item) => (
                    <div key={item.category} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xl font-semibold text-ink">{formatCurrency(item.amount)}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <IonIcon icon={expenseCategories[item.category].icon} className="h-4 w-4" />
                        {expenseCategories[item.category].label}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full">
                  <thead className="bg-[#0f172a] text-left text-xs uppercase tracking-[0.08em] text-white">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Vendor</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                          No expenses recorded yet. Add your first expense using the form.
                        </td>
                      </tr>
                    ) : null}
                    {expenses.slice(0, 50).map((expense) => (
                      <tr key={expense.id} className="border-b border-slate-100 hover:bg-gold/5">
                        <td className="px-4 py-3">{formatDate(expense.expense_date)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                            <IonIcon icon={expenseCategories[expense.category].icon} className="h-3.5 w-3.5" />
                            {expenseCategories[expense.category].label}
                          </span>
                        </td>
                        <td className="px-4 py-3">{expense.description ?? "-"}</td>
                        <td className="px-4 py-3">{expense.vendor ?? "-"}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(expense.amount)}</td>
                        <td className="px-4 py-3">
                          {expense.created_by === currentUsername ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => void handleDeleteExpense(expense.id)}
                              className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Delete
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeTab === "reminders" ? (
            <div className="space-y-3">
              {reminderItems.length === 0 ? (
                <p className="text-sm text-slate-500">No payments due in the next 7 days.</p>
              ) : null}
              {reminderItems.map((payment) => (
                <div
                  key={payment.id}
                  className={`flex flex-col justify-between gap-3 rounded-2xl border-l-4 p-4 md:flex-row md:items-center ${payment.is_overdue ? "border-rose-600 bg-rose-50" : "border-gold bg-gold/10"}`}
                >
                  <div>
                    <p className="font-semibold text-ink">{payment.full_name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatCurrency(payment.amount_owed)} due on {formatDate(payment.payment_due_date)}
                    </p>
                  </div>
                  <a
                    href={reminderLink(payment.full_name, payment.amount_owed, payment.payment_due_date)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-xl bg-[#25d366] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Send Reminder
                  </a>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent = "text-ink"
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.05]">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${accent}`}>{value}</p>
      {sub ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{sub}</p> : null}
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-t-2xl px-4 py-3 text-sm font-semibold transition ${active ? "border-b-2 border-gold text-gold" : "text-slate-500 hover:bg-gold/10 hover:text-ink"}`}
    >
      {children}
    </button>
  );
}
