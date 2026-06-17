import { CommissionsTable } from "@/components/tables/commissions-table";
import { getStudents } from "@/lib/data";

type StatusFilter = "all" | "pending" | "paid" | "overdue";
type SortKey = "days_waiting" | "amount" | "name" | "due_date";
const validStatusFilters = new Set<StatusFilter>(["all", "pending", "paid", "overdue"]);
const validSortKeys = new Set<SortKey>(["days_waiting", "amount", "name", "due_date"]);

export default async function CommissionsPage({
  searchParams
}: {
  searchParams: Promise<{
    status?: string;
    institution?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const statusFilter = validStatusFilters.has(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : "all";
  const institutionFilter = params.institution === "all" ? "" : params.institution ?? "";
  const sortBy = validSortKeys.has(params.sort as SortKey)
    ? (params.sort as SortKey)
    : "days_waiting";

  const students = await getStudents();
  const now = Date.now();

  const rows = students
    .filter((student) => student.stage === "enrolled" && Boolean(student.enrollment_date))
    .map((student) => {
      const enrollmentDate = student.enrollment_date ?? student.updated_at.slice(0, 10);
      const daysWaiting = Math.max(
        0,
        Math.floor((now - new Date(`${enrollmentDate}T00:00:00`).getTime()) / (24 * 60 * 60 * 1000))
      );
      const commissionAmount = student.commission_amount ?? 140000;
      const commissionStatus = student.commission_status ?? "pending";

      return {
        id: student.id,
        full_name: student.full_name,
        commission_institution: student.commission_institution ?? student.university_name,
        enrollment_date: enrollmentDate,
        days_waiting: daysWaiting,
        commission_due_date: student.commission_due_date ?? null,
        commission_amount: commissionAmount,
        commission_status: commissionStatus,
        commission_paid_date: student.commission_paid_date ?? null,
        phone: student.phone,
        university_name: student.university_name
      };
    })
    .filter((row) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "overdue") {
        return (
          row.commission_status === "overdue" ||
          (row.commission_status !== "paid" &&
            Boolean(row.commission_due_date && new Date(`${row.commission_due_date}T00:00:00`).getTime() < now))
        );
      }
      return row.commission_status === statusFilter;
    })
    .filter((row) =>
      institutionFilter ? (row.commission_institution ?? "") === institutionFilter : true
    )
    .sort((a, b) => {
      if (sortBy === "amount") return b.commission_amount - a.commission_amount;
      if (sortBy === "name") return a.full_name.localeCompare(b.full_name);
      if (sortBy === "due_date") return (a.commission_due_date ?? "9999-12-31").localeCompare(b.commission_due_date ?? "9999-12-31");
      return b.days_waiting - a.days_waiting;
    });

  return (
    <CommissionsTable
      rows={rows}
      statusFilter={statusFilter}
      institutionFilter={institutionFilter}
      sortBy={sortBy}
    />
  );
}
