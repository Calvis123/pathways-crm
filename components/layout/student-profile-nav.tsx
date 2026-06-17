import Link from "next/link";
import type { Route } from "next";
import { Badge } from "@/components/ui/badge";
import type { LeadTemperatureSnapshot } from "@/lib/types";

const items = [
  { key: "notes", label: "Add Interaction", href: (id: string) => `/students/${id}/notes` },
  { key: "timeline", label: "View Timeline", href: (id: string) => `/students/${id}/timeline` },
  { key: "manage", label: "Manage Interactions", href: (id: string) => `/students/${id}/notes` },
  { key: "email", label: "Email Student", href: (id: string) => `/email-center?student=${id}` }
] as const;

export function StudentProfileNav({
  studentId,
  active,
  temperature
}: {
  studentId: string;
  active: "profile" | "notes" | "timeline";
  temperature?: Pick<LeadTemperatureSnapshot, "status" | "label"> | null;
}) {
  const temperatureTone =
    temperature?.status === "hot"
      ? "bg-red-100 text-red-800 ring-1 ring-red-300 dark:bg-red-500/20 dark:text-red-100 dark:ring-red-400/40"
      : temperature?.status === "warm"
        ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-400/40"
        : "bg-amber-200 text-amber-950 ring-1 ring-amber-500 dark:bg-amber-500/30 dark:text-amber-50 dark:ring-amber-300/70";

  return (
    <div className="sticky top-2 z-20 -mx-1 overflow-x-auto pb-1">
      <nav className="inline-flex min-w-full items-center gap-2 rounded-xl border border-[#eadacc] bg-white/92 p-2 shadow-[0_12px_34px_rgba(120,75,42,0.1)] backdrop-blur dark:border-white/10 dark:bg-[#182638]/90">
        {items.map((item) => {
          const selected =
            (active === "timeline" && item.key === "timeline") ||
            (active === "notes" && (item.key === "notes" || item.key === "manage")) ||
            (active === "profile" && item.key === "notes");

          return (
            <Link
              key={item.key}
              href={item.href(studentId) as Route}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                selected
                  ? "bg-[#213343] text-white shadow-sm ring-1 ring-[#213343]/20"
                  : "bg-[#fffaf5] text-[#5f7182] ring-1 ring-[#eadacc] hover:bg-[#fff1e6] dark:bg-white/[0.05] dark:text-slate-100 dark:ring-white/10 dark:hover:bg-white/[0.09]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <div className="ml-auto pl-2">
          <Badge className={temperatureTone}>
            <span
              className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                temperature?.status === "hot"
                  ? "bg-red-600 dark:bg-red-300"
                  : temperature?.status === "warm"
                    ? "bg-emerald-600 dark:bg-emerald-300"
                    : "bg-amber-800 dark:bg-amber-100"
              }`}
            />
            {temperature?.label ?? "Cold"}
          </Badge>
        </div>
      </nav>
    </div>
  );
}
