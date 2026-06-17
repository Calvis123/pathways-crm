import { FinancialReportsManager } from "@/components/tables/financial-reports-manager";
import { getExpenses, getPayments, getStudents } from "@/lib/data";
import { CONSULTATION_FEE, getConsultationBalance, getConsultationPaid } from "@/lib/finance";

type ReportType = "overview" | "cashflow" | "credit" | "expenses";
const validReportTypes = new Set<ReportType>(["overview", "cashflow", "credit", "expenses"]);

function dateOnly(value: string | null | undefined) {
  if (!value) return null;
  return value.slice(0, 10);
}

function humanizeCategory(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function previousRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
  const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  return {
    start: prevStart.toISOString().slice(0, 10),
    end: prevEnd.toISOString().slice(0, 10)
  };
}

export default async function FinancialReportsPage({
  searchParams
}: {
  searchParams: Promise<{
    report?: string;
    start_date?: string;
    end_date?: string;
  }>;
}) {
  const params = await searchParams;
  const reportType = validReportTypes.has(params.report as ReportType)
    ? (params.report as ReportType)
    : "overview";
  const startDate =
    params.start_date ??
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const endDate =
    params.end_date ??
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);

  const prevRange = previousRange(startDate, endDate);
  const comparisonStart = prevRange.start;
  const comparisonEnd = endDate;

  const [payments, expenses, students] = await Promise.all([
    getPayments({ startDate: comparisonStart, endDate: comparisonEnd }),
    getExpenses({ startDate: comparisonStart, endDate: comparisonEnd }),
    getStudents()
  ]);

  const paymentsByMethodMap = new Map<string, number>();
  const monthlyRevenueMap = new Map<string, number>();

  const expensesByCategoryMap = new Map<string, number>();

  let totalRevenue = 0;
  let totalExpenses = 0;
  let prevRevenue = 0;
  let prevExpenseValue = 0;

  for (const payment of payments) {
    const paymentDate = dateOnly(payment.paid_at) ?? dateOnly(payment.created_at);
    if (!paymentDate) continue;

    if (paymentDate >= startDate && paymentDate <= endDate) {
      totalRevenue += payment.amount;
      paymentsByMethodMap.set(
        payment.payment_method,
        (paymentsByMethodMap.get(payment.payment_method) ?? 0) + payment.amount
      );

      const dateLabel = new Intl.DateTimeFormat("en-KE", {
        month: "short",
        year: "numeric"
      }).format(new Date(payment.paid_at ?? payment.created_at));
      monthlyRevenueMap.set(dateLabel, (monthlyRevenueMap.get(dateLabel) ?? 0) + payment.amount);
    }

    if (paymentDate >= prevRange.start && paymentDate <= prevRange.end) {
      prevRevenue += payment.amount;
    }
  }

  for (const expense of expenses) {
    if (expense.expense_date >= startDate && expense.expense_date <= endDate) {
      totalExpenses += expense.amount;
      expensesByCategoryMap.set(
        expense.category,
        (expensesByCategoryMap.get(expense.category) ?? 0) + expense.amount
      );
    }

    if (expense.expense_date >= prevRange.start && expense.expense_date <= prevRange.end) {
      prevExpenseValue += expense.amount;
    }
  }

  const paymentsByMethod = Array.from(paymentsByMethodMap.entries())
    .map(([method, amount]) => ({
      method: humanizeCategory(method),
      amount,
      percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const expensesByCategory = Array.from(expensesByCategoryMap.entries())
    .map(([category, amount]) => ({
      category: humanizeCategory(category),
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => new Date(`1 ${a.label}`).getTime() - new Date(`1 ${b.label}`).getTime());

  const balances = students
    .map((student) => {
      const paid = getConsultationPaid(student);
      const balance = getConsultationBalance(student);
      const daysOverdue =
        student.payment_due_date && new Date(`${student.payment_due_date}T00:00:00`).getTime() < Date.now()
          ? Math.floor(
              (Date.now() - new Date(`${student.payment_due_date}T00:00:00`).getTime()) /
                (24 * 60 * 60 * 1000)
            )
          : 0;

      return {
        name: student.full_name,
        phone: student.phone,
        payment_due_date: student.payment_due_date ?? null,
        paid,
        balance,
        days_overdue: daysOverdue
      };
    })
    .filter((student) => student.balance > 0);

  const creditExposure = balances.reduce((sum, student) => sum + student.balance, 0);
  const totalBilled = balances.length * CONSULTATION_FEE;
  const totalPaid = balances.reduce((sum, student) => sum + student.paid, 0);
  const overdueStudents = balances
    .filter((student) => student.days_overdue > 0 && student.payment_due_date)
    .map((student) => ({
      name: student.name,
      phone: student.phone,
      balance: student.balance,
      days_overdue: student.days_overdue,
      due_date: student.payment_due_date as string
    }))
    .sort((a, b) => b.days_overdue - a.days_overdue);
  const overdueAmount = overdueStudents.reduce((sum, student) => sum + student.balance, 0);

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

  let cashFlowHealth: "good" | "fair" | "warning" | "critical" = "good";
  if (profitMargin < 0) cashFlowHealth = "critical";
  else if (profitMargin < 2) cashFlowHealth = "warning";
  else if (profitMargin < 5) cashFlowHealth = "fair";

  const alerts: Array<{ tone: "critical" | "warning" | "info"; title: string; body: string }> = [];

  if (profitMargin < 2) {
    alerts.push({
      tone: "critical",
      title: "Critical: Low Profit Margin",
      body: `Current profit margin is ${profitMargin.toFixed(1)}%. Target is 5%+. ${
        overdueAmount > 0 ? `Overdue payments: KES ${overdueAmount.toLocaleString("en-KE")}.` : ""
      }`
    });
  } else if (profitMargin < 5) {
    alerts.push({
      tone: "warning",
      title: "Warning: Profit Margin Below Target",
      body: `Current profit margin is ${profitMargin.toFixed(1)}%. Target is 5%+.`
    });
  }

  if (overdueAmount > 50000) {
    alerts.push({
      tone: "warning",
      title: "High Overdue Amount",
      body: `KES ${overdueAmount.toLocaleString("en-KE")} is overdue from ${overdueStudents.length} student(s).`
    });
  }

  const profitabilityScore =
    profitMargin >= 5 ? 40 : profitMargin >= 3 ? 30 : profitMargin >= 1 ? 20 : profitMargin >= 0 ? 10 : 0;
  const liquidityRatio = totalRevenue > 0 && totalExpenses > 0 ? (totalRevenue - creditExposure) / totalExpenses : 0;
  const liquidityScore =
    liquidityRatio >= 3 ? 30 : liquidityRatio >= 2 ? 25 : liquidityRatio >= 1 ? 20 : liquidityRatio >= 0.5 ? 10 : 0;
  const collectionRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
  const collectionsScore =
    collectionRate >= 80 ? 20 : collectionRate >= 60 ? 15 : collectionRate >= 40 ? 10 : 5;
  const efficiencyScore = expenseRatio <= 85 ? 10 : expenseRatio <= 95 ? 7 : 4;
  const healthScore = profitabilityScore + liquidityScore + collectionsScore + efficiencyScore;

  let healthRating = "Poor";
  let colorClass = "border-rose-500 text-rose-600";
  let barColor = "bg-rose-500";
  if (healthScore >= 80) {
    healthRating = "Excellent";
    colorClass = "border-emerald-500 text-emerald-600";
    barColor = "bg-emerald-500";
  } else if (healthScore >= 60) {
    healthRating = "Good";
    colorClass = "border-sky-500 text-sky-600";
    barColor = "bg-sky-500";
  } else if (healthScore >= 40) {
    healthRating = "Fair";
    colorClass = "border-amber-500 text-amber-600";
    barColor = "bg-amber-500";
  }

  return (
    <FinancialReportsManager
      reportType={reportType}
      startDate={startDate}
      endDate={endDate}
      alerts={alerts}
      metrics={{
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        expenseRatio,
        creditExposure,
        cashFlowHealth,
        periodLabel: `From ${formatDate(startDate)} to ${formatDate(endDate)}`
      }}
      monthlyRevenue={monthlyRevenue}
      paymentsByMethod={paymentsByMethod}
      expensesByCategory={expensesByCategory}
      credit={{
        totalBilled,
        totalPaid,
        outstanding: creditExposure,
        overdueAmount,
        overdueStudents
      }}
      health={{
        score: healthScore,
        rating: healthRating,
        colorClass,
        barColor,
        breakdown: [
          { label: "Profitability", score: profitabilityScore, max: 40 },
          { label: "Liquidity", score: liquidityScore, max: 30 },
          { label: "Collections", score: collectionsScore, max: 20 },
          { label: "Efficiency", score: efficiencyScore, max: 10 }
        ]
      }}
    />
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${value}T00:00:00`)
  );
}
