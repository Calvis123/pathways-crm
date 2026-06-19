import { NextResponse } from "next/server";
import { getCurrentSession, isPrivilegedRole } from "@/lib/auth";
import { getAuditLogs, getUsers } from "@/lib/data";

function normalizeDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session || !isPrivilegedRole(session.role)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const filterUser = searchParams.get("filter_user") ?? "";
  const filterAction = searchParams.get("filter_action") ?? "";
  const filterTable = searchParams.get("filter_table") ?? "";
  const dateFrom = searchParams.get("date_from") ?? "";
  const dateTo = searchParams.get("date_to") ?? "";
  const search = (searchParams.get("search") ?? "").toLowerCase();

  const [logs, users] = await Promise.all([getAuditLogs(10000), getUsers()]);
  const userLookup = new Map(users.map((user) => [user.id, user]));
  const userIdsByName = new Map(
    users.flatMap((user) => [
      [user.full_name, user.id],
      [user.username, user.id]
    ])
  );

  const fromDate = normalizeDate(dateFrom ? `${dateFrom}T00:00:00` : null);
  const toDate = normalizeDate(dateTo ? `${dateTo}T23:59:59` : null);

  const filtered = logs.filter((log) => {
    const actorId = userIdsByName.get(log.actor_name ?? "");
    const createdAt = normalizeDate(log.created_at);

    if (filterUser && actorId !== filterUser) return false;
    if (filterAction && log.action !== filterAction) return false;
    if (filterTable && log.table_name !== filterTable) return false;
    if (fromDate && createdAt && createdAt < fromDate) return false;
    if (toDate && createdAt && createdAt > toDate) return false;
    if (
      search &&
      !`${log.record_label ?? ""} ${log.new_value ?? ""}`.toLowerCase().includes(search)
    ) {
      return false;
    }

    return true;
  });

  const lines = [
    ["Timestamp", "User", "Action", "Table", "Record Name", "Old Value", "New Value", "IP Address"],
    ...filtered.map((log) => [
      log.created_at,
      userLookup.get(userIdsByName.get(log.actor_name ?? "") ?? "")?.full_name ?? log.actor_name ?? "System",
      log.action,
      log.table_name,
      log.record_label ?? "",
      log.old_value ?? "",
      log.new_value ?? "",
      "N/A"
    ])
  ];

  const csv = `\uFEFF${lines
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll(`"`, `""`)}"`)
        .join(",")
    )
    .join("\n")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
