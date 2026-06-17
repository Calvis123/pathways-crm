"use client";

import { Button } from "@/components/ui/button";

type ViewMode = "list" | "bulk" | "individual";
type QuickFilter = "all" | "urgent" | "new" | "unpaid";

type ReportStage = {
  key: string;
  name: string;
  icon: string;
};

function buildHref({
  view,
  stage,
  dateFrom,
  dateTo,
  quickFilter,
  studentId,
  range
}: {
  view: ViewMode;
  stage: string;
  dateFrom: string;
  dateTo: string;
  quickFilter?: QuickFilter;
  studentId?: string;
  range?: string;
}) {
  const params = new URLSearchParams({
    view,
    stage
  });

  if (dateFrom) {
    params.set("date_from", dateFrom);
  }

  if (dateTo) {
    params.set("date_to", dateTo);
  }

  if (quickFilter && quickFilter !== "all") {
    params.set("quick_filter", quickFilter);
  }

  if (studentId) {
    params.set("student_id", studentId);
  }

  if (range) {
    params.set("range", range);
  }

  return `/progress-reports?${params.toString()}`;
}

export function ProgressReportControls({
  stages,
  stageFilter,
  view,
  dateFrom,
  dateTo,
  quickFilter,
  showQuickFilter,
  studentId,
  renderPrintButton = true,
  renderFilters = true
}: {
  stages: ReportStage[];
  stageFilter: string;
  view: ViewMode;
  dateFrom: string;
  dateTo: string;
  quickFilter: QuickFilter;
  showQuickFilter: boolean;
  studentId?: string;
  renderPrintButton?: boolean;
  renderFilters?: boolean;
}) {
  const navigate = (href: string) => {
    window.location.assign(href);
  };

  return (
    <>
      {renderPrintButton ? (
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => window.print()}>
            Print / Save PDF
          </Button>
        </div>
      ) : null}

      {renderFilters ? (
        <div className="flex flex-wrap items-end gap-4 border-b border-[#eadacc] bg-[#fff6ef] px-8 py-6 dark:border-white/10 dark:bg-white/[0.04]">
          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Stage</span>
            <select
            value={stageFilter}
            onChange={(event) => {
              navigate(
                buildHref({
                  view,
                  stage: event.target.value,
                    dateFrom,
                    dateTo,
                    quickFilter,
                    studentId
                  })
                );
              }}
              className="rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
            >
              {stages.map((stage) => (
                <option key={stage.key} value={stage.key}>
                  {stage.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">From</span>
            <input
            type="date"
            value={dateFrom === "all" ? "" : dateFrom}
            onChange={(event) => {
              navigate(
                buildHref({
                  view,
                  stage: stageFilter,
                    dateFrom: event.target.value || "all",
                    dateTo,
                    quickFilter,
                    studentId
                  })
                );
              }}
              className="rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:[color-scheme:dark]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">To</span>
            <input
            type="date"
            value={dateTo === "all" ? "" : dateTo}
            onChange={(event) => {
              navigate(
                buildHref({
                  view,
                  stage: stageFilter,
                    dateFrom,
                    dateTo: event.target.value || "all",
                    quickFilter,
                    studentId
                  })
                );
              }}
              className="rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:[color-scheme:dark]"
            />
          </label>

          <div className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Quick Range</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    buildHref({
                      view,
                      stage: stageFilter,
                      dateFrom: "all",
                      dateTo: "all",
                      quickFilter,
                      studentId
                    })
                  )
                }
                className="rounded-xl border border-[#eadacc] bg-white px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    buildHref({
                      view,
                      stage: stageFilter,
                      dateFrom,
                      dateTo,
                      quickFilter,
                      studentId,
                      range: "30"
                    })
                  )
                }
                className="rounded-xl border border-[#eadacc] bg-white px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    buildHref({
                      view,
                      stage: stageFilter,
                      dateFrom,
                      dateTo,
                      quickFilter,
                      studentId,
                      range: "90"
                    })
                  )
                }
                className="rounded-xl border border-[#eadacc] bg-white px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
              >
                90 Days
              </button>
            </div>
          </div>

          {showQuickFilter ? (
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              <span className="font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Quick Filter</span>
              <select
                value={quickFilter}
                onChange={(event) => {
                  navigate(
                    buildHref({
                      view,
                      stage: stageFilter,
                      dateFrom,
                      dateTo,
                      quickFilter: event.target.value as QuickFilter,
                      studentId
                    })
                  );
                }}
                className="rounded-xl border border-[#eadacc] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              >
                <option value="all">All Students</option>
                <option value="urgent">Urgent Follow-up</option>
                <option value="new">New Today</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </label>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
