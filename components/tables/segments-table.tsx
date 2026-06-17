"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSegmentMeta, stageLabels } from "@/lib/constants";
import type { SegmentKey, SegmentSummary, Student } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { IonIcon } from "@/components/ui/ion-icon";
import { PaginationControls } from "@/components/ui/pagination-controls";

type SegmentFilter = SegmentKey | "all";

type SegmentedStudent = Student & {
  total_paid: number;
  effective_segment: SegmentKey;
  effective_segment_score: number;
};

const segmentOrder: SegmentKey[] = [
  "ready_to_go",
  "needs_guidance",
  "price_sensitive",
  "ielts_focused",
  "vip",
  "unsegmented"
];

const ITEMS_PER_PAGE = 10;

function scoreTone(score: number) {
  if (score >= 70) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200";
  if (score >= 40) return "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200";
  return "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200";
}

export function SegmentsTable({
  students,
  summaries,
  totalStudents,
  filterSegment
}: {
  students: SegmentedStudent[];
  summaries: SegmentSummary[];
  totalStudents: number;
  filterSegment: SegmentFilter;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [singleModal, setSingleModal] = useState<{
    studentId: string;
    studentName: string;
    segment: SegmentKey;
  } | null>(null);
  const [singleSegment, setSingleSegment] = useState<SegmentKey>("needs_guidance");
  const [singleReason, setSingleReason] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSegment, setBulkSegment] = useState<SegmentKey>("needs_guidance");
  const [page, setPage] = useState(0);

  const summaryMap = useMemo(() => {
    return new Map(summaries.map((summary) => [summary.segment, summary]));
  }, [summaries]);

  const pageCount = Math.max(1, Math.ceil(students.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const paginatedStudents = students.slice(safePage * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);
  const allVisibleSelected = paginatedStudents.length > 0 && paginatedStudents.every((student) => selectedIds.includes(student.id));

  function resetMessages() {
    setError(null);
    setSuccess(null);
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !paginatedStudents.some((student) => student.id === id)));
      return;
    }
    setSelectedIds((current) => Array.from(new Set([...current, ...paginatedStudents.map((student) => student.id)])));
  }

  function toggleStudent(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function openSingleModal(student: SegmentedStudent) {
    setSingleModal({
      studentId: student.id,
      studentName: student.full_name,
      segment: student.effective_segment
    });
    setSingleSegment(student.effective_segment);
    setSingleReason("");
  }

  async function postSegmentAction(body: Record<string, unknown>, successMessage: string) {
    resetMessages();

    startTransition(async () => {
      const response = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Failed to update segments.");
        return;
      }

      setSuccess(successMessage);
      setSelectedIds([]);
      setSingleModal(null);
      setBulkOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#eadacc] bg-white shadow-panel dark:border-white/10 dark:bg-[#182638]">
        <div className="border-b border-[#8f7a30]/20 bg-[linear-gradient(135deg,#213343,#3f5a68)] px-8 py-6 text-white dark:border-white/10 dark:bg-[linear-gradient(135deg,#213343,#3f5a68)]">
          <h1 className="font-serif text-3xl">Customer Segmentation</h1>
          <p className="mt-2 text-sm text-white/70">
            Auto-segment students based on behavior, readiness, and value.
          </p>
        </div>

        <div className="space-y-6 px-8 py-8">
          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              {success}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (window.confirm("This will auto-segment all students using their current data. Continue?")) {
                  void postSegmentAction(
                    { action: "auto_segment" },
                    "All students were auto-segmented successfully."
                  );
                }
              }}
              className="inline-flex items-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              Auto-Segment All
            </button>
            <button
              type="button"
              disabled={isPending || selectedIds.length === 0}
              onClick={() => setBulkOpen(true)}
              className="inline-flex items-center rounded-2xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean disabled:opacity-60"
            >
              Bulk Update
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-4">
            <div className="rounded-xl border border-[#eadacc] bg-[linear-gradient(135deg,#213343,#3f5a68)] p-5 text-white">
              <p className="text-sm uppercase tracking-[0.08em] text-white/60">Total Students</p>
              <p className="mt-4 text-4xl font-semibold">{totalStudents}</p>
              <p className="mt-2 text-sm text-white/70">All registered students</p>
            </div>
            {segmentOrder.map((segment) => {
              const meta = getSegmentMeta(segment);
              const summary = summaryMap.get(segment);
              return (
                <div
                  key={segment}
                  className="rounded-xl border border-[#eadacc] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.05]"
                  style={{ borderLeftColor: meta.color, borderLeftWidth: 4 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
                      style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                    >
                      <IonIcon icon={meta.icon} className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-ink dark:text-white">{summary?.count ?? 0}</p>
                      <p className="text-xs uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">Students</p>
                    </div>
                  </div>
                  <p className="mt-4 font-semibold text-ink dark:text-white">{meta.label}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{meta.description}</p>
                  <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {formatCurrency(summary?.total_value ?? 0)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            <Link
              href="/segments"
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition",
                filterSegment === "all"
                  ? "border-[#213343] bg-[linear-gradient(135deg,#213343,#3f5a68)] text-white"
                  : "border-[#eadacc] bg-white text-slate-700 hover:border-gold hover:bg-gold/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:bg-white/[0.08]"
              )}
            >
              All Students
            </Link>
            {segmentOrder.map((segment) => {
              const meta = getSegmentMeta(segment);
              return (
                <Link
                  key={segment}
                  href={`/segments?segment=${segment}`}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition",
                    filterSegment === segment
                      ? "text-white"
                      : "border-[#eadacc] bg-white text-slate-700 hover:bg-[#fff6ef] dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                  )}
                  style={
                    filterSegment === segment
                      ? { backgroundColor: meta.color, borderColor: meta.color }
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    <IonIcon icon={meta.icon} className="h-4 w-4" />
                    <span>{meta.label}</span>
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[#eadacc] dark:border-white/10">
            <div className="border-b border-[#eadacc] bg-[#fffaf5] p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <PaginationControls
                page={safePage}
                pageCount={pageCount}
                total={students.length}
                perPage={ITEMS_PER_PAGE}
                onPageChange={setPage}
                label="students"
              />
            </div>
            <div className="hidden grid-cols-[52px_minmax(220px,1fr)_160px_100px_120px_120px_90px] gap-4 bg-[linear-gradient(135deg,#213343,#3f5a68)] px-5 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-white lg:grid">
              <label className="flex items-center">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
              </label>
              <div>Student</div>
              <div>Segment</div>
              <div>Score</div>
              <div>Stage</div>
              <div>Paid</div>
              <div>Actions</div>
            </div>

            <div className="divide-y divide-slate-100 bg-white dark:divide-white/10 dark:bg-[#182638]">
              {students.length === 0 ? (
                <div className="px-6 py-16 text-center text-slate-500 dark:text-slate-300">
                  No students found. Run auto-segment to categorize all students.
                </div>
              ) : null}

              {paginatedStudents.map((student) => {
                const meta = getSegmentMeta(student.effective_segment);
                return (
                  <div
                    key={student.id}
                    className="grid gap-4 px-5 py-4 transition hover:bg-gold/5 lg:grid-cols-[52px_minmax(220px,1fr)_160px_100px_120px_120px_90px] lg:items-center"
                  >
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="h-4 w-4 accent-[#8f7a30]"
                      />
                    </label>

                    <div>
                      <p className="font-semibold text-ink">{student.full_name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {student.email} {student.phone ? `| ${student.phone}` : ""}
                      </p>
                    </div>

                    <div>
                      <span
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: meta.color }}
                      >
                        <IonIcon icon={meta.icon} className="h-3.5 w-3.5" />
                        <span>{meta.label}</span>
                      </span>
                    </div>

                    <div>
                      <span
                        className={cn(
                          "inline-flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold",
                          scoreTone(student.effective_segment_score)
                        )}
                      >
                        {student.effective_segment_score}
                      </span>
                    </div>

                    <div className="text-sm text-slate-700">
                      {stageLabels[student.stage] ?? student.stage}
                    </div>

                    <div className="text-sm font-semibold text-slate-800">
                      {formatCurrency(student.total_paid)}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => openSingleModal(student)}
                        className="inline-flex rounded-xl border border-[#eadacc] px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#fff6ef] dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.06]"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {selectedIds.length > 0 ? (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-gold bg-[linear-gradient(135deg,#213343,#3f5a68)] px-5 py-4 text-white shadow-2xl">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-[#213343]"
          >
            Change Segment
          </button>
        </div>
      ) : null}

      {singleModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#213343]/70 p-4 backdrop-blur-sm"
          onClick={() => setSingleModal(null)}
        >
          <div
            className="w-full max-w-md rounded-[1.75rem] border border-[#eadacc] bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#182638]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-serif text-2xl text-ink dark:text-white">Change Segment</h2>
            <div className="mt-5 space-y-4">
              <label className="block text-sm text-slate-600">
                <span className="mb-2 block font-medium text-ink">Student</span>
                <input
                  value={singleModal.studentName}
                  readOnly
                  className="w-full rounded-2xl border border-[#eadacc] bg-[#fff6ef] px-4 py-3"
                />
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-2 block font-medium text-ink">New Segment</span>
                <select
                  value={singleSegment}
                  onChange={(event) => setSingleSegment(event.target.value as SegmentKey)}
                  className="w-full rounded-2xl border border-[#eadacc] bg-white px-4 py-3"
                >
                  {segmentOrder.map((segment) => (
                    <option key={segment} value={segment}>
                      {getSegmentMeta(segment).label} - {getSegmentMeta(segment).description}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-2 block font-medium text-ink">Reason</span>
                <input
                  value={singleReason}
                  onChange={(event) => setSingleReason(event.target.value)}
                  placeholder="e.g. Student paid in full"
                  className="w-full rounded-2xl border border-[#eadacc] bg-white px-4 py-3"
                />
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSingleModal(null)}
                  className="rounded-2xl border border-[#eadacc] px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    void postSegmentAction(
                      {
                        action: "update_segment",
                        student_id: singleModal.studentId,
                        segment: singleSegment,
                        reason: singleReason
                      },
                      "Student segment updated successfully."
                    )
                  }
                  className="rounded-2xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {bulkOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#213343]/70 p-4 backdrop-blur-sm"
          onClick={() => setBulkOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[1.75rem] border border-[#eadacc] bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#182638]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-serif text-2xl text-ink dark:text-white">Bulk Update Segments</h2>
            <div className="mt-5 space-y-4">
              <p className="text-sm text-slate-500">
                Selected students: <span className="font-semibold text-gold">{selectedIds.length}</span>
              </p>
              <label className="block text-sm text-slate-600">
                <span className="mb-2 block font-medium text-ink">New Segment</span>
                <select
                  value={bulkSegment}
                  onChange={(event) => setBulkSegment(event.target.value as SegmentKey)}
                  className="w-full rounded-2xl border border-[#eadacc] bg-white px-4 py-3"
                >
                  {segmentOrder.map((segment) => (
                    <option key={segment} value={segment}>
                      {getSegmentMeta(segment).label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkOpen(false)}
                  className="rounded-2xl border border-[#eadacc] px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending || selectedIds.length === 0}
                  onClick={() =>
                    void postSegmentAction(
                      {
                        action: "bulk_update",
                        student_ids: selectedIds,
                        segment: bulkSegment
                      },
                      `${selectedIds.length} students updated successfully.`
                    )
                  }
                  className="rounded-2xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Update All
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

