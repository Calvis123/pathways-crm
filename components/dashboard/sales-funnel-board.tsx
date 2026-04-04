"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Student, StudentStage } from "@/lib/types";
import { formatCurrency, normalizeKenyanPhone } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const funnelStages: Array<{
  id: StudentStage;
  name: string;
  icon: string;
  color: string;
  description: string;
}> = [
  { id: "lead", name: "Lead", icon: "👤", color: "#6B7280", description: "New inquiry" },
  { id: "inquiry", name: "Inquiry", icon: "🔍", color: "#8B5CF6", description: "Initial inquiry" },
  { id: "consultation", name: "Consultation", icon: "💬", color: "#3B82F6", description: "Meeting scheduled/completed" },
  { id: "application", name: "Application", icon: "📝", color: "#8B5CF6", description: "Applying to universities" },
  { id: "visa", name: "Visa", icon: "✈️", color: "#EC4899", description: "Visa processing" },
  { id: "enrolled", name: "Enrolled", icon: "🎓", color: "#10B981", description: "Student enrolled" },
  { id: "placed", name: "Placed", icon: "🎯", color: "#059669", description: "Placed at university" },
  { id: "employment", name: "Employment", icon: "💼", color: "#6366F1", description: "Employed after study" },
  { id: "lost", name: "Lost", icon: "❌", color: "#EF4444", description: "Not proceeding" }
];

function getPotentialValue(student: Student) {
  if (student.payment_status === "full" || student.payment_status === "paid") return 40000;
  return (student.consultation_upfront_paid ?? 0) + (student.consultation_balance_paid ?? 0);
}

function getWhatsappLink(student: Student) {
  const phone = student.phone ? normalizeKenyanPhone(student.phone) : null;
  if (!phone) return null;
  const message = encodeURIComponent(`Hello ${student.full_name}, I am contacting you from Barak Pathways.`);
  return `https://wa.me/${phone.replace("+", "")}?text=${message}`;
}

