"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus2, CheckCircle2, MessageCircleMore, NotebookPen } from "lucide-react";
import type { Consultation, Student } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/ui/pagination-controls";

const tones: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-1 dark:ring-amber-400/20",
  confirmed:
    "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-1 dark:ring-sky-400/20",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-1 dark:ring-emerald-400/20",
  cancelled:
    "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-1 dark:ring-rose-400/20"
};

const filters = ["all", "pending", "confirmed", "completed", "cancelled"] as const;
const ITEMS_PER_PAGE = 10;

export function ConsultationsManager({
  consultations,
  students
}: {
  consultations: Consultation[];
  students: Student[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const items = useMemo(() => {
    const sorted = [...consultations].sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
    if (filter === "all") return sorted;
    return sorted.filter((consultation) => consultation.status === filter);
  }, [consultations, filter]);
  const pageCount = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const paginatedItems = items.slice(safePage * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  const studentOptions = useMemo(
    () =>
      [...students]
        .sort((a, b) => a.full_name.localeCompare(b.full_name))
        .map((student) => ({
          id: student.id,
          label: `${student.full_name} · ${student.email}`,
          stage: student.stage
        })),
    [students]
  );

  function resetMessages() {
    setStatusMessage(null);
    setErrorMessage(null);
  }

  function runRefresh(message: string) {
    setStatusMessage(message);
    router.refresh();
  }

  function scheduleConsultation(formData: FormData) {
    resetMessages();

    startTransition(async () => {
      const studentId = String(formData.get("student_id") ?? "");
      const date = String(formData.get("scheduled_date") ?? "");
      const time = String(formData.get("scheduled_time") ?? "");
      const notes = String(formData.get("notes") ?? "").trim();

      if (!studentId || !date || !time) {
        setErrorMessage("Please choose a student, date, and time.");
        return;
      }

      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          scheduled_at: new Date(`${date}T${time}`).toISOString(),
          notes: notes || undefined
        })
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setErrorMessage(body?.error ?? "Could not schedule consultation.");
        return;
      }

      runRefresh("Consultation scheduled successfully.");
    });
  }

  function updateConsultation(id: string, payload: { status?: Consultation["status"]; append_note?: string }) {
    resetMessages();

    startTransition(async () => {
      const response = await fetch(`/api/consultations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setErrorMessage(body?.error ?? "Could not update consultation.");
        return;
      }

      runRefresh("Consultation updated.");
    });
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {errorMessage}
        </div>
      ) : null}
      {statusMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          {statusMessage}
        </div>
      ) : null}

      <Card className="border-[#e8d7c6] bg-[linear-gradient(135deg,#fffaf4_0%,#fff2e6_100%)] dark:border-white/10 dark:bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))]">
        <CardHeader
          title="Admin Consultation Scheduling"
          description="Create and control consultation bookings directly from live CRM records as the admin scheduling desk."
        />
        <form action={scheduleConsultation} className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-2 block font-medium text-ink dark:text-white">Student</span>
            <select
              name="student_id"
              required
              className="w-full rounded-lg border border-[#e4d3c4] bg-white px-4 py-3 text-[#213343] outline-none transition focus:border-[#ff9a7a] focus:ring-2 focus:ring-[#ff9a7a]/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-[#ff9a7a] dark:focus:ring-[#ff9a7a]/20"
              defaultValue=""
            >
              <option value="" disabled>
                Select student
              </option>
              {studentOptions.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-2 block font-medium text-ink dark:text-white">Date</span>
            <input
              type="date"
              name="scheduled_date"
              required
              className="w-full rounded-lg border border-[#e4d3c4] bg-white px-4 py-3 text-[#213343] outline-none transition focus:border-[#ff9a7a] focus:ring-2 focus:ring-[#ff9a7a]/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:[color-scheme:dark] dark:focus:border-[#ff9a7a] dark:focus:ring-[#ff9a7a]/20"
            />
          </label>

          <label className="block text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-2 block font-medium text-ink dark:text-white">Time</span>
            <input
              type="time"
              name="scheduled_time"
              required
              className="w-full rounded-lg border border-[#e4d3c4] bg-white px-4 py-3 text-[#213343] outline-none transition focus:border-[#ff9a7a] focus:ring-2 focus:ring-[#ff9a7a]/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:[color-scheme:dark] dark:focus:border-[#ff9a7a] dark:focus:ring-[#ff9a7a]/20"
            />
          </label>

          <label className="block text-sm text-slate-600 dark:text-slate-300 lg:col-span-3">
            <span className="mb-2 block font-medium text-ink dark:text-white">Internal Notes</span>
            <textarea
              name="notes"
              rows={3}
              placeholder="Add prep notes, agenda, or follow-up context..."
              className="w-full rounded-lg border border-[#e4d3c4] bg-white px-4 py-3 text-[#213343] outline-none transition focus:border-[#ff9a7a] focus:ring-2 focus:ring-[#ff9a7a]/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-400 dark:focus:border-[#ff9a7a] dark:focus:ring-[#ff9a7a]/20"
            />
          </label>

          <div className="lg:col-span-3">
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[linear-gradient(135deg,#ff7a59,#ef6b49)] px-5 py-3 text-white"
            >
              <CalendarPlus2 className="mr-2 h-4 w-4" />
              {isPending ? "Saving..." : "Schedule Consultation"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94))]">
        <CardHeader
          title="Admin Consultation Queue"
          description="Review all consultation activity, confirm sessions, complete or cancel cases, and keep executive notes in one place."
        />

        <div className="mb-5 flex flex-wrap gap-2">
          {filters.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === value
                  ? "bg-ink text-white dark:bg-[#ff7a59] dark:text-white dark:shadow-[0_10px_30px_rgba(255,122,89,0.25)]"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d9c1ad] bg-[#fffaf5] px-6 py-12 text-center dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-lg font-medium text-ink dark:text-white">No consultations in this view</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Schedule a new consultation above or switch the filter to review another part of the queue.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.length > ITEMS_PER_PAGE ? (
              <div className="lg:col-span-2">
                <PaginationControls
                  page={safePage}
                  pageCount={pageCount}
                  total={items.length}
                  perPage={ITEMS_PER_PAGE}
                  onPageChange={setPage}
                  label="consultations"
                />
              </div>
            ) : null}
            {paginatedItems.map((consultation) => (
              <div
                key={consultation.id}
                className="rounded-xl border border-[#eadacc] bg-[#fffaf5] p-5 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink dark:text-white">
                      {consultation.student?.full_name ?? consultation.student_id}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{consultation.student?.email ?? "No email"}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{consultation.student?.phone ?? "No phone"}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                      Stage: {consultation.student?.stage ?? "Unknown"}
                    </p>
                  </div>
                  <Badge className={tones[consultation.status]}>{consultation.status}</Badge>
                </div>

                <p className="mt-4 text-sm text-slate-600 dark:text-slate-200">
                  Scheduled for {formatDate(consultation.scheduled_at, { timeStyle: "short" })}
                </p>
                {consultation.notes ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500 dark:text-slate-300">{consultation.notes}</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">No notes yet.</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {consultation.status === "pending" ? (
                    <Button
                      type="button"
                      disabled={isPending}
                      onClick={() => updateConsultation(consultation.id, { status: "confirmed" })}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirm
                    </Button>
                  ) : null}

                  {consultation.status === "confirmed" ? (
                    <Button
                      type="button"
                      disabled={isPending}
                      onClick={() => updateConsultation(consultation.id, { status: "completed" })}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Complete
                    </Button>
                  ) : null}

                  {consultation.status !== "completed" && consultation.status !== "cancelled" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => updateConsultation(consultation.id, { status: "cancelled" })}
                    >
                      Cancel
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => {
                      const note = window.prompt("Add a consultation note");
                      if (note) void updateConsultation(consultation.id, { append_note: note });
                    }}
                  >
                    <NotebookPen className="mr-2 h-4 w-4" />
                    Add Note
                  </Button>

                  {consultation.student?.phone ? (
                    <a
                      href={`https://wa.me/${consultation.student.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,211,102,0.25)]"
                    >
                      <MessageCircleMore className="mr-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
