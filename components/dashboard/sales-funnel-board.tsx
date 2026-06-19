"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  airplaneOutline,
  briefcaseOutline,
  chatbubbleEllipsesOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeCircleOutline,
  documentTextOutline,
  eyeOutline,
  personOutline,
  ribbonOutline,
  schoolOutline
} from "ionicons/icons";
import { CONSULTATION_FEE, getConsultationPaid } from "@/lib/finance";
import { stageLabels } from "@/lib/constants";
import { readJsonBody } from "@/lib/http";
import type { LeadTemperatureSnapshot, Student, StudentStage } from "@/lib/types";
import { formatCurrency, formatDate, normalizeKenyanPhone } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IonIcon } from "@/components/ui/ion-icon";

const funnelStages: Array<{
  id: StudentStage;
  name: string;
  icon: string;
  color: string;
  description: string;
}> = [
  { id: "lead", name: "Lead", icon: personOutline, color: "#6B7280", description: "Fresh prospects" },
  { id: "qualified", name: "Qualified", icon: eyeOutline, color: "#64748B", description: "Fit, funds, and intent checked" },
  { id: "inquiry", name: "Inquiry", icon: eyeOutline, color: "#8B5CF6", description: "Initial conversations" },
  { id: "engaged", name: "Engaged", icon: chatbubbleEllipsesOutline, color: "#14B8A6", description: "Agreement and deposit in progress" },
  { id: "consultation", name: "Consultation", icon: chatbubbleEllipsesOutline, color: "#0EA5E9", description: "Meeting scheduled or completed" },
  { id: "application_ready", name: "Application Ready", icon: documentTextOutline, color: "#0284C7", description: "Documents ready for application" },
  { id: "application", name: "Application", icon: documentTextOutline, color: "#2563EB", description: "Application in progress" },
  { id: "submitted", name: "Submitted", icon: documentTextOutline, color: "#1D4ED8", description: "Application lodged" },
  { id: "offer_secured", name: "Offer Secured", icon: ribbonOutline, color: "#7C3AED", description: "Offer received and explained" },
  { id: "visa", name: "Visa", icon: airplaneOutline, color: "#DB2777", description: "Visa processing" },
  { id: "visa_lodged", name: "Visa Lodged", icon: airplaneOutline, color: "#BE185D", description: "Visa submitted with evidence pack" },
  { id: "enrolled", name: "Enrolled", icon: schoolOutline, color: "#10B981", description: "Student enrolled" },
  { id: "placed", name: "Placed", icon: ribbonOutline, color: "#059669", description: "Placement confirmed" },
  { id: "employment", name: "Employment", icon: briefcaseOutline, color: "#6366F1", description: "Post-study employment" },
  { id: "lost", name: "Lost", icon: closeCircleOutline, color: "#EF4444", description: "Not proceeding" }
];

const temperatureTone: Record<LeadTemperatureSnapshot["status"], string> = {
  cold: "bg-yellow-100 text-yellow-800 ring-yellow-200",
  warm: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  hot: "bg-red-100 text-red-800 ring-red-200"
};

const FUNNEL_ITEMS_PER_PAGE = 10;

function getPotentialValue(student: Student) {
  if (student.payment_status === "full" || student.payment_status === "paid") return CONSULTATION_FEE;
  return getConsultationPaid(student);
}

