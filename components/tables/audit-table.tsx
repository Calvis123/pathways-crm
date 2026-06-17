"use client";

import Link from "next/link";
import type { AuditLog, AppUserRecord } from "@/lib/types";

type FilterState = {
  filterUser: string;
  filterAction: string;
  filterTable: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  page: number;
};

function toQueryString(filters: FilterState, overrides?: Partial<FilterState>) {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (next.filterUser) params.set("filter_user", next.filterUser);
  if (next.filterAction) params.set("filter_action", next.filterAction);
  if (next.filterTable) params.set("filter_table", next.filterTable);
  if (next.dateFrom) params.set("date_from", next.dateFrom);
  if (next.dateTo) params.set("date_to", next.dateTo);
  if (next.search) params.set("search", next.search);
  if (next.page > 1) params.set("page", String(next.page));

  return params.toString();
}

function actionTone(action: string) {
  const normalized = action.toLowerCase();
  if (normalized.includes("payment")) return "bg-emerald-100 text-emerald-800";
  if (normalized.includes("status") || normalized.includes("stage")) return "bg-sky-100 text-sky-800";
  if (normalized.includes("create") || normalized.includes("add")) return "bg-emerald-100 text-emerald-800";
  if (normalized.includes("delete")) return "bg-rose-100 text-rose-800";
  if (normalized.includes("update") || normalized.includes("change")) return "bg-amber-100 text-amber-800";
  return "bg-slate-200 text-slate-700";
}

function truncate(value: string | null, limit = 100) {
  if (!value) return null;
  return value.length > limit ? `${value.slice(0, limit)}...` : value;
}

