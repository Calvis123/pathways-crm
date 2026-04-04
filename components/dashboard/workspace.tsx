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
import type { AppRole, AuditLog, DashboardStats, Student } from "@/lib/types";
import { formatCurrency, formatDate, normalizeKenyanPhone } from "@/lib/utils";

const kanbanStages = [
  { id: "inquiry", name: "Inquiry", icon: FileText, color: "bg-slate-100 text-slate-600" },
  { id: "consultation", name: "Consultation", icon: CalendarCheck, color: "bg-sky-100 text-sky-700" },
  { id: "application", name: "Application", icon: LayoutGrid, color: "bg-blue-100 text-blue-700" },
  { id: "visa", name: "Visa", icon: Plane, color: "bg-amber-100 text-amber-700" },
  { id: "placed", name: "Placed", icon: GraduationCap, color: "bg-emerald-100 text-emerald-700" },
  { id: "employment", name: "Employment", icon: Briefcase, color: "bg-indigo-100 text-indigo-700" },
  { id: "lead", name: "Lead", icon: UserPlus, color: "bg-rose-100 text-rose-700" }
] as const;

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

      const totalPaid = student.consultation_upfront_paid + student.consultation_balance_paid;
      const paymentMatch =
        !filterPayment ||
        (filterPayment === "paid" && totalPaid >= 40000) ||
        (filterPayment === "partial" && totalPaid > 0 && totalPaid < 40000) ||
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
      <section className="relative overflow-hidden rounded-[2rem] border border-[#e5d6c8] bg-[linear-gradient(135deg,#fffaf4_0%,#fff1e5_52%,#ffffff_100%)] p-6 shadow-[0_28px_90px_rgba(33,51,67,0.12)] transition-colors dark:border-white/10 dark:bg-[linear-gradient(135deg,#0f1a2d_0%,#14233a_52%,#0f1b30_100%)] dark:shadow-[0_28px_90px_rgba(2,6,23,0.34)] lg:p-8">
        <div className="absolute inset-y-0 right-0 w-[34rem] bg-[radial-gradient(circle_at_top_right,rgba(255,122,89,0.2),transparent_38%),radial-gradient(circle_at_60%_55%,rgba(33,51,67,0.12),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,122,89,0.18),transparent_34%),radial-gradient(circle_at_60%_55%,rgba(148,163,184,0.08),transparent_28%)]" />
        <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#efd8c7] bg-white/80 px-4 py-2 text-sm font-medium text-[#c9692c] shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-[#ffbeab]">
              <Sparkles className="h-4 w-4" />
              {formatRoleName(user?.role)} CRM
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-[#173042] dark:text-white lg:text-5xl">
              Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}. Keep the Barak Pathways pipeline moving.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 lg:text-lg">
              Review student movement, revenue exposure, recent wins, and active follow-up from one executive dashboard
              designed around the real Barak Pathways workflow.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/students" className="rounded-full bg-[#ff7a59] px-6 py-3 text-white hover:bg-[#ef6b49]">
                Open Students
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </LinkButton>
              <LinkButton
                href="/documents"
                variant="secondary"
                className="rounded-full border border-[#e4d2c3] bg-white px-6 py-3 text-slate-700 hover:bg-[#fff5ec] dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1]"
              >
                Review Documents
              </LinkButton>
              {canSeeRevenue(user?.role ?? null) ? (
                <LinkButton
                  href="/financial-reports"
                  variant="secondary"
                  className="rounded-full border border-[#e4d2c3] bg-white px-6 py-3 text-slate-700 hover:bg-[#fff5ec] dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1]"
                >
                  Financial Reports
                </LinkButton>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-[0_18px_48px_rgba(33,51,67,0.08)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)] dark:shadow-[0_20px_52px_rgba(2,6,23,0.22)]">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#213343,#2f495c)] text-white shadow-[0_14px_24px_rgba(33,51,67,0.18)]">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-[#eef7f0] px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {Math.round(stats.conversionRate)}% conversion
                </span>
              </div>
              <p className="mt-5 text-xs uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Active Students</p>
              <p className="mt-2 text-4xl font-semibold text-[#173042] dark:text-white">{stats.totalStudents}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Across consultations, applications, visas, placements, and follow-up.</p>
            </div>

            <div className="rounded-[1.75rem] border border-[#f6cbb7] bg-[linear-gradient(180deg,#fff5ed_0%,#ffffff_100%)] p-5 shadow-[0_18px_48px_rgba(255,122,89,0.12)] dark:border-[#50343a] dark:bg-[linear-gradient(180deg,#2a2130_0%,#1f2435_100%)] dark:shadow-[0_20px_52px_rgba(255,122,89,0.14)]">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff7a59,#ef6b49)] text-white shadow-[0_14px_24px_rgba(255,122,89,0.24)]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-[#fff0e8] px-3 py-1 text-xs font-semibold text-[#c9692c] dark:bg-[#ff7a59]/15 dark:text-[#ffbeab]">
                  Pending {formatCurrency(totalPending)}
                </span>
              </div>
              <p className="mt-5 text-xs uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Collected Revenue</p>
              <p className="mt-2 text-4xl font-semibold text-[#173042] dark:text-white">{formatCurrency(totalRevenue)}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Consultations plus paid IELTS revenue visible in one place.</p>
            </div>

            <div className="rounded-[1.75rem] border border-[#d9e4ef] bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_100%)] p-5 shadow-[0_18px_48px_rgba(37,99,235,0.08)] dark:border-[#30435b] dark:bg-[linear-gradient(180deg,#1e2b40_0%,#172336_100%)] dark:shadow-[0_20px_52px_rgba(37,99,235,0.12)]">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#213343,#3f5f79)] text-white">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-[#edf5ff] px-3 py-1 text-xs font-semibold text-[#275b9b] dark:bg-blue-500/15 dark:text-blue-200">
                  +{newThisWeek} this week
                </span>
              </div>
              <p className="mt-5 text-xs uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Placed Students</p>
              <p className="mt-2 text-4xl font-semibold text-[#173042] dark:text-white">{stats.placedStudents}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Successful placements and momentum across the current cycle.</p>
            </div>

            <div className="rounded-[1.75rem] border border-[#e5dccf] bg-[linear-gradient(180deg,#fffdf9_0%,#ffffff_100%)] p-5 shadow-[0_18px_48px_rgba(33,51,67,0.07)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)] dark:shadow-[0_20px_52px_rgba(2,6,23,0.22)]">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#c9692c,#e09a54)] text-white">
                  <Target className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-[#f8efe6] px-3 py-1 text-xs font-semibold text-[#a35a1f] dark:bg-amber-500/15 dark:text-amber-200">
                  IELTS pending {formatCurrency(pendingIelts)}
                </span>
              </div>
              <p className="mt-5 text-xs uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">IELTS Revenue</p>
              <p className="mt-2 text-4xl font-semibold text-[#173042] dark:text-white">{formatCurrency(ieltsRevenue)}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Paid IELTS enrollments and remaining trainer-side opportunity.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[#e6d8cb] bg-white shadow-[0_24px_70px_rgba(33,51,67,0.08)] transition-colors dark:border-white/10 dark:bg-[#101a2d] dark:shadow-[0_24px_70px_rgba(2,6,23,0.3)]">
        <div className="flex flex-col gap-4 border-b border-[#eee2d6] bg-[radial-gradient(circle_at_top_left,rgba(255,122,89,0.08),transparent_24%),linear-gradient(180deg,#fffdfa_0%,#fff8f2_100%)] px-5 py-5 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(255,122,89,0.12),transparent_24%),linear-gradient(180deg,#121d31_0%,#0f182a_100%)] lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-center gap-4">
            <div className="relative hidden w-80 lg:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students, country, stage..."
                className="w-full rounded-2xl border border-[#e7d8ca] bg-white px-10 py-3 text-sm outline-none transition focus:border-[#ff9a77] focus:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-400 dark:focus:bg-white/[0.08]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowFilters(true)}
              className="rounded-2xl border border-[#e7d8ca] bg-white text-slate-700 hover:bg-[#fff6ef] dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1]"
            >
              <Filter className="mr-1 h-4 w-4" />
              Filters
            </Button>
            <Link
              href="/audit"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e7d8ca] bg-white text-slate-600 transition hover:bg-[#fff6ef] dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
            >
              <Bell className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-[#f1e5da] bg-[#fffdfa] px-5 py-4 dark:border-white/10 dark:bg-[#0f1829] lg:px-6">
          <div className="rounded-full border border-[#eadbcf] bg-white px-4 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
            {filteredStudents.length} visible students
          </div>
          <button
            type="button"
            onClick={toggleAllVisible}
            className="rounded-full border border-[#eadbcf] bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-[#fff6ef] dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.08]"
          >
            {allVisibleSelected ? "Clear visible selection" : "Select visible students"}
          </button>
          <div className="rounded-full border border-[#eadbcf] bg-white px-4 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
            {countries.length} destination markets
          </div>
          <div className="rounded-full border border-[#eadbcf] bg-white px-4 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
            {auditLogs.length} recent tracked actions
          </div>
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex flex-col gap-3 border-b border-[#f2d4bb] bg-[linear-gradient(180deg,#fff5eb_0%,#fff8f1_100%)] px-5 py-4 dark:border-[#4f3328] dark:bg-[linear-gradient(180deg,#2c211d_0%,#201a1c_100%)] lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{selectedIds.length} students selected</p>
            <div className="flex flex-wrap gap-2">
              {manager ? (
                <>
                  <select
                    value={bulkStage}
                    onChange={(event) => setBulkStage(event.target.value)}
                    className="rounded-xl border border-[#efcfb3] bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                  >
                    {kanbanStages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                  <Button type="button" onClick={() => runBulkAction("update_stage")}>
                    Update Stage
                  </Button>
                  <select
                    value={bulkPayment}
                    onChange={(event) => setBulkPayment(event.target.value as "full" | "partial" | "none")}
                    className="rounded-xl border border-[#efcfb3] bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                  >
                    <option value="full">Full Payment</option>
                    <option value="partial">Partial Payment</option>
                    <option value="none">No Payment</option>
                  </select>
                  <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => runBulkAction("update_payment")}>
                    Mark Paid
                  </Button>
                </>
              ) : null}
              <Button type="button" variant="secondary" onClick={() => runBulkAction("export")}>
                Export
              </Button>
              {user?.role === "admin" ? (
                <Button type="button" className="bg-rose-600 text-white hover:bg-rose-700" onClick={() => runBulkAction("delete")}>
                  Delete
                </Button>
              ) : null}
              <Button type="button" variant="secondary" onClick={() => setSelectedIds([])}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 p-5 lg:p-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-[#e7d8ca] bg-[linear-gradient(180deg,#fffdfa_0%,#fff7f0_100%)] p-5 dark:border-white/10 dark:bg-[linear-gradient(180deg,#1b263c_0%,#141f33_100%)]">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Total</p>
                <p className="mt-3 text-3xl font-semibold text-[#173042] dark:text-white">{stats.totalStudents}</p>
              </div>
              <div className="rounded-3xl border border-[#d9ebdd] bg-[linear-gradient(180deg,#f7fff9_0%,#eefaf1_100%)] p-5 dark:border-emerald-500/15 dark:bg-[linear-gradient(180deg,#152a24_0%,#10231f_100%)]">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Placed</p>
                <p className="mt-3 text-3xl font-semibold text-emerald-600">{stats.placedStudents}</p>
              </div>
              <div className="rounded-3xl border border-[#dfe9f4] bg-[linear-gradient(180deg,#f8fbff_0%,#eff6ff_100%)] p-5 dark:border-blue-500/15 dark:bg-[linear-gradient(180deg,#17283d_0%,#132335_100%)]">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">This Week</p>
                <p className="mt-3 text-3xl font-semibold text-blue-600">+{newThisWeek}</p>
              </div>
              <div className="rounded-3xl border border-[#efe2d4] bg-[linear-gradient(180deg,#fffdf9_0%,#fff7ee_100%)] p-5 dark:border-white/10 dark:bg-[linear-gradient(180deg,#1b263c_0%,#141f33_100%)]">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Conversion</p>
                <p className="mt-3 text-3xl font-semibold text-[#173042] dark:text-white">{Math.round(stats.conversionRate)}%</p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {grouped.map((stage) => {
                const StageIcon = stage.icon;
                return (
                  <section
                    key={stage.id}
                    className="overflow-hidden rounded-3xl border border-[#e8ddd1] bg-[linear-gradient(180deg,#ffffff_0%,#fffdfa_100%)] shadow-[0_16px_36px_rgba(33,51,67,0.05)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#182338_0%,#131e31_100%)] dark:shadow-[0_16px_36px_rgba(2,6,23,0.24)]"
                  >
                    <div className="flex items-center justify-between border-b border-[#f0e5da] bg-[linear-gradient(180deg,#fffaf5_0%,#fffdf9_100%)] px-4 py-3 dark:border-white/10 dark:bg-[linear-gradient(180deg,#1f2c44_0%,#16233a_100%)]">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full p-2 ${stage.color}`}>
                          <StageIcon className="h-4 w-4" />
                        </span>
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{stage.name}</h2>
                      </div>
                      <span className="rounded-full bg-[#f2e9df] px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/[0.08] dark:text-slate-300">
                        {stage.students.length}
                      </span>
                    </div>
                    <div className="max-h-[620px] space-y-3 overflow-y-auto p-3">
                      {stage.students.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#e8ddd2] bg-[#fffdf9] px-4 py-10 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-500">
                          No students
                        </div>
                      ) : null}
                      {stage.students.map((student) => {
                        const paid = student.consultation_upfront_paid + student.consultation_balance_paid;
                        const amountOwed = Math.max(0, 40000 - paid);
                        const payment = getPaymentTone(student);
                        const whatsappLink = getWhatsappLink(student);

                        return (
                          <div
                            key={student.id}
                            className={`rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(33,51,67,0.08)] dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)] dark:hover:shadow-[0_18px_34px_rgba(2,6,23,0.3)] ${
                              selectedIds.includes(student.id)
                                ? "border-[#ff9a77] shadow-[0_0_0_3px_rgba(255,122,89,0.12)] dark:shadow-[0_0_0_3px_rgba(255,122,89,0.18)]"
                                : "border-[#ece2d7] dark:border-white/10"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(student.id)}
                                onChange={() => toggleStudent(student.id)}
                                className="mt-1 h-4 w-4 rounded border-slate-300"
                              />
                              <div className="min-w-0 flex-1">
                                <Link href={`/students/${student.id}`} className="block font-semibold text-[#173042] hover:text-[#c9692c] dark:text-white dark:hover:text-[#ffbeab]">
                                  {student.full_name}
                                </Link>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-300">
                                  {student.country_interest ? (
                                    <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/[0.08]">{student.country_interest}</span>
                                  ) : null}
                                  {student.university_name ? <span>{student.university_name}</span> : null}
                                  {whatsappLink ? (
                                    <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-600">
                                      WhatsApp
                                    </a>
                                  ) : null}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${payment.className}`}>
                                    {payment.label}
                                  </span>
                                  {student.ielts_enrolled ? (
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                      student.ielts_payment_status === "paid"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}>
                                      IELTS {student.ielts_amount?.toLocaleString() ?? 0}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                                  Owed: {formatCurrency(amountOwed)} · Updated {formatDate(student.updated_at)}
                                </p>
                              </div>
                              <div className="relative">
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-white"
                                  onClick={() => setOpenMenu((current) => (current === student.id ? null : student.id))}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                                {openMenu === student.id ? (
                                  <div className="absolute right-0 top-9 z-20 min-w-[180px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#162238]">
                                    <Link href={`/students/${student.id}`} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.08]">
                                      <Search className="h-4 w-4" />
                                      View Details
                                    </Link>
                                    <Link href={`/students/${student.id}/timeline`} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.08]">
                                      <LayoutGrid className="h-4 w-4" />
                                      Timeline
                                    </Link>
                                    {whatsappLink ? (
                                      <a href={whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.08]">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        WhatsApp
                                      </a>
                                    ) : null}
                                    <Link href="/documents" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.08]">
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
            {canSeeRevenue(user?.role ?? null) ? (
              <section className="rounded-3xl border border-[#f1d8c7] bg-[linear-gradient(180deg,#fff8f1_0%,#ffffff_100%)] p-5 shadow-[0_16px_36px_rgba(255,122,89,0.08)] dark:border-[#50343a] dark:bg-[linear-gradient(180deg,#2a2130_0%,#1f2435_100%)] dark:shadow-[0_16px_36px_rgba(255,122,89,0.12)]">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <CreditCard className="h-4 w-4 text-amber-500" />
                  Revenue (KES)
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Collected</p>
                    <p className="mt-2 text-xl font-semibold text-emerald-600">{totalRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Pending</p>
                    <p className="mt-2 text-xl font-semibold text-amber-600">{totalPending.toLocaleString()}</p>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-3xl border border-[#e6dacf] bg-[linear-gradient(180deg,#fffdfa_0%,#ffffff_100%)] p-5 shadow-[0_16px_36px_rgba(33,51,67,0.05)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#1b263c_0%,#141f33_100%)] dark:shadow-[0_16px_36px_rgba(2,6,23,0.24)]">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Pipeline Stats
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Total</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{stats.totalStudents}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Placed</p>
                  <p className="mt-2 text-xl font-semibold text-emerald-600">{stats.placedStudents}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">This Week</p>
                  <p className="mt-2 text-xl font-semibold text-blue-600">+{newThisWeek}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Conversion</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{Math.round(stats.conversionRate)}%</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#deebdf] bg-[linear-gradient(180deg,#f7fff8_0%,#ffffff_100%)] p-5 shadow-[0_16px_36px_rgba(16,185,129,0.06)] dark:border-emerald-500/15 dark:bg-[linear-gradient(180deg,#152a24_0%,#10231f_100%)] dark:shadow-[0_16px_36px_rgba(16,185,129,0.1)]">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Recent Wins
              </div>
              <div className="space-y-3">
                {students
                  .filter((student) => ["placed", "employment"].includes(student.stage))
                  .slice(0, 4)
                  .map((student) => (
                    <div key={student.id} className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{student.full_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">
                          {student.country_interest ?? "Country not set"} · {student.university_name ?? "Placement"}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            <section className="rounded-3xl border border-[#e6dacf] bg-[linear-gradient(180deg,#fffdfa_0%,#ffffff_100%)] p-5 shadow-[0_16px_36px_rgba(33,51,67,0.05)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#1b263c_0%,#141f33_100%)] dark:shadow-[0_16px_36px_rgba(2,6,23,0.24)]">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Bell className="h-4 w-4 text-amber-500" />
                Quick Actions
              </div>
              <div className="space-y-2">
                <LinkButton href="/students/new" className="w-full justify-center rounded-2xl bg-[#ff7a59] text-white hover:bg-[#ef6b49]">
                  Add Student
                </LinkButton>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full justify-center rounded-2xl border border-[#eadbcc] bg-white text-slate-700 hover:bg-[#fff6ef] dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1]"
                  onClick={() => setShowFilters(true)}
                >
                  Filters
                </Button>
              </div>
            </section>

            <section className="rounded-3xl border border-[#e6dacf] bg-[linear-gradient(180deg,#fffdfa_0%,#ffffff_100%)] p-5 shadow-[0_16px_36px_rgba(33,51,67,0.05)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#1b263c_0%,#141f33_100%)] dark:shadow-[0_16px_36px_rgba(2,6,23,0.24)]">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Bell className="h-4 w-4 text-slate-600" />
                Audit Trail
              </div>
              <div className="space-y-3">
                {auditLogs.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[#efe4d8] bg-[#fffaf5] p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-sm font-medium text-[#173042] dark:text-white">{item.action}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{item.record_label ?? item.table_name}</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{formatDate(item.created_at)}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>

      {showFilters ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-[#eadacc] bg-white shadow-2xl dark:border-white/10 dark:bg-[#101a2d]">
            <div className="flex items-center justify-between border-b border-[#efe1d4] px-6 py-4 dark:border-white/10">
              <h2 className="text-lg font-semibold text-[#173042] dark:text-white">Advanced Filters</h2>
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-[#fff6ef] dark:text-slate-300 dark:hover:bg-white/[0.08]" onClick={() => setShowFilters(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-2 block font-medium text-[#173042] dark:text-white">Stage</span>
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
                <span className="mb-2 block font-medium text-[#173042] dark:text-white">Country</span>
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
                <span className="mb-2 block font-medium text-[#173042] dark:text-white">Payment Status</span>
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
