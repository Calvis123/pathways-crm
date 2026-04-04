"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { stageLabels } from "@/lib/constants";
import type { AppRole, Student, StudentStage } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const stageChoices: StudentStage[] = [
  "lead",
  "inquiry",
  "consultation",
  "application",
  "visa",
  "enrolled",
  "placed",
  "employment",
  "lost"
];

function canManage(role: AppRole | null) {
  return role === "admin" || role === "consultant" || role === "employee";
}

export function StudentsTable({ students, role }: { students: Student[]; role: AppRole | null }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStage, setBulkStage] = useState<StudentStage>("consultation");
  const [bulkPayment, setBulkPayment] = useState<"full" | "partial" | "none">("partial");
  const [status, setStatus] = useState("");

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return students;

    return students.filter((student) =>
      [student.full_name, student.email, student.phone, student.country_interest, student.stage]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [query, students]);

  const allVisibleSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) => selectedIds.includes(student.id));
  const manager = canManage(role);

  function toggleStudent(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !filteredStudents.some((student) => student.id === id))
      );
      return;
    }

    setSelectedIds(
      Array.from(new Set([...selectedIds, ...filteredStudents.map((student) => student.id)]))
    );
  }

  async function runBulkAction(action: "update_stage" | "update_payment" | "delete" | "export") {
    if (selectedIds.length === 0) {
      setStatus("Select at least one student first.");
      return;
    }

    if (
      action === "delete" &&
      !window.confirm(`Delete ${selectedIds.length} selected students? This cannot be undone.`)
    ) {
      return;
    }

    setStatus("Processing...");
    const payload =
      action === "update_stage"
        ? { action, studentIds: selectedIds, stage: bulkStage }
        : action === "update_payment"
          ? { action, studentIds: selectedIds, paymentMode: bulkPayment }
          : { action, studentIds: selectedIds };

    const response = await fetch("/api/students/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (action === "export" && response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "students-export.csv";
      link.click();
      window.URL.revokeObjectURL(url);
      setStatus("CSV exported.");
      return;
    }

    const body = (await response.json()) as { error?: string; count?: number };
    if (!response.ok) {
      setStatus(body.error ?? "Bulk action failed.");
      return;
    }

    setStatus(`${body.count ?? selectedIds.length} students updated.`);
    setSelectedIds([]);
    router.refresh();
  }

  return (
    <Card className="dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94))]">
      <CardHeader
        title="Students & Leads"
        description="Role-aware CRM view with bulk stage, payment, export, and delete operations."
      />
      <div className="px-4 pb-2">
        <Link
          href="/students/new"
          className="inline-flex items-center justify-center rounded-2xl bg-ink px-4 py-2.5 text-sm font-semibold text-white dark:bg-[#ff7a59] dark:hover:bg-[#ef6b49]"
        >
          Add Student
        </Link>
      </div>
      <div className="mb-4 grid gap-3 px-4 md:grid-cols-[1.2fr_0.8fr]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, phone, country, or stage"
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-gold/30 focus:ring-2 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-slate-400"
        />

        {manager ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkStage}
              onChange={(event) => setBulkStage(event.target.value as StudentStage)}
              className="rounded-2xl border border-slate-200 px-3 py-3 text-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              {stageChoices.map((stage) => (
                <option key={stage} value={stage}>
                  Move to {stageLabels[stage]}
                </option>
              ))}
            </select>
            <Button type="button" onClick={() => runBulkAction("update_stage")}>
              Update Stage
            </Button>
          </div>
        ) : null}
      </div>

      {manager ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 px-4">
          <select
            value={bulkPayment}
            onChange={(event) =>
              setBulkPayment(event.target.value as "full" | "partial" | "none")
            }
            className="rounded-2xl border border-slate-200 px-3 py-3 text-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            <option value="partial">Partial Payment</option>
            <option value="full">Full Payment</option>
            <option value="none">No Payment</option>
          </select>
          <Button type="button" variant="secondary" onClick={() => runBulkAction("update_payment")}>
            Update Payment
          </Button>
          <Button type="button" variant="secondary" onClick={() => runBulkAction("export")}>
            Export CSV
          </Button>
          {role === "admin" ? (
            <Button
              type="button"
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => runBulkAction("delete")}
            >
              Delete
            </Button>
          ) : null}
          {status ? <p className="text-sm text-slate-500 dark:text-slate-300">{status}</p> : null}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-slate-500 dark:border-white/10 dark:text-slate-400">
            <tr>
              {manager ? (
                <th className="px-4 py-3 font-medium">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
                </th>
              ) : null}
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium">Consultation</th>
              <th className="px-4 py-3 font-medium">Paid</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr
                key={student.id}
                className="border-b border-slate-50 transition hover:bg-slate-50/80 dark:border-white/10 dark:hover:bg-white/[0.04]"
              >
                {manager ? (
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                    />
                  </td>
                ) : null}
                <td className="px-4 py-4">
                  <div>
                    <Link href={`/students/${student.id}`} className="font-medium text-ink underline-offset-4 hover:underline dark:text-white">
                      {student.full_name}
                    </Link>
                    <p className="text-slate-500 dark:text-slate-300">{student.email}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {student.phone ?? "No phone"} | {student.lead_source ?? "Unknown source"}
                    </p>
                    <div className="mt-2 flex gap-3 text-xs">
                      <Link href={`/students/${student.id}/timeline`} className="text-slate-500 underline dark:text-slate-300">
                        Timeline
                      </Link>
                      <Link href={`/students/${student.id}/notes`} className="text-slate-500 underline dark:text-slate-300">
                        Notes
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge className="bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-200">{stageLabels[student.stage]}</Badge>
                </td>
                <td className="px-4 py-4 dark:text-slate-200">{student.country_interest ?? "N/A"}</td>
                <td className="px-4 py-4">
                  <span className="dark:text-slate-200">
                    {student.consultation_status ?? (student.consultation_requested ? "Requested" : "No")}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="dark:text-slate-200">
                    {formatCurrency(student.consultation_upfront_paid + student.consultation_balance_paid)}
                  </span>
                </td>
                <td className="px-4 py-4 dark:text-slate-300">{formatDate(student.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
