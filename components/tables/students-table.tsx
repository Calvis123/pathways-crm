"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, ChevronLeft, ChevronRight, Download, Mail, Search, Trash2, UserPlus, Users2 } from "lucide-react";
import { stageLabels, stageOrder } from "@/lib/constants";
import { readJsonBody } from "@/lib/http";
import type { AppRole, Student, StudentStage } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stageChoices: StudentStage[] = [...stageOrder];
type StudentSort = "registered_desc" | "registered_asc" | "source_asc" | "updated_desc";

const STUDENTS_PER_PAGE = 10;

function canManage(role: AppRole | null) {
  return role === "admin" || role === "consultant" || role === "employee";
}

export function StudentsTable({ students, role }: { students: Student[]; role: AppRole | null }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StudentStage | "all">("all");
  const [sortMode, setSortMode] = useState<StudentSort>("registered_desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStage, setBulkStage] = useState<StudentStage>("consultation");
  const [bulkPayment, setBulkPayment] = useState<"full" | "partial" | "none">("partial");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase();

    return students
      .filter((student) => {
        const stageMatch = stageFilter === "all" || student.stage === stageFilter;
        const textMatch =
          !term ||
          [
            student.full_name,
            student.email,
            student.phone,
            student.country_interest,
            student.stage,
            student.lead_source,
            formatDate(student.created_at)
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(term));

        return stageMatch && textMatch;
      })
      .sort((a, b) => {
        if (sortMode === "registered_asc") return a.created_at.localeCompare(b.created_at);
        if (sortMode === "source_asc") {
          const sourceComparison = (a.lead_source ?? "").localeCompare(b.lead_source ?? "");
          return sourceComparison || b.created_at.localeCompare(a.created_at);
        }
        if (sortMode === "updated_desc") return b.updated_at.localeCompare(a.updated_at);
        return b.created_at.localeCompare(a.created_at);
      });
  }, [query, sortMode, stageFilter, students]);

  useEffect(() => {
    setPage(0);
  }, [query, sortMode, stageFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageStart = safePage * STUDENTS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(pageStart, pageStart + STUDENTS_PER_PAGE);

  const summary = useMemo(() => {
    const placed = students.filter((student) => ["placed", "employment"].includes(student.stage)).length;
    const consultation = students.filter((student) => student.stage === "consultation").length;
    const paid = students.reduce(
      (sum, student) => sum + student.consultation_upfront_paid + student.consultation_balance_paid,
      0
    );
    const countries = new Set(students.map((student) => student.country_interest).filter(Boolean));

    return { placed, consultation, paid, countries: countries.size };
  }, [students]);

  const stageCounts = useMemo(
    () =>
      stageChoices.map((stage) => ({
        stage,
        count: students.filter((student) => student.stage === stage).length
      })),
    [students]
  );

  const allVisibleSelected =
    paginatedStudents.length > 0 && paginatedStudents.every((student) => selectedIds.includes(student.id));
  const manager = canManage(role);

  function toggleStudent(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !paginatedStudents.some((student) => student.id === id)));
      return;
    }

    setSelectedIds(Array.from(new Set([...selectedIds, ...paginatedStudents.map((student) => student.id)])));
  }

  async function runBulkAction(action: "update_stage" | "update_payment" | "delete" | "export") {
    if (selectedIds.length === 0) {
      setStatus("Select at least one student first.");
      return;
    }

    if (action === "delete" && !window.confirm(`Delete ${selectedIds.length} selected students? This cannot be undone.`)) {
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

    const body = await readJsonBody<{ error?: string; count?: number }>(response);
    if (!response.ok) {
      setStatus(body?.error ?? "Bulk action failed.");
      return;
    }

    setStatus(`${body?.count ?? selectedIds.length} students updated.`);
    setSelectedIds([]);
    router.refresh();
  }

  function openBroadcastComposer() {
    if (selectedIds.length === 0) {
      setStatus("Select at least one student first.");
      return;
    }
    const params = new URLSearchParams();
    params.set("students", selectedIds.join(","));
    router.push(`/email-center?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-[#eadacc] bg-white shadow-[0_18px_50px_rgba(120,75,42,0.1)] dark:border-white/10 dark:bg-[#182638]">
        <div className="flex flex-col gap-5 bg-[linear-gradient(135deg,#fffaf5_0%,#fff1e6_58%,#ffe0c8_100%)] px-5 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-[#eadacc] bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase text-[#8b5e3c] shadow-sm">
              <Users2 className="h-3.5 w-3.5 text-[#c9692c]" />
              Student CRM
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-[#213343] lg:text-4xl">Students & Leads</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7182]">
              Search, qualify, segment, and move student journeys from first inquiry to placement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/students/new"
              className="inline-flex items-center justify-center rounded-lg bg-[#213343] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2f495c] dark:bg-[#ff7a59] dark:hover:bg-[#ef6b49]"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Link>
            <Button type="button" variant="secondary" onClick={() => runBulkAction("export")}>
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </Button>
          </div>
        </div>

        <div className="grid gap-3 bg-[#fff6ef] p-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Records", value: students.length, detail: `${filteredStudents.length} visible` },
            { label: "In Consultation", value: summary.consultation, detail: "Active follow-up" },
            { label: "Placed / Employment", value: summary.placed, detail: "Successful outcomes" },
            { label: "Collected", value: formatCurrency(summary.paid), detail: `${summary.countries} destination markets` }
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-[#eadacc] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-[#213343] dark:text-white">{item.value}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#eadacc] bg-white p-4 shadow-[0_14px_42px_rgba(120,75,42,0.08)] dark:border-white/10 dark:bg-[#182638]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, phone, country, source, or stage"
              className="h-11 w-full rounded-lg border border-[#eadacc] bg-white px-10 text-sm shadow-sm outline-none transition focus:border-[#ff9a77] focus:ring-4 focus:ring-[#ff7a59]/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-slate-400"
            />
          </div>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as StudentSort)}
            className="h-11 rounded-lg border border-[#eadacc] bg-white px-3 text-sm font-semibold text-[#213343] shadow-sm outline-none transition focus:border-[#ff9a77] focus:ring-4 focus:ring-[#ff7a59]/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            aria-label="Sort student records"
          >
            <option value="registered_desc">Newest registered</option>
            <option value="registered_asc">Oldest registered</option>
            <option value="source_asc">Registration source</option>
            <option value="updated_desc">Recently updated</option>
          </select>
          {selectedIds.length > 0 ? (
            <Badge className="bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/30">
              {selectedIds.length} selected
            </Badge>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setStageFilter("all")}
            className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              stageFilter === "all"
                ? "border-[#213343] bg-[#213343] text-white"
                : "border-[#eadacc] bg-[#fffaf5] text-[#5f7182] hover:bg-[#fff1e6]"
            }`}
          >
            All {students.length}
          </button>
          {stageCounts.map(({ stage, count }) => (
            <button
              key={stage}
              type="button"
              onClick={() => setStageFilter(stage)}
              className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                stageFilter === stage
                  ? "border-[#213343] bg-[#213343] text-white"
                  : "border-[#eadacc] bg-[#fffaf5] text-[#5f7182] hover:bg-[#fff1e6]"
              }`}
            >
              {stageLabels[stage]} {count}
            </button>
          ))}
        </div>

        {manager ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-[#eadacc] bg-[#fffaf5] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
            <button type="button" onClick={toggleSelectAll} className="rounded-lg border border-[#eadacc] bg-white px-3 py-2 text-sm font-semibold text-[#213343]">
              {allVisibleSelected ? "Clear page" : "Select page"}
            </button>
            <select value={bulkStage} onChange={(event) => setBulkStage(event.target.value as StudentStage)} className="rounded-lg border border-[#eadacc] bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white">
              {stageChoices.map((stage) => <option key={stage} value={stage}>Move to {stageLabels[stage]}</option>)}
            </select>
            <Button type="button" onClick={() => runBulkAction("update_stage")}>Update Stage</Button>
            <select value={bulkPayment} onChange={(event) => setBulkPayment(event.target.value as "full" | "partial" | "none")} className="rounded-lg border border-[#eadacc] bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white">
              <option value="partial">Partial Payment</option>
              <option value="full">Full Payment</option>
              <option value="none">No Payment</option>
            </select>
            <Button type="button" variant="secondary" onClick={() => runBulkAction("update_payment")}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Update Payment
            </Button>
            <Button type="button" variant="secondary" onClick={openBroadcastComposer}>
              <Mail className="mr-2 h-4 w-4" />
              Broadcast
            </Button>
            {role === "admin" ? (
              <Button type="button" className="bg-rose-600 text-white hover:bg-rose-700" onClick={() => runBulkAction("delete")}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            ) : null}
            {status ? <p className="ml-auto text-sm font-medium text-slate-600 dark:text-slate-300">{status}</p> : null}
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-xl border border-[#eadacc] bg-white shadow-[0_14px_42px_rgba(120,75,42,0.08)] dark:border-white/10 dark:bg-[#182638]">
        <div className="flex flex-col gap-3 border-b border-[#eadacc] bg-[#fff6ef] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#8b5e3c]">Student Records</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Showing {filteredStudents.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + STUDENTS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={safePage === 0}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#eadacc] bg-white text-[#213343] shadow-sm transition hover:border-[#ff9a77] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
              aria-label="Previous students page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="rounded-lg border border-[#eadacc] bg-white px-3 py-2 text-sm font-semibold text-[#213343] shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white">
              {safePage + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
              disabled={safePage >= totalPages - 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#eadacc] bg-white text-[#213343] shadow-sm transition hover:border-[#ff9a77] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
              aria-label="Next students page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="hidden grid-cols-[44px_minmax(250px,1.35fr)_140px_140px_130px_150px_130px] gap-4 border-b border-[#eadacc] bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#8b5e3c] lg:grid dark:bg-white/[0.03]">
          <div />
          <div>Student</div>
          <div>Stage</div>
          <div>Market</div>
          <div>Paid</div>
          <div>Registered</div>
          <div>Record</div>
        </div>

        <div className="divide-y divide-[#f0dfd0] dark:divide-white/10">
          {paginatedStudents.map((student) => {
            const paid = student.consultation_upfront_paid + student.consultation_balance_paid;
            const initials = student.full_name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((name) => name[0])
              .join("")
              .toUpperCase();

            return (
              <article key={student.id} className={`grid gap-4 px-5 py-4 transition hover:bg-[#fffaf5] dark:hover:bg-white/[0.04] lg:grid-cols-[44px_minmax(250px,1.35fr)_140px_140px_130px_150px_130px] lg:items-center ${selectedIds.includes(student.id) ? "bg-[#fff1e6]" : ""}`}>
                <div>
                  {manager ? (
                    <input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleStudent(student.id)} className="h-4 w-4 rounded border-[#d9c1ad] accent-[#213343]" />
                  ) : null}
                </div>
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#31424a,#516672)] text-sm font-semibold text-white shadow-sm">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/students/${student.id}`} className="group inline-flex items-center gap-1 font-semibold text-[#213343] underline-offset-4 hover:underline dark:text-white">
                      {student.full_name}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-300">{student.email}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{student.phone ?? "No phone"} | {student.lead_source ?? "Unknown source"}</p>
                    <div className="mt-2 flex gap-3 text-xs font-medium">
                      <Link href={`/students/${student.id}/timeline`} className="text-[#c9692c] underline-offset-4 hover:underline">Timeline</Link>
                      <Link href={`/students/${student.id}/notes`} className="text-[#c9692c] underline-offset-4 hover:underline">Notes</Link>
                    </div>
                  </div>
                </div>
                <div><Badge className="bg-[#fff1e6] text-[#8b5e3c] ring-[#eadacc] dark:bg-white/[0.08] dark:text-slate-200 dark:ring-white/10">{stageLabels[student.stage]}</Badge></div>
                <div className="text-sm text-slate-700 dark:text-slate-200">{student.country_interest ?? "N/A"}</div>
                <div>
                  <p className="font-semibold text-[#213343] dark:text-white">{formatCurrency(paid)}</p>
                  <p className="text-xs text-slate-500">{student.consultation_status ?? (student.consultation_requested ? "Requested" : "No consultation")}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#213343] dark:text-white">{formatDate(student.created_at)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{student.lead_source ?? "Unknown source"}</p>
                </div>
                <div>
                  <Link
                    href={`/students/${student.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-[#eadacc] bg-white px-3 py-2 text-xs font-semibold text-[#213343] shadow-sm transition hover:bg-[#fff1e6] dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
                  >
                    Open Record
                  </Link>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Updated {formatDate(student.updated_at)}</p>
                </div>
              </article>
            );
          })}

          {filteredStudents.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <p className="text-base font-semibold text-[#213343] dark:text-white">No students match this view</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Adjust the stage filter or search term to widen the list.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