export function AuditTable({
  logs,
  totalLogs,
  totalPages,
  page,
  filters,
  users,
  actionTypes,
  tables,
  stats
}: {
  logs: AuditLog[];
  totalLogs: number;
  totalPages: number;
  page: number;
  filters: FilterState;
  users: AppUserRecord[];
  actionTypes: string[];
  tables: string[];
  stats: {
    todayCount: number;
    weekCount: number;
    topUser: string;
    topAction: string;
  };
}) {
  const exportHref = `/api/audit/export?${toQueryString(filters)}`;

  return (
    <section className="rounded-xl border border-[#eadacc] bg-white shadow-panel dark:border-white/10 dark:bg-[#182638]">
      <div className="flex flex-col gap-4 border-b border-gold/20 bg-[linear-gradient(135deg,#213343,#3f5a68)] px-8 py-6 text-white dark:border-white/10 dark:bg-[linear-gradient(135deg,#213343,#3f5a68)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl">Audit Log</h1>
          <p className="mt-2 text-sm text-white/70">
            System activity tracker for critical actions and accountability.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={exportHref}
            className="inline-flex rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Export CSV
          </a>
          <Link
            href="/"
            className="inline-flex rounded-2xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="space-y-6 px-8 py-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Actions Today" value={String(stats.todayCount)} />
          <MetricCard label="Actions This Week" value={String(stats.weekCount)} />
          <MetricCard label="Most Active User" value={stats.topUser} />
          <MetricCard label="Top Action" value={stats.topAction} />
        </div>

        <section className="rounded-xl border border-[#eadacc] bg-white p-6 dark:border-white/10 dark:bg-white/[0.05]">
          <h2 className="mb-5 font-serif text-2xl text-ink dark:text-white">Filter Logs</h2>
          <form method="GET" action="/audit" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="text-sm text-slate-600">
                <span className="mb-2 block font-medium text-ink dark:text-white">Date From</span>
                <input
                  type="date"
                  name="date_from"
                  defaultValue={filters.dateFrom}
                  className="w-full rounded-xl border border-[#eadacc] bg-[#fff6ef] px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:[color-scheme:dark]"
                />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-2 block font-medium text-ink dark:text-white">Date To</span>
                <input
                  type="date"
                  name="date_to"
                  defaultValue={filters.dateTo}
                  className="w-full rounded-xl border border-[#eadacc] bg-[#fff6ef] px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:[color-scheme:dark]"
                />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-2 block font-medium text-ink dark:text-white">User</span>
                <select
                  name="filter_user"
                  defaultValue={filters.filterUser}
                  className="w-full rounded-xl border border-[#eadacc] bg-[#fff6ef] px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.username}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-2 block font-medium text-ink dark:text-white">Action Type</span>
                <select
                  name="filter_action"
                  defaultValue={filters.filterAction}
                  className="w-full rounded-xl border border-[#eadacc] bg-[#fff6ef] px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                >
                  <option value="">All Actions</option>
                  {actionTypes.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-2 block font-medium text-ink dark:text-white">Table</span>
                <select
                  name="filter_table"
                  defaultValue={filters.filterTable}
                  className="w-full rounded-xl border border-[#eadacc] bg-[#fff6ef] px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                >
                  <option value="">All Tables</option>
                  {tables.map((table) => (
                    <option key={table} value={table}>
                      {table}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-2 block font-medium text-ink dark:text-white">Search</span>
                <input
                  type="text"
                  name="search"
                  defaultValue={filters.search}
                  placeholder="Search records..."
                  className="w-full rounded-xl border border-[#eadacc] bg-[#fff6ef] px-4 py-3 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-400"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white"
              >
                Apply Filters
              </button>
              <Link
                href="/audit"
                className="inline-flex rounded-xl border border-[#eadacc] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#fff6ef] dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.06]"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-[#eadacc] bg-white p-6 dark:border-white/10 dark:bg-white/[0.05]">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-serif text-2xl text-ink dark:text-white">Activity Log</h2>
            <p className="text-sm text-slate-500">
              Showing {logs.length} of {totalLogs} entries
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#eadacc] dark:border-white/10">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[linear-gradient(135deg,#213343,#3f5a68)] text-left text-xs uppercase tracking-[0.08em] text-white">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Record</th>
                  <th className="px-4 py-3">Changes</th>
                  <th className="px-4 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-sm text-slate-500">
                      No audit logs found matching your filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-[#f0dfd0] align-top hover:bg-gold/5">
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {new Date(log.created_at).toLocaleString("en-KE", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-ink dark:text-white">{log.actor_name ?? "System"}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${actionTone(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="font-medium text-ink dark:text-white">{log.record_label ?? "N/A"}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {log.table_name} {log.related_id ? `#${log.related_id}` : ""}
                        </div>
                      </td>
                      <td className="max-w-[320px] px-4 py-4 text-xs">
                        {log.old_value || log.new_value ? (
                          <div className="space-y-2">
                            {log.old_value ? <div className="text-rose-700">{truncate(log.old_value)}</div> : null}
                            {log.new_value ? <div className="text-emerald-700">{truncate(log.new_value)}</div> : null}
                          </div>
                        ) : (
                          <span className="italic text-slate-400">No details</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400">N/A</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {page > 1 ? (
                <Link
                  href={`/audit?${toQueryString(filters, { page: page - 1 })}`}
                  className="rounded-xl border border-[#eadacc] px-4 py-2 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200"
                >
                  Previous
                </Link>
              ) : null}

              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter((pageNumber) => pageNumber === 1 || pageNumber === totalPages || (pageNumber >= page - 2 && pageNumber <= page + 2))
                .map((pageNumber, index, visiblePages) => (
                  <span key={pageNumber} className="contents">
                    {index > 0 && visiblePages[index - 1] !== pageNumber - 1 ? (
                      <span className="px-2 text-sm text-slate-400">...</span>
                    ) : null}
                    {pageNumber === page ? (
                      <span className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-ink">{pageNumber}</span>
                    ) : (
                      <Link
                        href={`/audit?${toQueryString(filters, { page: pageNumber })}`}
                        className="rounded-xl border border-[#eadacc] px-4 py-2 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200"
                      >
                        {pageNumber}
                      </Link>
                    )}
                  </span>
                ))}

              {page < totalPages ? (
                <Link
                  href={`/audit?${toQueryString(filters, { page: page + 1 })}`}
                  className="rounded-xl border border-[#eadacc] px-4 py-2 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200"
                >
                  Next
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#eadacc] bg-white p-5 dark:border-white/10 dark:bg-white/[0.05]">
      <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-extrabold text-ink dark:text-white">{value}</p>
    </div>
  );
}
