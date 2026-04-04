import { AuditTable } from "@/components/tables/audit-table";
import { getAuditLogs, getUsers } from "@/lib/data";

function normalizeDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default async function AuditPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filterUser = Array.isArray(resolvedSearchParams.filter_user)
    ? resolvedSearchParams.filter_user[0] ?? ""
    : resolvedSearchParams.filter_user ?? "";
  const filterAction = Array.isArray(resolvedSearchParams.filter_action)
    ? resolvedSearchParams.filter_action[0] ?? ""
    : resolvedSearchParams.filter_action ?? "";
  const filterTable = Array.isArray(resolvedSearchParams.filter_table)
    ? resolvedSearchParams.filter_table[0] ?? ""
    : resolvedSearchParams.filter_table ?? "";
  const dateFrom = Array.isArray(resolvedSearchParams.date_from)
    ? resolvedSearchParams.date_from[0] ?? ""
    : resolvedSearchParams.date_from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dateTo = Array.isArray(resolvedSearchParams.date_to)
    ? resolvedSearchParams.date_to[0] ?? ""
    : resolvedSearchParams.date_to ?? new Date().toISOString().slice(0, 10);
  const search = Array.isArray(resolvedSearchParams.search)
    ? resolvedSearchParams.search[0] ?? ""
    : resolvedSearchParams.search ?? "";
  const page = Math.max(
    1,
    Number.parseInt(
      Array.isArray(resolvedSearchParams.page) ? resolvedSearchParams.page[0] ?? "1" : resolvedSearchParams.page ?? "1",
      10
    ) || 1
  );

  const [allLogs, users] = await Promise.all([getAuditLogs(10000), getUsers()]);

  const actionCounts = new Map<string, number>();
  const userCounts = new Map<string, number>();
  const now = new Date();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let todayCount = 0;
  let weekCount = 0;

  for (const log of allLogs) {
    const createdAt = normalizeDate(log.created_at);
    if (createdAt) {
      if (createdAt.toDateString() === now.toDateString()) {
        todayCount += 1;
      }
      if (createdAt >= weekAgo) {
        weekCount += 1;
      }
    }

    const actor = log.actor_name ?? "System";
    userCounts.set(actor, (userCounts.get(actor) ?? 0) + 1);
    actionCounts.set(log.action, (actionCounts.get(log.action) ?? 0) + 1);
  }

  const topUser =
    Array.from(userCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
  const topAction =
    Array.from(actionCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  const userIdsByName = new Map(
    users.flatMap((user) => [
      [user.full_name, user.id],
      [user.username, user.id]
    ])
  );

  const fromDate = normalizeDate(`${dateFrom}T00:00:00`);
  const toDate = normalizeDate(`${dateTo}T23:59:59`);
  const normalizedSearch = search.toLowerCase();

  const filteredLogs = allLogs.filter((log) => {
    const actorId = userIdsByName.get(log.actor_name ?? "");
    const createdAt = normalizeDate(log.created_at);

    if (filterUser && actorId !== filterUser) return false;
    if (filterAction && log.action !== filterAction) return false;
    if (filterTable && log.table_name !== filterTable) return false;
    if (fromDate && createdAt && createdAt < fromDate) return false;
    if (toDate && createdAt && createdAt > toDate) return false;
    if (
      normalizedSearch &&
      !`${log.record_label ?? ""} ${log.new_value ?? ""}`.toLowerCase().includes(normalizedSearch)
    ) {
      return false;
    }

    return true;
  });

  const totalLogs = filteredLogs.length;
  const perPage = 50;
  const totalPages = Math.max(1, Math.ceil(totalLogs / perPage));
  const safePage = Math.min(page, totalPages);
  const paginatedLogs = filteredLogs.slice((safePage - 1) * perPage, safePage * perPage);
  const actionTypes = Array.from(new Set(allLogs.map((log) => log.action))).sort((a, b) => a.localeCompare(b));
  const tables = Array.from(new Set(allLogs.map((log) => log.table_name))).sort((a, b) => a.localeCompare(b));

  return (
    <AuditTable
      logs={paginatedLogs}
      totalLogs={totalLogs}
      totalPages={totalPages}
      page={safePage}
      filters={{
        filterUser,
        filterAction,
        filterTable,
        dateFrom,
        dateTo,
        search,
        page: safePage
      }}
      users={users}
      actionTypes={actionTypes}
      tables={tables}
      stats={{
        todayCount,
        weekCount,
        topUser,
        topAction
      }}
    />
  );
}