export function SalesFunnelBoard({ students }: { students: Student[] }) {
  const [items, setItems] = useState(students);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeDropStage, setActiveDropStage] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const metrics = useMemo(() => {
    const totalPipeline = items.reduce((sum, student) => sum + getPotentialValue(student), 0);
    const activeDeals = items.filter((student) => student.stage !== "lost").length;
    const wonThisMonth = items.filter((student) => {
      const updatedAt = new Date(student.updated_at);
      const now = new Date();
      return student.stage === "enrolled" && updatedAt.getMonth() === now.getMonth() && updatedAt.getFullYear() === now.getFullYear();
    }).length;
    const avgDealValue = items.length > 0 ? Math.round(totalPipeline / items.length) : 0;

    return {
      totalStudents: items.length,
      totalPipeline,
      activeDeals,
      wonThisMonth,
      avgDealValue
    };
  }, [items]);

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

  async function moveStudent(studentId: string, newStage: StudentStage) {
    const student = items.find((entry) => entry.id === studentId);
    if (!student || student.stage === newStage) return;

    const previous = items;
    setItems((current) =>
      current.map((entry) =>
        entry.id === studentId ? { ...entry, stage: newStage, updated_at: new Date().toISOString() } : entry
      )
    );
    setStatus(`Moving ${student.full_name} to ${newStage}...`);

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

    setStatus(`${student.full_name} moved to ${newStage}.`);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-slate-200 bg-[#0f172a] text-white dark:border-white/10 dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)]">
          <p className="text-sm text-slate-300">Total Students</p>
          <p className="mt-3 text-3xl font-semibold">{metrics.totalStudents}</p>
          <p className="mt-2 text-sm text-slate-400">All registered students</p>
        </Card>
        <Card className="border-gold/30 bg-gold/10 dark:border-[#50343a] dark:bg-[linear-gradient(180deg,#2a2130_0%,#1f2435_100%)]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Pipeline Value</p>
          <p className="mt-3 text-3xl font-semibold text-ink dark:text-white">{formatCurrency(metrics.totalPipeline)}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Across all stages</p>
        </Card>
        <Card className="border-slate-200 dark:border-white/10 dark:bg-[linear-gradient(180deg,#1b263c_0%,#141f33_100%)]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Active Deals</p>
          <p className="mt-3 text-3xl font-semibold text-ink dark:text-white">{metrics.activeDeals}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Excluding lost</p>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-500/15 dark:bg-[linear-gradient(180deg,#152a24_0%,#10231f_100%)]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Won This Month</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-700">{metrics.wonThisMonth}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Students enrolled</p>
        </Card>
        <Card className="border-slate-200 dark:border-white/10 dark:bg-[linear-gradient(180deg,#1b263c_0%,#141f33_100%)]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Avg Deal Value</p>
          <p className="mt-3 text-3xl font-semibold text-ink dark:text-white">{formatCurrency(metrics.avgDealValue)}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Per student</p>
        </Card>
      </div>

      <div className="overflow-x-auto pb-3">
        <div className="flex min-w-max gap-5">
          {grouped.map((stage) => (
            <section
              key={stage.id}
              className={`flex min-h-[420px] w-[320px] flex-col overflow-hidden rounded-2xl border transition ${
                activeDropStage === stage.id
                  ? "border-gold shadow-[0_0_0_2px_rgba(191,160,68,0.18)] dark:border-[#ffbeab]"
                  : "border-slate-200 dark:border-white/10"
              }`}
            >
              <div className="px-4 py-4 text-white" style={{ backgroundColor: stage.color }}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">
                    <span className="mr-2">{stage.icon}</span>
                    {stage.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/progress-reports?stage=${stage.id}`}
                      className="rounded-full bg-white/20 px-2 py-1 text-xs font-semibold"
                    >
                      Report
                    </Link>
                    <span className="rounded-full bg-white/25 px-3 py-1 text-sm font-semibold">{stage.count}</span>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-white/90">
                  <span>Value: {formatCurrency(stage.value)}</span>
                  {stage.id !== "lead" ? <span>Conv: {stage.conversion}%</span> : null}
                </div>
              </div>

              <div
                className="flex-1 space-y-3 bg-slate-50 p-4 dark:bg-[linear-gradient(180deg,#121d31_0%,#0f182a_100%)]"
                onDragOver={(event) => {
                  event.preventDefault();
                  setActiveDropStage(stage.id);
                }}
                onDragLeave={() => setActiveDropStage((current) => (current === stage.id ? null : current))}
                onDrop={async (event) => {
                  event.preventDefault();
                  setActiveDropStage(null);
                  const studentId = event.dataTransfer.getData("text/plain");
                  if (studentId) {
                    await moveStudent(studentId, stage.id);
                  }
                }}
              >
                {stage.students.length === 0 ? (
                  <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400 dark:border-white/10 dark:text-slate-500">
                    No students
                  </div>
                ) : null}

                {stage.students.map((student) => {
                  const totalPaid = student.consultation_upfront_paid + student.consultation_balance_paid;
                  const whatsappLink = getWhatsappLink(student);

                  return (
                    <article
                      key={student.id}
                      draggable
                      onDragStart={(event) => {
                        setDraggingId(student.id);
                        event.dataTransfer.setData("text/plain", student.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setActiveDropStage(null);
                      }}
                      className={`cursor-grab rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-gold hover:shadow-md dark:border-white/10 dark:bg-[linear-gradient(180deg,#202b41_0%,#182236_100%)] dark:hover:border-[#ffbeab] dark:hover:shadow-[0_16px_30px_rgba(2,6,23,0.28)] ${
                        draggingId === student.id ? "opacity-50" : ""
                      }`}
                    >
                      <Link href={`/students/${student.id}`} className="block text-sm font-semibold text-ink hover:text-ocean dark:text-white dark:hover:text-[#ffbeab]">
                        {student.full_name}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{student.country_interest ?? "No country"}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                        {student.phone ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-white/[0.08] dark:text-slate-300">
                            {student.phone}
                          </span>
                        ) : null}
                        <span className={`rounded-full px-2.5 py-1 font-semibold ${totalPaid < 40000 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {formatCurrency(totalPaid)}/40K
                        </span>
                        {student.ielts_enrolled ? (
                          <span className="rounded-full bg-violet-100 px-2.5 py-1 font-semibold text-violet-700">
                            IELTS
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-xs">
                        {whatsappLink ? (
                          <a href={whatsappLink} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-300">
                            WhatsApp
                          </a>
                        ) : null}
                        <Link href={`/students/${student.id}/timeline`} className="text-slate-500 dark:text-slate-300">
                          Timeline
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {status ? <p className="text-sm text-slate-500 dark:text-slate-300">{status}</p> : null}
    </div>
  );
}
