import { PaymentRemindersManager } from "@/components/tables/payment-reminders-manager";
import { getStudents } from "@/lib/data";

function daysBetween(a: number, b: number) {
  return Math.floor((a - b) / (24 * 60 * 60 * 1000));
}

export default async function PaymentRemindersPage() {
  const students = await getStudents();
  const today = new Date();

  const overdueStudents = students
    .map((student) => {
      const balance = Math.max(
        0,
        40000 - (student.consultation_upfront_paid ?? 0) - (student.consultation_balance_paid ?? 0)
      );
      const daysSinceCreated = daysBetween(today.getTime(), new Date(student.created_at).getTime());
      const daysOverdue = student.payment_due_date
        ? daysBetween(today.getTime(), new Date(student.payment_due_date).getTime())
        : 0;

      return {
        ...student,
        balance,
        days_since_created: daysSinceCreated,
        days_overdue: daysOverdue
      };
    })
    .filter(
      (student) =>
        student.payment_status !== "full" &&
        student.payment_status !== "paid" &&
        student.balance > 0
    )
    .map((student) => {
      let reminder_category: "critical" | "warning" | "upcoming" | "current" = "current";

      if (student.days_overdue >= 7 || (!!student.payment_due_date && student.days_overdue > 0)) {
        reminder_category = "critical";
      } else if (student.days_since_created >= 30) {
        reminder_category = "warning";
      } else if (student.days_since_created >= 14) {
        reminder_category = "upcoming";
      }

      return {
        ...student,
        reminder_category
      };
    })
    .sort((a, b) => {
      const priority = { critical: 0, warning: 1, upcoming: 2, current: 3 };
      if (priority[a.reminder_category] !== priority[b.reminder_category]) {
        return priority[a.reminder_category] - priority[b.reminder_category];
      }
      return a.created_at.localeCompare(b.created_at);
    });

  const categories = [
    {
      key: "critical" as const,
      name: "Critical (7+ days overdue)",
      color: "#EF4444",
      icon: "🔴",
      students: overdueStudents.filter((student) => student.reminder_category === "critical")
    },
    {
      key: "warning" as const,
      name: "Warning (14-30 days no payment)",
      color: "#F59E0B",
      icon: "🟠",
      students: overdueStudents.filter((student) => student.reminder_category === "warning")
    },
    {
      key: "upcoming" as const,
      name: "Upcoming (0-14 days)",
      color: "#EAB308",
      icon: "🟡",
      students: overdueStudents.filter((student) => student.reminder_category === "upcoming")
    },
    {
      key: "current" as const,
      name: "Current (partial payment)",
      color: "#10B981",
      icon: "🟢",
      students: overdueStudents.filter((student) => student.reminder_category === "current")
    }
  ].filter((category) => category.students.length > 0);

  const totalOutstanding = overdueStudents.reduce((sum, student) => sum + student.balance, 0);
  const criticalCount = overdueStudents.filter((student) => student.reminder_category === "critical").length;
  const attentionCount = overdueStudents.filter((student) =>
    ["warning", "upcoming"].includes(student.reminder_category)
  ).length;

  return (
    <PaymentRemindersManager
      totalOutstanding={totalOutstanding}
      totalStudents={overdueStudents.length}
      criticalCount={criticalCount}
      attentionCount={attentionCount}
      categories={categories}
    />
  );
}
