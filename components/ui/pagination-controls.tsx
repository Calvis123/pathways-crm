"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationControlsProps = {
  page: number;
  pageCount: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  label?: string;
};

export function PaginationControls({
  page,
  pageCount,
  total,
  perPage,
  onPageChange,
  label = "items"
}: PaginationControlsProps) {
  const safePage = Math.min(Math.max(page, 0), Math.max(pageCount - 1, 0));
  const start = total === 0 ? 0 : safePage * perPage + 1;
  const end = Math.min((safePage + 1) * perPage, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#eadacc] bg-[#fff6ef] px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-sm font-medium text-[#5f7182] dark:text-slate-300">
        Showing {start}-{end} of {total} {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, safePage - 1))}
          disabled={safePage === 0}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#eadacc] bg-white text-[#213343] shadow-sm transition hover:border-[#ff9a77] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          aria-label={`Previous ${label} page`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="rounded-lg border border-[#eadacc] bg-white px-3 py-2 text-sm font-semibold text-[#213343] shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white">
          {safePage + 1} / {Math.max(pageCount, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(Math.max(pageCount - 1, 0), safePage + 1))}
          disabled={safePage >= pageCount - 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#eadacc] bg-white text-[#213343] shadow-sm transition hover:border-[#ff9a77] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          aria-label={`Next ${label} page`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