function getWhatsappLink(student: Student) {
  const phone = student.phone ? normalizeKenyanPhone(student.phone) : null;
  if (!phone) return null;
  const message = encodeURIComponent(`Hello ${student.full_name}, I am contacting you from Barak Pathways.`);
  return `https://wa.me/${phone.replace("+", "")}?text=${message}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatStage(stage: StudentStage) {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

export function SalesFunnelBoard({
  students,
  initialTemperatures
}: {
  students: Student[];
  initialTemperatures: LeadTemperatureSnapshot[];
}) {
  const [items, setItems] = useState(students);
  const [temperatures, setTemperatures] = useState(initialTemperatures);
  const [selectedStage, setSelectedStage] = useState<StudentStage>("lead");
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");

  const temperatureMap = useMemo(
    () => new Map(temperatures.map((entry) => [entry.studentId, entry])),
    [temperatures]
  );

  const refreshTemperatures = useCallback(async () => {
    const response = await fetch("/api/leads/temperature", { cache: "no-store" });
    if (!response.ok) return;
    const body = await readJsonBody<{ temperatures?: LeadTemperatureSnapshot[] }>(response);
    if (Array.isArray(body?.temperatures)) {
      setTemperatures(body.temperatures);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void refreshTemperatures();
    }, 15000);
    return () => clearInterval(timer);
  }, [refreshTemperatures]);

  const metrics = useMemo(() => {
    const totalPipeline = items.reduce((sum, student) => sum + getPotentialValue(student), 0);
    const activeDeals = items.filter((student) => student.stage !== "lost").length;
    const wonThisMonth = items.filter((student) => {
      const updatedAt = new Date(student.updated_at);
      const now = new Date();
      return student.stage === "enrolled" && updatedAt.getMonth() === now.getMonth() && updatedAt.getFullYear() === now.getFullYear();
    }).length;
    const hotLeads = temperatures.filter((item) => item.status === "hot").length;
    const warmLeads = temperatures.filter((item) => item.status === "warm").length;
    const coldLeads = temperatures.filter((item) => item.status === "cold").length;

    return {
      totalStudents: items.length,
      totalPipeline,
      activeDeals,
      wonThisMonth,
      hotLeads,
      warmLeads,
      coldLeads
    };
  }, [items, temperatures]);

  const grouped = useMemo(() => {
    const groups = funnelStages.map((stage) => {
      const stageStudents = items.filter((student) => student.stage === stage.id);
      const value = stageStudents.reduce((sum, student) => sum + getPotentialValue(student), 0);
      return {
        ...stage,
        students: stageStudents,
        count: stageStudents.length,
        value
      };
    });

    let previousCount = items.length;
    return groups.map((group) => {
      const conversion = previousCount > 0 ? Math.round((group.count / previousCount) * 1000) / 10 : 0;
      previousCount = group.count;
      return { ...group, conversion };
    });
  }, [items]);

  const selectedGroup = grouped.find((group) => group.id === selectedStage) ?? grouped[0];
  const selectedPageCount = Math.max(1, Math.ceil(selectedGroup.students.length / FUNNEL_ITEMS_PER_PAGE));
  const selectedPage = Math.min(page, selectedPageCount - 1);
  const visibleStudents = selectedGroup.students.slice(
    selectedPage * FUNNEL_ITEMS_PER_PAGE,
    selectedPage * FUNNEL_ITEMS_PER_PAGE + FUNNEL_ITEMS_PER_PAGE
  );

  useEffect(() => {
    setPage(0);
  }, [selectedStage]);

  function changeSelectedPage(direction: -1 | 1) {
    setPage((current) => Math.min(selectedPageCount - 1, Math.max(0, current + direction)));
  }

  async function moveStudent(studentId: string, newStage: StudentStage) {
    const student = items.find((entry) => entry.id === studentId);
    if (!student || student.stage === newStage) return;

    const previous = items;
    setItems((current) =>
      current.map((entry) =>
        entry.id === studentId ? { ...entry, stage: newStage, updated_at: new Date().toISOString() } : entry
      )
    );
    setStatus(`Moving ${student.full_name} to ${formatStage(newStage)}...`);

    const response = await fetch(`/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage })
    });

    if (!response.ok) {
      setItems(previous);
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus(body?.error ?? "Could not update stage.");
      return;
    }

    setStatus(`${student.full_name} moved to ${formatStage(newStage)}.`);
    void refreshTemperatures();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-[#eadacc] bg-[linear-gradient(135deg,#284152,#5f766f)] text-white dark:border-white/10 dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)]">
          <p className="text-sm text-white/75">Total Students</p>
          <p className="mt-3 text-3xl font-semibold">{metrics.totalStudents}</p>
          <p className="mt-2 text-sm text-white/65">All registered students</p>
        </Card>
        <Card className="border-gold/30 bg-gold/10 dark:border-[#50343a] dark:bg-[linear-gradient(180deg,#2a2130_0%,#1f2435_100%)]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Pipeline Value</p>
          <p className="mt-3 text-3xl font-semibold text-ink dark:text-white">{formatCurrency(metrics.totalPipeline)}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Across all stages</p>
        </Card>
        <Card className="border-[#eadacc] dark:border-white/10 dark:bg-[linear-gradient(180deg,#1b263c_0%,#141f33_100%)]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Active Deals</p>
          <p className="mt-3 text-3xl font-semibold text-ink dark:text-white">{metrics.activeDeals}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Excluding lost</p>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-500/15 dark:bg-[linear-gradient(180deg,#152a24_0%,#10231f_100%)]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Won This Month</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-700 dark:text-emerald-300">{metrics.wonThisMonth}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Students enrolled</p>
        </Card>
        <Card className="border-[#eadacc] dark:border-white/10 dark:bg-[linear-gradient(180deg,#1b263c_0%,#141f33_100%)]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Lead Temperature</p>
          <p className="mt-3 text-xl font-semibold text-ink dark:text-white">
            Hot {metrics.hotLeads} / Warm {metrics.warmLeads} / Cold {metrics.coldLeads}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Auto-scored by recency</p>
        </Card>
      </div>

      <section className="rounded-xl border border-[#eadacc] bg-white p-4 shadow-[0_14px_42px_rgba(120,75,42,0.08)] dark:border-white/10 dark:bg-[#182638]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#213343] dark:text-white">Funnel Categories</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Choose a category and review its students using the same structured record view as the student page.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b5e3c]" htmlFor="sales-stage">
              Category
            </label>
            <select
              id="sales-stage"
              value={selectedStage}
              onChange={(event) => setSelectedStage(event.target.value as StudentStage)}
              className="h-11 min-w-[230px] rounded-lg border border-[#eadacc] bg-white px-3 text-sm font-semibold text-[#213343] shadow-sm outline-none transition focus:border-[#ff9a77] focus:ring-4 focus:ring-[#ff7a59]/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              {grouped.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name} ({stage.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {grouped.map((stage) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => setSelectedStage(stage.id)}
              className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                selectedStage === stage.id
                  ? "border-[#213343] bg-[#213343] text-white"
                  : "border-[#eadacc] bg-[#fffaf5] text-[#5f7182] hover:bg-[#fff1e6] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
              }`}
            >
              {stageLabels[stage.id]} {stage.count}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 bg-[#fff6ef] p-4 sm:grid-cols-2 xl:grid-cols-4 dark:bg-white/[0.03]">
          {[
            { label: "Selected Category", value: selectedGroup.name, detail: selectedGroup.description },
            { label: "Records", value: selectedGroup.count, detail: `${selectedGroup.count} in ${selectedGroup.name}` },
            { label: "Value", value: formatCurrency(selectedGroup.value), detail: "Potential consultation value" },
            { label: "Conversion", value: selectedGroup.id === "lead" ? "Base" : `${selectedGroup.conversion}%`, detail: "From previous stage" }
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-[#eadacc] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="mt-3 truncate text-2xl font-semibold text-[#213343] dark:text-white">{item.value}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#eadacc] bg-white shadow-[0_14px_42px_rgba(120,75,42,0.08)] dark:border-white/10 dark:bg-[#182638]">
        <div className="flex flex-col gap-3 border-b border-[#eadacc] bg-[#fff6ef] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#8b5e3c]">{selectedGroup.name} Records</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              {selectedGroup.count === 0
                ? "No students in this category"
                : `Showing ${selectedPage * FUNNEL_ITEMS_PER_PAGE + 1}-${Math.min((selectedPage + 1) * FUNNEL_ITEMS_PER_PAGE, selectedGroup.count)} of ${selectedGroup.count}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/progress-reports?stage=${selectedGroup.id}`}
              className="rounded-lg border border-[#eadacc] bg-white px-3 py-2 text-sm font-semibold text-[#213343] shadow-sm transition hover:border-[#ff9a77] dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              View report
            </Link>
            <button
              type="button"
              onClick={() => changeSelectedPage(-1)}
              disabled={selectedPage === 0}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#eadacc] bg-white text-[#213343] shadow-sm transition hover:border-[#ff9a77] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
              aria-label={`Previous ${selectedGroup.name} page`}
            >
              <IonIcon icon={chevronBackOutline} className="h-4 w-4" />
            </button>
            <span className="rounded-lg border border-[#eadacc] bg-white px-3 py-2 text-sm font-semibold text-[#213343] shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white">
              {selectedPage + 1} / {selectedPageCount}
            </span>
            <button
              type="button"
              onClick={() => changeSelectedPage(1)}
              disabled={selectedPage >= selectedPageCount - 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#eadacc] bg-white text-[#213343] shadow-sm transition hover:border-[#ff9a77] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
              aria-label={`Next ${selectedGroup.name} page`}
            >
              <IonIcon icon={chevronForwardOutline} className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="hidden grid-cols-[minmax(280px,1.5fr)_140px_150px_150px_190px_130px] gap-4 border-b border-[#eadacc] bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#8b5e3c] lg:grid dark:bg-white/[0.03]">
          <div>Student</div>
          <div>Temperature</div>
          <div>Market</div>
          <div>Paid</div>
          <div>Move Stage</div>
          <div>Updated</div>
        </div>

        <div className="divide-y divide-[#f0dfd0] dark:divide-white/10">
          {visibleStudents.map((student) => {
            const paid = getConsultationPaid(student);
            const whatsappLink = getWhatsappLink(student);
            const temperature = temperatureMap.get(student.id);
            const initials = getInitials(student.full_name) || "BP";

            return (
              <article
                key={student.id}
                className="grid gap-4 px-5 py-4 transition hover:bg-[#fffaf5] dark:hover:bg-white/[0.04] lg:grid-cols-[minmax(280px,1.5fr)_140px_150px_150px_190px_130px] lg:items-center"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#31424a,#516672)] text-sm font-semibold text-white shadow-sm">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/students/${student.id}`} className="font-semibold text-[#213343] underline-offset-4 hover:underline dark:text-white">
                      {student.full_name}
                    </Link>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-300">{student.email}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {student.phone ?? "No phone"} | {student.lead_source ?? "Unknown source"}
                    </p>
                    <div className="mt-2 flex gap-3 text-xs font-medium">
                      {whatsappLink ? (
                        <a href={whatsappLink} target="_blank" rel="noreferrer" className="text-emerald-600 underline-offset-4 hover:underline">
                          WhatsApp
                        </a>
                      ) : null}
                      <Link href={`/students/${student.id}/timeline`} className="text-[#c9692c] underline-offset-4 hover:underline">
                        Timeline
                      </Link>
                    </div>
                  </div>
                </div>
                <div>
                  {temperature ? (
                    <Badge className={temperatureTone[temperature.status]}>{temperature.label}</Badge>
                  ) : (
                    <span className="text-sm text-slate-400">Not scored</span>
                  )}
                  {temperature ? <p className="mt-1 text-xs text-slate-500">Score {temperature.score}</p> : null}
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-200">{student.country_interest ?? "N/A"}</div>
                <div>
                  <p className="font-semibold text-[#213343] dark:text-white">{formatCurrency(paid)}</p>
                  <p className="text-xs text-slate-500">Balance {formatCurrency(Math.max(0, CONSULTATION_FEE - paid))}</p>
                </div>
                <div>
                  <select
                    value={student.stage}
                    onChange={(event) => void moveStudent(student.id, event.target.value as StudentStage)}
                    className="h-10 w-full rounded-lg border border-[#eadacc] bg-white px-3 text-sm font-semibold text-[#213343] outline-none transition focus:border-[#ff9a77] focus:ring-4 focus:ring-[#ff7a59]/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                  >
                    {funnelStages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stageLabels[stage.id]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-300">{formatDate(student.updated_at)}</div>
              </article>
            );
          })}

          {visibleStudents.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <p className="text-base font-semibold text-[#213343] dark:text-white">No students in {selectedGroup.name}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Choose another category or move students into this funnel stage.</p>
            </div>
          ) : null}
        </div>
      </section>

      {status ? <p className="text-sm text-slate-500 dark:text-slate-300">{status}</p> : null}
    </div>
  );
}
