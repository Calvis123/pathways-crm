import { PaymentTrackerManager } from "@/components/tables/payment-tracker-manager";
import { getStudents } from "@/lib/data";

type StatusFilter = "all" | "pending" | "partial" | "paid";

export default async function PaymentTrackerPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; university?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = (params.status as StatusFilter | undefined) ?? "all";
  const universityFilter = (params.university ?? "").trim().toLowerCase();

  const students = await getStudents();
  const visaApprovedStudents = students
    .filter((student) => student.stage === "visa")
    .map((student) => {
      const paymentAmount = student.payment_amount ?? 20000;
      const paymentPaid = student.payment_paid ?? 0;
      const paymentDate = student.payment_date ?? null;
      const status =
        student.payment_status === "full"
          ? "paid"
          : (student.payment_status as string | null) ?? (paymentPaid > 0 ? "partial" : "pending");
      const balanceDue = Math.max(0, paymentAmount - paymentPaid);
      const anchorDate = paymentDate ?? student.updated_at ?? student.created_at;
      const daysSinceApproval = Math.max(
        0,
        Math.floor((Date.now() - new Date(anchorDate).getTime()) / (24 * 60 * 60 * 1000))
      );

      return {
        id: student.id,
        full_name: student.full_name,
        phone: student.phone,
        email: student.email,
        university_name: student.university_name,
        payment_amount: paymentAmount,
        payment_paid: paymentPaid,
        balance_due: balanceDue,
        days_since_approval: daysSinceApproval,
        payment_status: status,
        payment_date: paymentDate
      };
    })
    .filter((student) => statusFilter === "all" || student.payment_status === statusFilter)
    .filter((student) =>
      universityFilter ? (student.university_name ?? "").toLowerCase().includes(universityFilter) : true
    )
    .sort((a, b) => {
      const urgency = (student: (typeof visaApprovedStudents)[number]) =>
        student.payment_status === "paid" ? 0 : student.days_since_approval >= 15 ? 3 : student.days_since_approval >= 7 ? 2 : 1;
      if (urgency(b) !== urgency(a)) return urgency(b) - urgency(a);
      return b.days_since_approval - a.days_since_approval;
    });

  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const totalOutstanding = visaApprovedStudents.reduce((sum, student) => sum + student.balance_due, 0);
  const collectedThisMonth = visaApprovedStudents.reduce((sum, student) => {
    if (student.payment_status !== "paid") return sum;
    if (!student.payment_date) return sum;
    return new Date(`${student.payment_date}T00:00:00`).getTime() >= firstDayOfMonth.getTime()
      ? sum + student.payment_paid
      : sum;
  }, 0);
  const overdueCount = visaApprovedStudents.filter((student) => student.days_since_approval >= 15).length;
  const totalCollected = visaApprovedStudents
    .filter((student) => student.payment_status === "paid")
    .reduce((sum, student) => sum + student.payment_paid, 0);
  const collectionRate =
    visaApprovedStudents.length > 0
      ? ((totalCollected / Math.max(1, totalCollected + totalOutstanding)) * 100)
      : 0;

  return (
    <PaymentTrackerManager
      statusFilter={statusFilter}
      universityFilter={params.university ?? ""}
      stats={{
        totalOutstanding,
        collectedThisMonth,
        overdueCount,
        collectionRate
      }}
      students={visaApprovedStudents}
    />
  );
}
