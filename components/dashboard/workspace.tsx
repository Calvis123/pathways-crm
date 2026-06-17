"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Filter,
  Folder,
  GraduationCap,
  LayoutGrid,
  MoreVertical,
  Plane,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  X
} from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { CONSULTATION_FEE, getConsultationBalance, getConsultationPaid } from "@/lib/finance";
import type { AppRole, AuditLog, DashboardStats, Student } from "@/lib/types";
import { formatCurrency, formatDate, normalizeKenyanPhone } from "@/lib/utils";

const kanbanStages = [
  {
    id: "inquiry",
    name: "Inquiry",
    icon: FileText,
    color: "bg-slate-100 text-slate-600",
    accent: "bg-slate-500",
    soft: "bg-[#fff6ef]"
  },
  {
    id: "consultation",
    name: "Consultation",
    icon: CalendarCheck,
    color: "bg-sky-100 text-sky-700",
    accent: "bg-sky-500",
    soft: "bg-sky-50"
  },
  {
    id: "application",
    name: "Application",
    icon: LayoutGrid,
    color: "bg-blue-100 text-blue-700",
    accent: "bg-blue-600",
    soft: "bg-blue-50"
  },
  {
    id: "visa",
    name: "Visa",
    icon: Plane,
    color: "bg-amber-100 text-amber-700",
    accent: "bg-amber-500",
    soft: "bg-amber-50"
  },
  {
    id: "placed",
    name: "Placed",
    icon: GraduationCap,
    color: "bg-emerald-100 text-emerald-700",
    accent: "bg-emerald-600",
    soft: "bg-emerald-50"
  },
  {
    id: "employment",
    name: "Employment",
    icon: Briefcase,
    color: "bg-indigo-100 text-indigo-700",
    accent: "bg-indigo-600",
    soft: "bg-indigo-50"
  },
  {
    id: "lead",
    name: "Lead",
    icon: UserPlus,
    color: "bg-rose-100 text-rose-700",
    accent: "bg-rose-500",
    soft: "bg-rose-50"
  }
] as const;

const PIPELINE_ITEMS_PER_PAGE = 10;

function canManage(role: AppRole | null) {
  return role === "admin" || role === "consultant" || role === "employee";
}

function canSeeRevenue(role: AppRole | null) {
  return role === "admin" || role === "employee";
}

function getPaymentTone(student: Student) {
  if (student.payment_status === "full" || student.payment_status === "paid") {
    return { label: "Full (40k)", className: "bg-emerald-100 text-emerald-700" };
  }

  if (student.payment_status === "installment" || student.payment_status === "partial") {
    return { label: "Partial (20k)", className: "bg-amber-100 text-amber-700" };
  }

  return { label: "Unpaid", className: "bg-rose-100 text-rose-700" };
}

function getWhatsappLink(student: Student) {
  const phone = student.phone ? normalizeKenyanPhone(student.phone) : null;
  if (!phone) return null;
  const text = encodeURIComponent(`Hello ${student.full_name}, I am contacting you from Barak Pathways.`);
  return `https://wa.me/${phone.replace("+", "")}?text=${text}`;
}

