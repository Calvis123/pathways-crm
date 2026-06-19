"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Download, Plus, Printer, Trash2 } from "lucide-react";
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
import { PaginationControls } from "@/components/ui/pagination-controls";
import { CONSULTATION_FEE } from "@/lib/finance";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AppRole, ExpenseCategory, ExpensePaymentMethod, ExpenseRecord } from "@/lib/types";
import { canAccessFinance } from "@/lib/auth-shared";

type TabKey = "cashflow" | "credit" | "expenses" | "invoices" | "receipts" | "reminders";
type DocumentKind = "invoice" | "receipt";

type DocumentLineItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

const ITEMS_PER_PAGE = 10;

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

function documentNumber(kind: DocumentKind) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 5).replace(":", "");
  return `${kind === "invoice" ? "INV" : "REC"}-${date}-${time}`;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function FinancialToolsManager({
  startDate,
  endDate,
  metrics,
  cashFlow,
  creditRecords,
  expenses,
  expensesByCategory,
  currentUsername,
  currentRole,
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
    email: string;
    phone: string | null;
    amount_owed: number;
    payment_due_date: string | null;
    days_overdue: number | null;
  }>;
  expenses: ExpenseRecord[];
  expensesByCategory: Array<{ category: ExpenseCategory; amount: number }>;
  currentUsername: string | null;
  currentRole: AppRole | null;
  reminderItems: Array<{
    id: string;
    full_name: string;
    amount_owed: number;
    payment_due_date: string;
    is_overdue: boolean;
  }>;
}) {
  const router = useRouter();
  const canViewFullFinancialTools = canAccessFinance(currentRole);
  const [activeTab, setActiveTab] = useState<TabKey>(canViewFullFinancialTools ? "cashflow" : "invoices");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [creditPage, setCreditPage] = useState(0);
  const [expensesPage, setExpensesPage] = useState(0);
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
  const [financeDocument, setFinanceDocument] = useState({
    kind: "invoice" as DocumentKind,
    number: documentNumber("invoice"),
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: addDays(new Date().toISOString().slice(0, 10), 7),
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    paymentMethod: "M-Pesa",
    paymentReference: "",
    taxRate: "0",
    notes: "Thank you for choosing Barak Pathways. We appreciate your business."
  });
  const [lineItems, setLineItems] = useState<DocumentLineItem[]>([
    {
      id: "item-1",
      description: "Consultation service",
      quantity: "1",
      unitPrice: String(CONSULTATION_FEE)
    }
  ]);
  const creditPageCount = Math.max(1, Math.ceil(creditRecords.length / ITEMS_PER_PAGE));
  const safeCreditPage = Math.min(creditPage, creditPageCount - 1);
  const paginatedCreditRecords = creditRecords.slice(
    safeCreditPage * ITEMS_PER_PAGE,
    safeCreditPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );
  const expensesPageCount = Math.max(1, Math.ceil(expenses.length / ITEMS_PER_PAGE));
  const safeExpensesPage = Math.min(expensesPage, expensesPageCount - 1);
  const paginatedExpenses = expenses.slice(
    safeExpensesPage * ITEMS_PER_PAGE,
    safeExpensesPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0);
  const taxAmount = subtotal * ((Number(financeDocument.taxRate) || 0) / 100);
  const grandTotal = subtotal + taxAmount;

  function showTab(tab: TabKey) {
    setActiveTab(tab);
  }

  function showFinanceDocumentTab(tab: "invoices" | "receipts") {
    const kind: DocumentKind = tab === "invoices" ? "invoice" : "receipt";

    setActiveTab(tab);
    setFinanceDocument((current) => ({
      ...current,
      kind,
      number:
        current.number === "" || current.number.startsWith(kind === "invoice" ? "REC" : "INV")
          ? documentNumber(kind)
          : current.number,
      notes:
        current.kind === kind
          ? current.notes
          : kind === "invoice"
            ? "Payment is due by the stated date. Thank you for choosing Barak Pathways."
            : "Payment received with thanks. Please keep this receipt for your records."
    }));
  }

  function filterCashFlow() {
    if (!filters.startDate || !filters.endDate) return;
    window.location.assign(
      `/financial-tools?start_date=${filters.startDate}&end_date=${filters.endDate}`
    );
  }

  function loadCreditRecord(studentId: string) {
    const record = creditRecords.find((item) => item.id === studentId);
    if (!record) return;

    setFinanceDocument((current) => ({
      ...current,
      kind: "invoice",
      number: current.kind === "invoice" ? current.number : documentNumber("invoice"),
      clientName: record.full_name,
      clientEmail: record.email,
      clientPhone: record.phone ?? "",
      clientAddress: "",
      dueDate: record.payment_due_date ?? addDays(current.issueDate, 7),
      notes: `Payment is due by ${formatDate(record.payment_due_date ?? addDays(current.issueDate, 7))}. Thank you for choosing Barak Pathways.`
    }));
    setLineItems([
      {
        id: `student-${record.id}`,
        description: "Outstanding consultation balance",
        quantity: "1",
        unitPrice: String(record.amount_owed)
      }
    ]);
    setActiveTab("invoices");
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

  function updateLineItem(id: string, field: keyof Omit<DocumentLineItem, "id">, value: string) {
    setLineItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function addLineItem() {
    setLineItems((current) => [
      ...current,
      {
        id: `item-${Date.now()}`,
        description: "",
        quantity: "1",
        unitPrice: ""
      }
    ]);
  }

  function removeLineItem(id: string) {
    setLineItems((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  }

  function printGeneratedDocument() {
    const preview = window.document.getElementById("finance-document-preview");
    if (!preview) return;

    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(getGeneratedDocumentHtml(preview.innerHTML));
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 250);
  }

  function downloadGeneratedDocument() {
    const preview = window.document.getElementById("finance-document-preview");
    if (!preview) return;

    const html = getGeneratedDocumentHtml(preview.innerHTML);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    const documentName = financeDocument.number.trim() || `${financeDocument.kind}-${new Date().toISOString().slice(0, 10)}`;
    link.href = url;
    link.download = `${documentName.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "")}.html`;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function getGeneratedDocumentHtml(content: string) {
    const styles = Array.from(window.document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join("");

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <base href="${window.location.origin}" />
          <title>${financeDocument.kind === "invoice" ? "Invoice" : "Receipt"} ${financeDocument.number}</title>
          ${styles}
          <style>
            body { margin: 0; background: #f4f4f4; color: #555; font-family: Arial, Helvetica, sans-serif; }
            .print-shell { box-sizing: border-box; min-height: 100vh; padding: 24px; }
            #finance-document-preview { margin: 0 auto; max-width: 840px; box-shadow: none !important; }
            @media print {
              body { background: white; }
              .print-shell { min-height: auto; padding: 0; }
              #finance-document-preview { border: 0 !important; max-width: none; }
            }
          </style>
        </head>
        <body><div class="print-shell"><div id="finance-document-preview">${content}</div></div></body>
      </html>
    `;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#eadacc] bg-white shadow-panel dark:border-white/10 dark:bg-[#182638]">
        <div className="border-b border-gold/20 bg-[linear-gradient(135deg,#213343,#3f5a68)] px-8 py-6 text-white dark:border-white/10 dark:bg-[linear-gradient(135deg,#213343,#3f5a68)]">
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

          <div className="flex flex-wrap gap-2 border-b border-[#eadacc] dark:border-white/10">
            {canViewFullFinancialTools ? (
              <>
                <TabButton active={activeTab === "cashflow"} onClick={() => showTab("cashflow")}>Cash Flow</TabButton>
                <TabButton active={activeTab === "credit"} onClick={() => showTab("credit")}>Credit Records</TabButton>
                <TabButton active={activeTab === "expenses"} onClick={() => showTab("expenses")}>Expenses</TabButton>
              </>
            ) : null}
            <TabButton active={activeTab === "invoices"} onClick={() => showFinanceDocumentTab("invoices")}>Invoices</TabButton>
            <TabButton active={activeTab === "receipts"} onClick={() => showFinanceDocumentTab("receipts")}>Receipts</TabButton>
            {canViewFullFinancialTools ? (
              <TabButton active={activeTab === "reminders"} onClick={() => showTab("reminders")}>Payment Reminders</TabButton>
            ) : null}
          </div>

          {canViewFullFinancialTools && activeTab === "cashflow" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#eadacc] bg-[#fff6ef] px-5 py-4 dark:border-white/10 dark:bg-white/[0.04]">
                <label className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="mb-2 block font-medium text-ink dark:text-white">From</span>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
                    className="rounded-xl border border-[#eadacc] bg-white px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:[color-scheme:dark]"
                  />
                </label>
                <label className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="mb-2 block font-medium text-ink dark:text-white">To</span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
                    className="rounded-xl border border-[#eadacc] bg-white px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:[color-scheme:dark]"
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

              <div className="overflow-x-auto rounded-2xl border border-[#eadacc]">
                <table className="min-w-full">
                  <thead className="bg-[linear-gradient(135deg,#213343,#3f5a68)] text-left text-xs uppercase tracking-[0.08em] text-white">
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

          {canViewFullFinancialTools && activeTab === "credit" ? (
            <div className="overflow-x-auto rounded-2xl border border-[#eadacc]">
              {creditRecords.length > ITEMS_PER_PAGE ? (
                <div className="border-b border-[#eadacc] bg-[#fffaf5] p-3">
                  <PaginationControls
                    page={safeCreditPage}
                    pageCount={creditPageCount}
                    total={creditRecords.length}
                    perPage={ITEMS_PER_PAGE}
                    onPageChange={setCreditPage}
                    label="credit records"
                  />
                </div>
              ) : null}
              <table className="min-w-full">
                <thead className="bg-[linear-gradient(135deg,#213343,#3f5a68)] text-left text-xs uppercase tracking-[0.08em] text-white">
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
                  {paginatedCreditRecords.map((student) => {
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
                      <tr key={student.id} className="border-b border-[#f0dfd0] hover:bg-gold/5">
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

          {canViewFullFinancialTools && activeTab === "expenses" ? (
            <div className="space-y-8">
              <form onSubmit={handleExpenseSubmit} className="grid gap-4 rounded-2xl border border-[#eadacc] bg-[#fff6ef] p-5 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-2">
                <label className="text-sm text-slate-600">
                  <span className="mb-2 block font-medium text-ink">Category</span>
                  <select
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ExpenseCategory }))}
                    className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3"
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
                    className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3"
                    placeholder="0.00"
                  />
                </label>
                <label className="text-sm text-slate-600 md:col-span-2">
                  <span className="mb-2 block font-medium text-ink">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3"
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
                    className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  <span className="mb-2 block font-medium text-ink">Payment Method</span>
                  <select
                    value={form.payment_method}
                    onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value as ExpensePaymentMethod | "" }))}
                    className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3"
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
                    className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3"
                    placeholder="INV-001"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  <span className="mb-2 block font-medium text-ink">Vendor / Paid To</span>
                  <input
                    value={form.vendor}
                    onChange={(event) => setForm((current) => ({ ...current, vendor: event.target.value }))}
                    className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3"
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
                  <div className="rounded-2xl border border-[#eadacc] bg-[#fff6ef] px-4 py-6 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                    No expenses recorded yet.
                  </div>
                ) : (
                  expensesByCategory.map((item) => (
                    <div key={item.category} className="rounded-2xl border border-[#eadacc] bg-[#fff6ef] p-4">
                      <p className="text-xl font-semibold text-ink">{formatCurrency(item.amount)}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <IonIcon icon={expenseCategories[item.category].icon} className="h-4 w-4" />
                        {expenseCategories[item.category].label}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#eadacc]">
                {expenses.length > ITEMS_PER_PAGE ? (
                  <div className="border-b border-[#eadacc] bg-[#fffaf5] p-3">
                    <PaginationControls
                      page={safeExpensesPage}
                      pageCount={expensesPageCount}
                      total={expenses.length}
                      perPage={ITEMS_PER_PAGE}
                      onPageChange={setExpensesPage}
                      label="expenses"
                    />
                  </div>
                ) : null}
                <table className="min-w-full">
                  <thead className="bg-[linear-gradient(135deg,#213343,#3f5a68)] text-left text-xs uppercase tracking-[0.08em] text-white">
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
                    {paginatedExpenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-[#f0dfd0] hover:bg-gold/5">
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

          {activeTab === "invoices" || activeTab === "receipts" ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
              <div className="space-y-5">
                <div className="rounded-2xl border border-[#eadacc] bg-[#fff6ef] p-5 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                      {financeDocument.kind === "invoice" ? "Invoice Generator" : "Receipt Generator"}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-ink dark:text-white">
                      {financeDocument.kind === "invoice" ? "Create a Professional Invoice" : "Create a Professional Receipt"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {financeDocument.kind === "invoice"
                        ? "Enter billing details, service items, tax, and due date before printing or saving as PDF."
                        : "Enter payer details, payment method, reference, and received items before printing or saving as PDF."}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="mb-2 block font-medium text-ink dark:text-white">Document Number</span>
                      <input
                        value={financeDocument.number}
                        onChange={(event) => setFinanceDocument((current) => ({ ...current, number: event.target.value }))}
                        className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                        placeholder="INV-2026-001"
                      />
                    </label>
                    <label className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="mb-2 block font-medium text-ink dark:text-white">Issue Date</span>
                      <input
                        type="date"
                        value={financeDocument.issueDate}
                        onChange={(event) => setFinanceDocument((current) => ({ ...current, issueDate: event.target.value }))}
                        className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:[color-scheme:dark]"
                      />
                    </label>
                    <label className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="mb-2 block font-medium text-ink dark:text-white">
                        {financeDocument.kind === "invoice" ? "Due Date" : "Payment Date"}
                      </span>
                      <input
                        type="date"
                        value={financeDocument.dueDate}
                        onChange={(event) => setFinanceDocument((current) => ({ ...current, dueDate: event.target.value }))}
                        className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:[color-scheme:dark]"
                      />
                    </label>
                  </div>
                </div>

                {activeTab === "invoices" && creditRecords.length > 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/25 dark:bg-amber-500/10">
                    <h2 className="text-base font-semibold text-ink dark:text-white">Create From Student Balance</h2>
                    <label className="mt-4 block text-sm text-slate-600 dark:text-slate-300">
                      <span className="mb-2 block font-medium text-ink dark:text-white">Outstanding Student</span>
                      <select
                        defaultValue=""
                        onChange={(event) => {
                          if (event.target.value) {
                            loadCreditRecord(event.target.value);
                            event.currentTarget.value = "";
                          }
                        }}
                        className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                      >
                        <option value="">Select a student balance...</option>
                        {creditRecords.map((record) => (
                          <option key={record.id} value={record.id}>
                            {record.full_name} - {formatCurrency(record.amount_owed)}
                            {record.payment_due_date ? ` due ${formatDate(record.payment_due_date)}` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-[#eadacc] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
                  <h2 className="text-base font-semibold text-ink dark:text-white">Client Details</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="mb-2 block font-medium text-ink dark:text-white">Client Name</span>
                      <input
                        value={financeDocument.clientName}
                        onChange={(event) => setFinanceDocument((current) => ({ ...current, clientName: event.target.value }))}
                        className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                        placeholder="Student or company name"
                      />
                    </label>
                    <label className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="mb-2 block font-medium text-ink dark:text-white">Phone</span>
                      <input
                        value={financeDocument.clientPhone}
                        onChange={(event) => setFinanceDocument((current) => ({ ...current, clientPhone: event.target.value }))}
                        className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                        placeholder="+254..."
                      />
                    </label>
                    <label className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="mb-2 block font-medium text-ink dark:text-white">Email</span>
                      <input
                        type="email"
                        value={financeDocument.clientEmail}
                        onChange={(event) => setFinanceDocument((current) => ({ ...current, clientEmail: event.target.value }))}
                        className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                        placeholder="client@example.com"
                      />
                    </label>
                    <label className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="mb-2 block font-medium text-ink dark:text-white">Address</span>
                      <input
                        value={financeDocument.clientAddress}
                        onChange={(event) => setFinanceDocument((current) => ({ ...current, clientAddress: event.target.value }))}
                        className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                        placeholder="City, country"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#eadacc] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-ink dark:text-white">Line Items</h2>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-white dark:bg-gold dark:text-ink"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {lineItems.map((item) => (
                      <div key={item.id} className="grid gap-3 rounded-xl border border-[#eadacc] bg-[#fff6ef] p-3 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[1fr_90px_130px_42px]">
                        <input
                          value={item.description}
                          onChange={(event) => updateLineItem(item.id, "description", event.target.value)}
                          className="rounded-lg border border-[#eadacc] bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                          placeholder="Service or product"
                        />
                        <input
                          value={item.quantity}
                          onChange={(event) => updateLineItem(item.id, "quantity", event.target.value)}
                          className="rounded-lg border border-[#eadacc] bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                          inputMode="decimal"
                          placeholder="Qty"
                        />
                        <input
                          value={item.unitPrice}
                          onChange={(event) => updateLineItem(item.id, "unitPrice", event.target.value)}
                          className="rounded-lg border border-[#eadacc] bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                          inputMode="decimal"
                          placeholder="Unit price"
                        />
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 disabled:opacity-40 dark:border-rose-500/30 dark:bg-white/[0.06]"
                          disabled={lineItems.length === 1}
                          aria-label="Remove line item"
                          title="Remove line item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <label className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="mb-2 block font-medium text-ink dark:text-white">Tax Rate (%)</span>
                      <input
                        value={financeDocument.taxRate}
                        onChange={(event) => setFinanceDocument((current) => ({ ...current, taxRate: event.target.value }))}
                        className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                        inputMode="decimal"
                      />
                    </label>
                    <label className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="mb-2 block font-medium text-ink dark:text-white">Payment Method</span>
                      <input
                        value={financeDocument.paymentMethod}
                        onChange={(event) => setFinanceDocument((current) => ({ ...current, paymentMethod: event.target.value }))}
                        className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                        placeholder="M-Pesa, Bank, Cash"
                      />
                    </label>
                    <label className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="mb-2 block font-medium text-ink dark:text-white">Reference</span>
                      <input
                        value={financeDocument.paymentReference}
                        onChange={(event) => setFinanceDocument((current) => ({ ...current, paymentReference: event.target.value }))}
                        className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                        placeholder="Transaction ID"
                      />
                    </label>
                  </div>
                  <label className="mt-4 block text-sm text-slate-600 dark:text-slate-300">
                    <span className="mb-2 block font-medium text-ink dark:text-white">Notes</span>
                    <textarea
                      value={financeDocument.notes}
                      onChange={(event) => setFinanceDocument((current) => ({ ...current, notes: event.target.value }))}
                      className="w-full rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                      rows={3}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={printGeneratedDocument}
                    className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2f495c] dark:bg-gold dark:text-ink dark:hover:bg-[#e7b95f]"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={downloadGeneratedDocument}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>

                <div
                  id="finance-document-preview"
                  className="overflow-hidden border border-[#eadacc] bg-white text-slate-900 shadow-panel"
                >
                  {financeDocument.kind === "invoice" ? (
                    <div className="mx-auto min-h-[960px] max-w-[840px] bg-white px-10 py-10 font-sans">
                      <div className="flex items-start justify-between gap-8 border-b-4 border-[#d7a85b] pb-8">
                        <DocumentBrandBlock />
                        <div className="text-right">
                          <p className="text-4xl font-bold uppercase tracking-[0.08em] text-[#18364a]">Invoice</p>
                          <p className="mt-3 text-sm font-semibold text-slate-500">{financeDocument.number || "Draft invoice"}</p>
                          <div className="mt-5 rounded-lg bg-[#18364a] px-5 py-4 text-white">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Balance Due</p>
                            <p className="mt-2 text-2xl font-bold">{formatCurrency(grandTotal)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-8 py-9 md:grid-cols-[1fr_280px]">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b47b29]">Bill To</p>
                          <p className="mt-3 text-2xl font-bold text-[#18364a]">{financeDocument.clientName || "Client name"}</p>
                          <div className="mt-3 space-y-1 text-sm leading-6 text-slate-600">
                            <p>{financeDocument.clientPhone || "Phone number"}</p>
                            <p>{financeDocument.clientEmail || "Email address"}</p>
                            <p>{financeDocument.clientAddress || "Client address"}</p>
                          </div>
                        </div>
                        <div className="rounded-lg border border-[#eadacc] bg-[#fff6ef] p-5 text-sm">
                          <DocumentMeta label="Invoice No." value={financeDocument.number || "Draft"} />
                          <DocumentMeta label="Issue Date" value={financeDocument.issueDate ? formatDate(financeDocument.issueDate) : "-"} />
                          <DocumentMeta label="Due Date" value={financeDocument.dueDate ? formatDate(financeDocument.dueDate) : "-"} />
                        </div>
                      </div>

                      <DocumentItemsTable lineItems={lineItems} />

                      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_300px]">
                        <div className="rounded-lg border border-[#eadacc] bg-[#fbfaf7] p-5 text-sm leading-6 text-slate-600">
                          <p className="font-bold text-[#18364a]">Payment Details</p>
                          <p className="mt-3">Method: {financeDocument.paymentMethod || "-"}</p>
                          <p>Reference: {financeDocument.paymentReference || "-"}</p>
                          <p className="mt-4 whitespace-pre-line">{financeDocument.notes || "-"}</p>
                        </div>
                        <DocumentTotals subtotal={subtotal} taxAmount={taxAmount} grandTotal={grandTotal} totalLabel="Balance Due" />
                      </div>

                      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#eadacc] pt-5 text-xs text-slate-500">
                        <span>Generated by {currentUsername ?? "Barak Pathways CRM"}</span>
                        <span>Barak Pathways - Nairobi, Kenya</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mx-auto min-h-[960px] max-w-[840px] bg-white px-10 py-10 font-sans text-slate-700">
                      <div className="border-b-4 border-[#d7a85b] pb-7">
                        <div className="flex items-start justify-between gap-8">
                          <DocumentBrandBlock />
                          <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#b47b29]">Official Receipt</p>
                            <h2 className="mt-2 text-4xl font-bold text-[#18364a]">Payment Received</h2>
                            <div className="mt-5 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
                              Paid
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 grid gap-5 md:grid-cols-4">
                        <ReceiptInfoBox label="Receipt No." value={financeDocument.number || "Draft receipt"} />
                        <ReceiptInfoBox
                          label="Payment Date"
                          value={
                            financeDocument.dueDate
                              ? formatDate(financeDocument.dueDate)
                              : financeDocument.issueDate
                                ? formatDate(financeDocument.issueDate)
                                : "Not set"
                          }
                        />
                        <ReceiptInfoBox label="Payment Method" value={financeDocument.paymentMethod || "-"} />
                        <ReceiptInfoBox label="Reference" value={financeDocument.paymentReference || "-"} />
                      </div>

                      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_300px]">
                        <div className="rounded-lg border border-[#eadacc] bg-[#fbfaf7] p-6">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b47b29]">Received From</p>
                          <p className="mt-3 text-2xl font-bold text-[#18364a]">{financeDocument.clientName || "Client name"}</p>
                          <div className="mt-3 space-y-1 text-sm leading-6 text-slate-600">
                            <p>{financeDocument.clientPhone || "Phone number"}</p>
                            <p>{financeDocument.clientEmail || "Email address"}</p>
                            <p>{financeDocument.clientAddress || "Client address"}</p>
                          </div>
                        </div>
                        <div className="rounded-lg bg-[#18364a] p-6 text-white">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Amount Received</p>
                          <p className="mt-4 text-3xl font-bold">{formatCurrency(grandTotal)}</p>
                          {taxAmount > 0 ? <p className="mt-3 text-sm text-white/75">Includes tax of {formatCurrency(taxAmount)}</p> : null}
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="overflow-hidden rounded-lg border border-[#eadacc]">
                          <table className="min-w-full">
                            <thead className="bg-[#18364a] text-left text-xs uppercase tracking-[0.08em] text-white">
                              <tr>
                                <th className="px-5 py-3">Description</th>
                                <th className="px-5 py-3 text-right">Qty</th>
                                <th className="px-5 py-3 text-right">Unit Price</th>
                                <th className="px-5 py-3 text-right">Amount Paid</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lineItems.map((item) => {
                                const quantity = Number(item.quantity) || 0;
                                const unitPrice = Number(item.unitPrice) || 0;
                                const amount = quantity * unitPrice;
                                return (
                                  <tr key={item.id} className="border-t border-[#f0dfd0]">
                                    <td className="px-5 py-4 text-sm font-semibold text-[#18364a]">{item.description || "Service payment"}</td>
                                    <td className="px-5 py-4 text-right text-sm text-slate-600">{quantity || "-"}</td>
                                    <td className="px-5 py-4 text-right text-sm text-slate-600">{formatCurrency(unitPrice)}</td>
                                    <td className="px-5 py-4 text-right text-sm font-bold text-[#18364a]">{formatCurrency(amount || unitPrice)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_300px]">
                        <div className="rounded-lg border border-[#eadacc] p-5 text-sm leading-6 text-slate-600">
                          <p className="font-bold text-[#18364a]">Payment Confirmation</p>
                          <p className="mt-3">
                            This receipt confirms that Barak Pathways has received payment from{" "}
                            <span className="font-semibold text-slate-800">{financeDocument.clientName || "the client"}</span>.
                          </p>
                          <p className="mt-3 whitespace-pre-line">
                            {financeDocument.notes || "Payment received with thanks. Please keep this receipt for your records."}
                          </p>
                        </div>
                        <DocumentTotals subtotal={subtotal} taxAmount={taxAmount} grandTotal={grandTotal} totalLabel="Total Received" />
                      </div>

                      <div className="mt-12 grid gap-8 border-t border-[#eadacc] pt-8 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Authorized By</p>
                          <div className="mt-10 w-56 border-t border-slate-400 pt-3 text-sm font-semibold text-[#18364a]">
                            {currentUsername ?? "Barak Pathways CRM"}
                          </div>
                        </div>
                        <div className="text-sm leading-6 text-slate-500 md:text-right">
                          <p className="font-semibold text-[#18364a]">Thank you for your payment.</p>
                          <p>For questions about this receipt, contact Barak Pathways.</p>
                          <p className="mt-3">Nairobi, Kenya</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {canViewFullFinancialTools && activeTab === "reminders" ? (
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
    <div className="rounded-xl border border-[#eadacc] bg-white p-5 dark:border-white/10 dark:bg-white/[0.05]">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${accent}`}>{value}</p>
      {sub ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{sub}</p> : null}
    </div>
  );
}

function DocumentMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#eadacc] py-2 last:border-0">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="text-right text-slate-950">{value}</span>
    </div>
  );
}

function DocumentBrandBlock() {
  return (
    <div className="flex items-start gap-4">
      <Image
        src="/barak-pathways-logo.png"
        alt="Barak Pathways"
        width={64}
        height={64}
        className="h-16 w-16 rounded-lg border border-[#eadacc] bg-white object-contain p-1"
      />
      <div>
        <p className="text-xl font-bold text-[#18364a]">Barak Pathways</p>
        <p className="mt-1 text-sm font-medium text-[#b47b29]">Education & admissions support</p>
        <div className="mt-3 space-y-1 text-xs leading-5 text-slate-500">
          <p>Nairobi, Kenya</p>
          <p>+254 113 043 315</p>
          <p>barakpathways.com</p>
        </div>
      </div>
    </div>
  );
}

function ReceiptInfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#eadacc] bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-[#18364a]">{value}</p>
    </div>
  );
}

function DocumentItemsTable({ lineItems }: { lineItems: DocumentLineItem[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#eadacc]">
      <table className="min-w-full">
        <thead className="bg-[#18364a] text-left text-xs uppercase tracking-[0.08em] text-white">
          <tr>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">Unit Price</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item) => {
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unitPrice) || 0;
            return (
              <tr key={item.id} className="border-t border-[#f0dfd0]">
                <td className="px-4 py-4 text-sm font-semibold text-[#18364a]">{item.description || "Line item"}</td>
                <td className="px-4 py-4 text-right text-sm text-slate-600">{quantity || "-"}</td>
                <td className="px-4 py-4 text-right text-sm text-slate-600">{formatCurrency(unitPrice)}</td>
                <td className="px-4 py-4 text-right text-sm font-bold text-[#18364a]">{formatCurrency(quantity * unitPrice)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DocumentTotals({
  subtotal,
  taxAmount,
  grandTotal,
  totalLabel
}: {
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  totalLabel: string;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-[#eadacc] bg-white p-5">
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Subtotal</span>
        <span className="font-semibold">{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Tax</span>
        <span className="font-semibold">{formatCurrency(taxAmount)}</span>
      </div>
      <div className="border-t border-[#eadacc] pt-4">
        <div className="flex justify-between gap-4 text-lg font-bold text-[#18364a]">
          <span>{totalLabel}</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
      </div>
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
