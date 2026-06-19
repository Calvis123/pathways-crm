import { FinancialToolsManager } from "@/components/tables/financial-tools-manager";
import { getExpenses, getPayments, getStudents } from "@/lib/data";
import { canAccessFinance, getCurrentSession } from "@/lib/auth";
import { getConsultationBalance, getConsultationPaid } from "@/lib/finance";
import type { ExpenseCategory } from "@/lib/types";

function dateOnly(value: string | null | undefined) {
  if (!value) return null;
  return value.slice(0, 10);
}

function eachDay(startDate: string, endDate: string) {
  const days: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export default async function FinancialToolsPage({
  searchParams
}: {
  searchParams: Promise<{ start_date?: string; end_date?: string }>;
}) {
  const params = await searchParams;
  const startDate = params.start_date ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const endDate = params.end_date ?? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);
  const session = await getCurrentSession();
  const canViewFullFinancialTools = canAccessFinance(session?.role);

  if (!canViewFullFinancialTools) {
    return (
      <FinancialToolsManager
        startDate={startDate}
        endDate={endDate}
        metrics={{
          totalCreditExposure: 0,
          totalOverdue: 0,
          collectionRate: 0,
          netProfit: 0,
          profitMargin: 0,
          totalIncome: 0,
          totalExpenses: 0,
          currentReceivables: 0
        }}
        cashFlow={[]}
        creditRecords={[]}
        expenses={[]}
        expensesByCategory={[]}
        currentUsername={session?.username ?? null}
        currentRole={session?.role ?? null}
        reminderItems={[]}
      />
    );
  }

  const [students, payments, expenses] = await Promise.all([
    getStudents(),
    getPayments(),
    getExpenses()
  ]);

  const creditRecords = students
    .map((student) => {
      const amountOwed = getConsultationBalance(student);

      const daysOverdue = student.payment_due_date
        ? Math.floor(
            (Date.now() - new Date(`${student.payment_due_date}T00:00:00`).getTime()) /
              (24 * 60 * 60 * 1000)
          )
        : null;

      return {
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        phone: student.phone,
        amount_owed: amountOwed,
        payment_due_date: student.payment_due_date ?? null,
        days_overdue: daysOverdue && daysOverdue > 0 ? daysOverdue : null
      };
    })
    .filter((student) => student.amount_owed > 0)
    .sort((a, b) => (a.payment_due_date ?? "9999-12-31").localeCompare(b.payment_due_date ?? "9999-12-31"));

  const totalCreditExposure = creditRecords.reduce((sum, student) => sum + student.amount_owed, 0);
  const totalOverdue = creditRecords
    .filter((student) => (student.days_overdue ?? 0) > 0)
    .reduce((sum, student) => sum + student.amount_owed, 0);

  const totalStudents = students.length;
  const totalPaidStudents = students.filter((student) => ["full", "paid"].includes(student.payment_status ?? "")).length;
  const totalPartialStudents = students.filter((student) =>
    ["partial", "installment", "pending"].includes(student.payment_status ?? "") &&
    getConsultationPaid(student) > 0
  ).length;
  const collectionRate = totalStudents > 0 ? ((totalPaidStudents + totalPartialStudents) / totalStudents) * 100 : 0;

  const rangedExpenses = expenses.filter(
    (expense) => expense.expense_date >= startDate && expense.expense_date <= endDate
  );
  const rangedPayments = payments.filter((payment) => {
    const paymentDate = dateOnly(payment.paid_at) ?? dateOnly(payment.created_at);
    return paymentDate !== null && paymentDate >= startDate && paymentDate <= endDate;
  });

  const cashFlowMap = new Map(
    eachDay(startDate, endDate).map((date) => [date, { date, in: 0, out: 0, net: 0 }])
  );

  for (const payment of rangedPayments) {
    const paymentDate = dateOnly(payment.paid_at) ?? dateOnly(payment.created_at);
    if (!paymentDate) continue;
    const row = cashFlowMap.get(paymentDate);
    if (row) row.in += payment.amount;
  }

  for (const expense of rangedExpenses) {
    const row = cashFlowMap.get(expense.expense_date);
    if (row) row.out += expense.amount;
  }

  const cashFlow = Array.from(cashFlowMap.values()).map((item) => ({
    ...item,
    net: item.in - item.out
  }));

  const totalIncome = cashFlow.reduce((sum, item) => sum + item.in, 0);
  const totalExpenses = cashFlow.reduce((sum, item) => sum + item.out, 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const expensesByCategory = Array.from(
    rangedExpenses.reduce((map, expense) => {
      map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amount);
      return map;
    }, new Map<ExpenseCategory, number>())
  )
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);
  const next7DaysString = next7Days.toISOString().slice(0, 10);

  const reminderItems = students
    .map((student) => ({
      id: student.id,
      full_name: student.full_name,
      payment_due_date: student.payment_due_date ?? "",
      amount_owed: getConsultationBalance(student)
    }))
    .filter(
      (student) =>
        student.amount_owed > 0 &&
        student.payment_due_date !== "" &&
        student.payment_due_date <= next7DaysString
    )
    .map((student) => ({
      ...student,
      is_overdue: student.payment_due_date < new Date().toISOString().slice(0, 10)
    }))
    .sort((a, b) => a.payment_due_date.localeCompare(b.payment_due_date));

  return (
    <FinancialToolsManager
      startDate={startDate}
      endDate={endDate}
      metrics={{
        totalCreditExposure,
        totalOverdue,
        collectionRate,
        netProfit,
        profitMargin,
        totalIncome,
        totalExpenses,
        currentReceivables: totalCreditExposure - totalOverdue
      }}
      cashFlow={cashFlow}
      creditRecords={creditRecords}
      expenses={rangedExpenses}
      expensesByCategory={expensesByCategory}
      currentUsername={session?.username ?? null}
      currentRole={session?.role ?? null}
      reminderItems={reminderItems}
    />
  );
}