function formatRoleName(role: AppRole | null | undefined) {
  if (!role) return "Team";
  return role.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function DashboardWorkspace({
  students,
  stats,
  auditLogs,
  user
}: {
  students: Student[];
  stats: DashboardStats;
  auditLogs: AuditLog[];
  user: { full_name: string; role: AppRole } | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterStage, setFilterStage] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [bulkStage, setBulkStage] = useState("consultation");
  const [bulkPayment, setBulkPayment] = useState<"full" | "partial" | "none">("partial");
  const [stagePages, setStagePages] = useState<Record<string, number>>({});
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<string>("inquiry");
  const manager = canManage(user?.role ?? null);

  const countries = useMemo(
    () =>
      Array.from(
        new Set(students.map((student) => student.country_interest).filter((value): value is string => Boolean(value)))
      ).sort(),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    return students.filter((student) => {
      const textMatch =
        !term ||
        [
          student.full_name,
          student.email,
          student.phone,
          student.country_interest,
          student.university_name,
          student.stage
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const stageMatch = !filterStage || student.stage === filterStage;
      const countryMatch = !filterCountry || student.country_interest === filterCountry;

      const totalPaid = getConsultationPaid(student);
      const paymentMatch =
        !filterPayment ||
        (filterPayment === "paid" && totalPaid >= CONSULTATION_FEE) ||
        (filterPayment === "partial" && totalPaid > 0 && totalPaid < CONSULTATION_FEE) ||
        (filterPayment === "unpaid" && totalPaid <= 0);

      return textMatch && stageMatch && countryMatch && paymentMatch;
    });
  }, [students, search, filterStage, filterCountry, filterPayment]);

  const grouped = useMemo(
    () =>
      kanbanStages.map((stage) => ({
        ...stage,
        students: filteredStudents.filter((student) => student.stage === stage.id)
      })),
    [filteredStudents]
  );
  const selectedPipelineGroup = grouped.find((stage) => stage.id === selectedPipelineStage) ?? grouped[0];
  const selectedPipelinePageCount = Math.max(1, Math.ceil(selectedPipelineGroup.students.length / PIPELINE_ITEMS_PER_PAGE));
  const selectedPipelinePage = Math.min(stagePages[selectedPipelineGroup.id] ?? 0, selectedPipelinePageCount - 1);
  const selectedPipelineStudents = selectedPipelineGroup.students.slice(
    selectedPipelinePage * PIPELINE_ITEMS_PER_PAGE,
    selectedPipelinePage * PIPELINE_ITEMS_PER_PAGE + PIPELINE_ITEMS_PER_PAGE
  );
  const selectedPipelineShare =
    filteredStudents.length > 0 ? Math.round((selectedPipelineGroup.students.length / filteredStudents.length) * 100) : 0;

  const allVisibleSelected =
    filteredStudents.length > 0 && filteredStudents.every((student) => selectedIds.includes(student.id));

  const newThisWeek = students.filter(
    (student) => new Date(student.created_at).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;
  const ieltsRevenue = students
    .filter((student) => student.ielts_enrolled && student.ielts_payment_status === "paid")
    .reduce((sum, student) => sum + (student.ielts_amount ?? 0), 0);
  const pendingIelts = students
    .filter((student) => student.ielts_enrolled && student.ielts_payment_status !== "paid")
    .reduce((sum, student) => sum + (student.ielts_amount ?? 0), 0);
  const totalRevenue = stats.totalRevenue + ieltsRevenue;
  const totalPending = stats.pendingRevenue + pendingIelts;

  function toggleStudent(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !filteredStudents.some((student) => student.id === id)));
      return;
    }

    setSelectedIds(Array.from(new Set([...selectedIds, ...filteredStudents.map((student) => student.id)])));
  }

  function resetFilters() {
    setFilterStage("");
    setFilterCountry("");
    setFilterPayment("");
    setStagePages({});
  }

  function changeStagePage(stageId: string, direction: -1 | 1, pageCount: number) {
    setStagePages((current) => ({
      ...current,
      [stageId]: Math.min(pageCount - 1, Math.max(0, (current[stageId] ?? 0) + direction))
    }));
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

    const body = (await response.json().catch(() => null)) as { error?: string; count?: number } | null;
    if (!response.ok) {
      setStatus(body?.error ?? "Bulk action failed.");
      return;
    }

    setStatus(`${body?.count ?? selectedIds.length} students updated.`);
    setSelectedIds([]);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-[#eadacc] bg-white shadow-[0_18px_50px_rgba(120,75,42,0.1)] transition-colors dark:border-white/10 dark:bg-[#182638]">
        <div className="bg-[linear-gradient(135deg,#fffaf5_0%,#fff1e6_56%,#ffe0c8_100%)] px-5 py-6 text-[#213343] lg:px-7 lg:py-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-md border border-[#eadacc] bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase text-[#8b5e3c] shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-[#c9692c]" />
              {formatRoleName(user?.role)} Dashboard
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-[#213343] lg:text-4xl">
                Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7182]">
                Monitor student pipeline health, revenue exposure, and priority follow-up from one focused admin workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <LinkButton href="/students" className="rounded-lg bg-[#213343] px-4 py-2.5 text-white shadow-sm hover:bg-[#2f495c]">
                Open Students
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </LinkButton>
              <LinkButton href="/documents" variant="secondary" className="rounded-lg border-[#eadacc] bg-white/70 px-4 py-2.5 text-[#213343] hover:bg-white">
                Documents
              </LinkButton>
              {canSeeRevenue(user?.role ?? null) ? (
                <LinkButton href="/financial-reports" variant="secondary" className="rounded-lg border-[#eadacc] bg-white/70 px-4 py-2.5 text-[#213343] hover:bg-white">
                  Financial Reports
                </LinkButton>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-3 bg-[#fff6ef] p-5 dark:bg-white/[0.03] sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-[#eadacc] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Active Students</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <LayoutGrid className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{stats.totalStudents}</p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">{Math.round(stats.conversionRate)}% conversion</p>
          </div>

          <div className="rounded-lg border border-[#eadacc] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Collected Revenue</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CreditCard className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{formatCurrency(totalRevenue)}</p>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">Pending {formatCurrency(totalPending)}</p>
          </div>

          <div className="rounded-lg border border-[#eadacc] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Placed Students</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff3e8] text-[#c9692c] dark:bg-[#ff7a59]/10 dark:text-[#ffbeab]">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{stats.placedStudents}</p>
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-300">+{newThisWeek} this week</p>
          </div>

          <div className="rounded-lg border border-[#eadacc] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">IELTS Revenue</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                <Target className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{formatCurrency(ieltsRevenue)}</p>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">Pending {formatCurrency(pendingIelts)}</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#eadacc] bg-white shadow-[0_14px_42px_rgba(120,75,42,0.08)] transition-colors dark:border-white/10 dark:bg-[#182638]">
        <div className="flex flex-col gap-4 border-b border-[#eadacc] bg-[linear-gradient(180deg,#ffffff_0%,#fffaf5_100%)] px-5 py-4 dark:border-white/10 dark:bg-[#182638] lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Student Pipeline</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search, filter, and act on active student records.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[25rem]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students, country, stage..."
                className="h-11 w-full rounded-lg border border-[#eadacc] bg-white px-10 text-sm shadow-sm outline-none transition focus:border-[#ff9a77] focus:ring-4 focus:ring-[#ff7a59]/10 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-400 dark:focus:border-[#ff9a77]/50 dark:focus:ring-[#ff7a59]/10"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowFilters(true)}
              className="h-11 rounded-lg px-3 shadow-sm"
            >
              <Filter className="mr-1 h-4 w-4" />
              Filters
            </Button>
            <Link
              href="/audit"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#eadacc] bg-white text-slate-600 shadow-sm transition hover:border-[#ff9a77] hover:text-[#c9692c] dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
              aria-label="View audit trail"
            >
              <Bell className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-[#eadacc] bg-[#fff6ef] px-5 py-3 dark:border-white/10 dark:bg-white/[0.03] lg:px-6">
          <div className="rounded-md border border-[#eadacc] bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
            {filteredStudents.length} visible students
          </div>
          <button
            type="button"
            onClick={toggleAllVisible}
            className="rounded-md border border-[#eadacc] bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-[#ff9a77] hover:text-[#c9692c] dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.08]"
          >
            {allVisibleSelected ? "Clear visible selection" : "Select visible students"}
          </button>
          <div className="rounded-md border border-[#eadacc] bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
            {countries.length} destination markets
          </div>
          <div className="rounded-md border border-[#eadacc] bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
            {auditLogs.length} recent tracked actions
          </div>
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex flex-col gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3 dark:border-amber-500/20 dark:bg-amber-500/10 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{selectedIds.length} students selected</p>
            <div className="flex flex-wrap gap-2">
              {manager ? (
                <>
                  <select
                    value={bulkStage}
                    onChange={(event) => setBulkStage(event.target.value)}
                    className="h-10 rounded-lg border border-amber-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                  >
                    {kanbanStages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                  <Button type="button" className="h-10 rounded-lg" onClick={() => runBulkAction("update_stage")}>
                    Update Stage
                  </Button>
                  <select
                    value={bulkPayment}
                    onChange={(event) => setBulkPayment(event.target.value as "full" | "partial" | "none")}
                    className="h-10 rounded-lg border border-amber-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                  >
                    <option value="full">Full Payment</option>
                    <option value="partial">Partial Payment</option>
                    <option value="none">No Payment</option>
                  </select>
                  <Button type="button" className="h-10 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => runBulkAction("update_payment")}>
                    Mark Paid
                  </Button>
                </>
              ) : null}
              <Button type="button" variant="secondary" className="h-10 rounded-lg" onClick={() => runBulkAction("export")}>
                Export
              </Button>
              {user?.role === "admin" ? (
                <Button type="button" className="h-10 rounded-lg bg-rose-600 text-white hover:bg-rose-700" onClick={() => runBulkAction("delete")}>
                  Delete
                </Button>
              ) : null}
              <Button type="button" variant="secondary" className="h-10 rounded-lg" onClick={() => setSelectedIds([])}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 bg-[#fffaf5] p-5 dark:bg-transparent lg:p-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-[#eadacc] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Total</p>
                <p className="mt-3 text-3xl font-semibold text-[#213343] dark:text-white">{stats.totalStudents}</p>
              </div>
              <div className="rounded-lg border border-[#eadacc] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Placed</p>
                <p className="mt-3 text-3xl font-semibold text-emerald-600">{stats.placedStudents}</p>
              </div>
              <div className="rounded-lg border border-[#eadacc] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">This Week</p>
                <p className="mt-3 text-3xl font-semibold text-blue-600">+{newThisWeek}</p>
              </div>
              <div className="rounded-lg border border-[#eadacc] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Conversion</p>
                <p className="mt-3 text-3xl font-semibold text-[#213343] dark:text-white">{Math.round(stats.conversionRate)}%</p>
              </div>
            </div>

            <section className="rounded-xl border border-[#eadacc] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#213343] dark:text-white">Pipeline Categories</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Showing {selectedPipelineGroup.name}: {selectedPipelineGroup.students.length} records, {selectedPipelineShare}% of visible pipeline.
                  </p>
                </div>
                <select
                  value={selectedPipelineStage}
                  onChange={(event) => setSelectedPipelineStage(event.target.value)}
                  className="h-11 min-w-[220px] rounded-lg border border-[#eadacc] bg-white px-3 text-sm font-semibold text-[#213343] shadow-sm outline-none transition focus:border-[#ff9a77] focus:ring-4 focus:ring-[#ff7a59]/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                >
                  {grouped.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name} ({stage.students.length})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {grouped.map((stage) => (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setSelectedPipelineStage(stage.id)}
                    className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      selectedPipelineStage === stage.id
                        ? "border-[#213343] bg-[#213343] text-white"
                        : "border-[#eadacc] bg-[#fffaf5] text-[#5f7182] hover:bg-[#fff1e6] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                    }`}
                  >
                    {stage.name} {stage.students.length}
                  </button>
                ))}
              </div>
            </section>

            <div className="grid gap-4">
              {grouped.filter((stage) => stage.id === selectedPipelineStage).map((stage) => {
                const StageIcon = stage.icon;
                const stageShare =
                  filteredStudents.length > 0 ? Math.round((stage.students.length / filteredStudents.length) * 100) : 0;
                const pageCount = selectedPipelinePageCount;
                const page = selectedPipelinePage;
                const pageStudents = selectedPipelineStudents;
                return (
                  <section
                    key={stage.id}
                    className="overflow-hidden rounded-xl border border-[#eadacc] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.09)] dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <div className={`h-1.5 ${stage.accent}`} />
                    <div className="border-b border-[#eadacc] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${stage.color}`}>
                            <StageIcon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <h2 className="truncate text-sm font-semibold text-slate-950 dark:text-white">{stage.name}</h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{stageShare}% of visible pipeline</p>
                          </div>
                        </div>
                        <span className="rounded-lg border border-[#eadacc] bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-200">
                          {stage.students.length}
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
                        <div className={`h-full rounded-full ${stage.accent}`} style={{ width: `${stageShare}%` }} />
                      </div>
                      {stage.students.length > PIPELINE_ITEMS_PER_PAGE ? (
                        <div className="mt-3 flex items-center justify-between rounded-lg border border-[#eadacc] bg-white px-2 py-1.5 text-xs font-semibold text-[#5f7182] shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                          <button
                            type="button"
                            onClick={() => changeStagePage(stage.id, -1, pageCount)}
                            disabled={page === 0}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#213343] transition hover:bg-[#fff6ef] disabled:cursor-not-allowed disabled:opacity-40 dark:text-white dark:hover:bg-white/[0.08]"
                            aria-label={`Previous ${stage.name} page`}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span>
                            {page * PIPELINE_ITEMS_PER_PAGE + 1}-{Math.min((page + 1) * PIPELINE_ITEMS_PER_PAGE, stage.students.length)} of {stage.students.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeStagePage(stage.id, 1, pageCount)}
                            disabled={page >= pageCount - 1}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#213343] transition hover:bg-[#fff6ef] disabled:cursor-not-allowed disabled:opacity-40 dark:text-white dark:hover:bg-white/[0.08]"
                            aria-label={`Next ${stage.name} page`}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div className={`max-h-[640px] space-y-3 overflow-y-auto p-3 ${stage.soft} dark:bg-transparent`}>
                      {stage.students.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#d9c6b8] bg-white px-4 py-10 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-500">
                          No students in this stage
                        </div>
                      ) : null}
                      {pageStudents.map((student) => {
                        const paid = getConsultationPaid(student);
                        const amountOwed = getConsultationBalance(student);
                        const payment = getPaymentTone(student);
                        const whatsappLink = getWhatsappLink(student);
                        const paidPercent = Math.min(100, Math.round((paid / CONSULTATION_FEE) * 100));

                        return (
                          <div
                            key={student.id}
                            className={`group rounded-lg border bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#ffb089] hover:shadow-[0_14px_34px_rgba(15,23,42,0.1)] dark:bg-white/[0.04] ${
                              selectedIds.includes(student.id)
                                ? "border-[#ff9a77] shadow-[0_0_0_3px_rgba(255,122,89,0.12)]"
                                : "border-[#eadacc] dark:border-white/10"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(student.id)}
                                onChange={() => toggleStudent(student.id)}
                                className="mt-1 h-4 w-4 rounded border-[#d9c6b8] accent-slate-950"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#31424a,#516672)] text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-slate-950">
                                    {student.full_name
                                      .split(" ")
                                      .filter(Boolean)
                                      .slice(0, 2)
                                      .map((name) => name[0])
                                      .join("")
                                      .toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <Link href={`/students/${student.id}`} className="block truncate text-sm font-semibold text-slate-950 hover:text-[#c9692c] dark:text-white dark:hover:text-[#ffbeab]">
                                      {student.full_name}
                                    </Link>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300">
                                      {student.country_interest ? (
                                        <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-white/[0.08] dark:text-slate-200 dark:ring-white/10">
                                          {student.country_interest}
                                        </span>
                                      ) : null}
                                      {student.university_name ? (
                                        <span className="max-w-[13rem] truncate">{student.university_name}</span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                  <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${payment.className}`}>
                                    {payment.label}
                                  </span>
                                  {student.ielts_enrolled ? (
                                    <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                                      student.ielts_payment_status === "paid"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}>
                                      IELTS {student.ielts_amount?.toLocaleString() ?? 0}
                                    </span>
                                  ) : null}
                                  {whatsappLink ? (
                                    <a
                                      href={whatsappLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"
                                    >
                                      WhatsApp
                                    </a>
                                  ) : null}
                                </div>

                                <div className="mt-4 space-y-2">
                                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    <span>Consultation paid</span>
                                    <span>{paidPercent}%</span>
                                  </div>
                                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/70 dark:bg-white/[0.08] dark:ring-white/10">
                                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paidPercent}%` }} />
                                  </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#f0dfd0] pt-3 text-xs dark:border-white/10">
                                  <div>
                                    <p className="font-medium text-slate-400 dark:text-slate-500">Balance</p>
                                    <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(amountOwed)}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-400 dark:text-slate-500">Updated</p>
                                    <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{formatDate(student.updated_at)}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="relative">
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 opacity-80 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 dark:hover:bg-white/[0.08] dark:hover:text-white"
                                  onClick={() => setOpenMenu((current) => (current === student.id ? null : student.id))}
                                  aria-label={`Open actions for ${student.full_name}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                                {openMenu === student.id ? (
                                  <div className="absolute right-0 top-9 z-20 min-w-[180px] rounded-lg border border-[#eadacc] bg-white p-1 shadow-xl dark:border-white/10 dark:bg-[#162238]">
                                    <Link href={`/students/${student.id}`} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-[#fff6ef] dark:text-slate-200 dark:hover:bg-white/[0.08]">
                                      <Search className="h-4 w-4" />
                                      View Details
                                    </Link>
                                    <Link href={`/students/${student.id}/timeline`} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-[#fff6ef] dark:text-slate-200 dark:hover:bg-white/[0.08]">
                                      <LayoutGrid className="h-4 w-4" />
                                      Timeline
                                    </Link>
                                    {whatsappLink ? (
                                      <a href={whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-[#fff6ef] dark:text-slate-200 dark:hover:bg-white/[0.08]">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        WhatsApp
                                      </a>
                                    ) : null}
                                    <Link href="/documents" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-[#fff6ef] dark:text-slate-200 dark:hover:bg-white/[0.08]">
                                      <Folder className="h-4 w-4" />
                                      Documents
                                    </Link>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>

          <aside className="space-y-4">
            <section className="overflow-hidden rounded-xl border border-[#eadacc] bg-white shadow-[0_18px_45px_rgba(120,75,42,0.1)] dark:border-white/10 dark:bg-[#182638]">
              <div className="bg-[linear-gradient(135deg,#fffaf5_0%,#fff0e4_100%)] px-5 py-5 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b5e3c] dark:text-[#ffbeab]">Today Panel</p>
                    <h2 className="mt-2 text-xl font-semibold text-[#213343] dark:text-white">Control center</h2>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#213343] text-white shadow-sm dark:bg-[#ff7a59]">
                    <Sparkles className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[#eadacc] bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                    <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Students</p>
                    <p className="mt-2 text-2xl font-semibold text-[#213343] dark:text-white">{stats.totalStudents}</p>
                  </div>
                  <div className="rounded-lg border border-[#eadacc] bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                    <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Conversion</p>
                    <p className="mt-2 text-2xl font-semibold text-[#213343] dark:text-white">{Math.round(stats.conversionRate)}%</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-5">
                {canSeeRevenue(user?.role ?? null) ? (
                  <div className="rounded-xl border border-[#eadacc] bg-[#fffaf5] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#213343] dark:text-white">
                        <CreditCard className="h-4 w-4 text-amber-500" />
                        Revenue Snapshot
                      </div>
                      <Link href="/financial-reports" className="text-xs font-semibold text-[#c9692c] underline-offset-4 hover:underline dark:text-[#ffbeab]">
                        Open
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Collected</p>
                        <p className="mt-2 text-lg font-semibold text-emerald-600">{totalRevenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Pending</p>
                        <p className="mt-2 text-lg font-semibold text-amber-600">{totalPending.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#213343] dark:text-white">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      Pipeline Health
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                      +{newThisWeek} week
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span>Placed</span>
                        <span>{stats.placedStudents}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#f3e5d8] dark:bg-white/[0.08]">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(4, stats.totalStudents ? (stats.placedStudents / stats.totalStudents) * 100 : 0))}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span>Conversion</span>
                        <span>{Math.round(stats.conversionRate)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#f3e5d8] dark:bg-white/[0.08]">
                        <div className="h-full rounded-full bg-[#213343] dark:bg-[#ff7a59]" style={{ width: `${Math.min(100, Math.max(4, Math.round(stats.conversionRate)))}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <LinkButton href="/students/new" className="justify-center rounded-lg bg-[#213343] text-white hover:bg-[#2f495c] dark:bg-[#ff7a59] dark:hover:bg-[#ef6b49]">
                    Add Student
                  </LinkButton>
                  <Button type="button" variant="secondary" className="justify-center rounded-lg border-[#eadacc]" onClick={() => setShowFilters(true)}>
                    Filters
                  </Button>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#eadacc] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#213343] dark:text-white">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  Latest Win
                </div>
                <Link href="/students?stage=placed" className="text-xs font-semibold text-[#c9692c] underline-offset-4 hover:underline dark:text-[#ffbeab]">
                  View all
                </Link>
              </div>
              {students
                .filter((student) => ["placed", "employment"].includes(student.stage))
                .slice(0, 1)
                .map((student) => (
                  <div key={student.id} className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">{student.full_name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">
                          {student.country_interest ?? "Country not set"} | {student.university_name ?? "Placement"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </section>

            <section className="rounded-xl border border-[#eadacc] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#213343] dark:text-white">
                  <Bell className="h-4 w-4 text-amber-500" />
                  Recent Activity
                </div>
                <Link href="/audit" className="text-xs font-semibold text-[#c9692c] underline-offset-4 hover:underline dark:text-[#ffbeab]">
                  Audit
                </Link>
              </div>
              <div className="relative space-y-4 before:absolute before:left-[0.43rem] before:top-1 before:h-[calc(100%-0.5rem)] before:w-px before:bg-[#eadacc] dark:before:bg-white/10">
                {auditLogs.slice(0, 4).map((item) => (
                  <div key={item.id} className="relative flex gap-3">
                    <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white bg-[#c9692c] shadow-sm dark:border-[#182638]" />
                    <div className="min-w-0 rounded-lg bg-[#fffaf5] px-3 py-2 dark:bg-white/[0.04]">
                      <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{item.action}</p>
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-300">{item.record_label ?? item.table_name}</p>
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{formatDate(item.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>

        </div>
      </section>

      {showFilters ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#213343]/40 px-4">
          <div className="w-full max-w-lg rounded-xl border border-[#eadacc] bg-white shadow-2xl dark:border-white/10 dark:bg-[#182638]">
            <div className="flex items-center justify-between border-b border-[#efe1d4] px-6 py-4 dark:border-white/10">
              <h2 className="text-lg font-semibold text-[#213343] dark:text-white">Advanced Filters</h2>
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-[#fff6ef] dark:text-slate-300 dark:hover:bg-white/[0.08]" onClick={() => setShowFilters(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-[#213343] dark:text-white">Stage</span>
                <select value={filterStage} onChange={(event) => setFilterStage(event.target.value)} className="w-full rounded-2xl border border-[#eadacc] px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
                  <option value="">All Stages</option>
                  {kanbanStages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-[#213343] dark:text-white">Country</span>
                <select value={filterCountry} onChange={(event) => setFilterCountry(event.target.value)} className="w-full rounded-2xl border border-[#eadacc] px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
                  <option value="">All Countries</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-[#213343] dark:text-white">Payment Status</span>
                <select value={filterPayment} onChange={(event) => setFilterPayment(event.target.value)} className="w-full rounded-2xl border border-[#eadacc] px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
                  <option value="">All</option>
                  <option value="paid">Fully Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#efe1d4] px-6 py-4 dark:border-white/10">
              <Button type="button" variant="secondary" onClick={resetFilters}>
                Reset
              </Button>
              <Button type="button" onClick={() => setShowFilters(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {status ? <p className="text-sm text-slate-500 dark:text-slate-300">{status}</p> : null}
    </div>
  );
}
