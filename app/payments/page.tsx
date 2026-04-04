import { PaymentsManager } from "@/components/tables/payments-manager";
import { getPayments, getStudents } from "@/lib/data";

export default async function PaymentsPage() {
  const [payments, students] = await Promise.all([getPayments(), getStudents()]);
  return <PaymentsManager payments={payments} students={students} />;
}
