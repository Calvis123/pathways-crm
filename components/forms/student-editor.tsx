"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CreditCard, GraduationCap, Save, Trash2, UserRound } from "lucide-react";
import { stageLabels, stageOrder } from "@/lib/constants";
import { readJsonBody } from "@/lib/http";
import type { Student, StudentStage } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const stages: StudentStage[] = [...stageOrder];

export function StudentEditor({
  initial,
  readOnly = false,
  compact = false,
  canSeeFinance = false
}: {
  initial?: Student | null;
  readOnly?: boolean;
  compact?: boolean;
  canSeeFinance?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    passport_number: initial?.passport_number ?? "",
    location: initial?.location ?? "",
    country_interest: initial?.country_interest ?? "",
    program_level: initial?.program_level ?? "",
    university_name: initial?.university_name ?? "",
    stage: initial?.stage ?? "lead",
    payment_status: initial?.payment_status ?? "pending",
    consultation_upfront_paid: String(initial?.consultation_upfront_paid ?? 0),
    consultation_balance_paid: String(initial?.consultation_balance_paid ?? 0),
    ielts_enrolled: initial?.ielts_enrolled ?? false,
    ielts_amount: String(initial?.ielts_amount ?? 0),
    ielts_payment_status: initial?.ielts_payment_status ?? "unpaid",
    notes: initial?.notes ?? "",
    lead_source: initial?.lead_source ?? "Website"
  });
  const [duplicates, setDuplicates] = useState<Array<Pick<Student, "id" | "full_name" | "email" | "phone" | "passport_number" | "stage">>>([]);

  const paidTotal = Number(form.consultation_upfront_paid || 0) + Number(form.consultation_balance_paid || 0);
  const initials = (form.full_name || "New Student")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function checkDuplicates() {
    const response = await fetch("/api/students/duplicates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email || undefined,
        phone: form.phone || undefined,
        passport_number: form.passport_number || undefined,
        excludeId: initial?.id
      })
    });
    const body = await readJsonBody<{ duplicates?: typeof duplicates }>(response);
    setDuplicates(body?.duplicates ?? []);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving...");

    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      passport_number: form.passport_number || null,
      location: form.location || null,
      country_interest: form.country_interest || null,
      program_level: form.program_level || null,
      university_name: form.university_name || null,
      stage: form.stage as StudentStage,
      ielts_enrolled: form.ielts_enrolled,
      notes: form.notes || null,
      lead_source: form.lead_source || null
    };
    const financePayload = canSeeFinance
      ? {
          payment_status: form.payment_status,
          consultation_upfront_paid: Number(form.consultation_upfront_paid || 0),
          consultation_balance_paid: Number(form.consultation_balance_paid || 0),
          ielts_amount: Number(form.ielts_amount || 0),
          ielts_payment_status: form.ielts_payment_status as "paid" | "unpaid"
        }
      : {};

    const response = await fetch(initial ? `/api/students/${initial.id}` : "/api/students", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, ...financePayload })
    });
    const body = await readJsonBody<{ error?: string; id?: string }>(response);
    if (!response.ok) {
      setStatus(body?.error ?? "Could not save student.");
      return;
    }

    setStatus("Saved.");
    router.push("/students");
    router.refresh();
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm("Delete this student? This cannot be undone.")) return;
    const response = await fetch(`/api/students/${initial.id}`, { method: "DELETE" });
    const body = await readJsonBody<{ error?: string }>(response);
    if (!response.ok) {
      setStatus(body?.error ?? "Could not delete student.");
      return;
    }
    router.push("/students");
    router.refresh();
  }

  const fieldClass =
    "h-11 rounded-lg border border-[#eadacc] bg-white px-4 text-sm outline-none transition focus:border-[#ff9a77] focus:ring-4 focus:ring-[#ff7a59]/10 disabled:bg-[#fff6ef] disabled:text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-slate-400 dark:disabled:bg-white/[0.03]";
  const labelClass = "space-y-2 text-sm text-slate-600 dark:text-slate-300";
  const labelTextClass = "block text-xs font-semibold uppercase tracking-[0.08em] text-[#8b5e3c] dark:text-slate-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!compact ? (
        <section className="overflow-hidden rounded-xl border border-[#eadacc] bg-white shadow-[0_18px_50px_rgba(120,75,42,0.1)] dark:border-white/10 dark:bg-[#182638]">
          <div className="grid gap-5 bg-[linear-gradient(135deg,#fffaf5_0%,#fff1e6_58%,#ffe0c8_100%)] px-5 py-6 lg:grid-cols-[1fr_320px] lg:px-7">
            <div>
              <Link href="/students" className="inline-flex items-center gap-2 text-sm font-semibold text-[#8b5e3c] underline-offset-4 hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Back to students
              </Link>
              <h1 className="mt-4 text-3xl font-semibold text-[#213343]">
                {initial ? "Student Profile" : "Create Student Record"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7182]">
                Capture admissions, consultation, payment, IELTS, and follow-up details in one organized profile.
              </p>
            </div>
            <div className="rounded-lg border border-[#eadacc] bg-white/78 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#31424a,#516672)] text-sm font-semibold text-white">
                  {initials || <UserRound className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#213343]">{form.full_name || "Unnamed student"}</p>
                  <p className="truncate text-sm text-slate-500">{form.email || "Email not set"}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-[#fff6ef] p-3">
                  <p className="text-xs font-semibold uppercase text-[#8b5e3c]">Stage</p>
                  <p className="mt-1 font-semibold text-[#213343]">{stageLabels[form.stage as StudentStage]}</p>
                </div>
                {canSeeFinance ? (
                <div className="rounded-lg bg-[#fff6ef] p-3">
                  <p className="text-xs font-semibold uppercase text-[#8b5e3c]">Paid</p>
                  <p className="mt-1 font-semibold text-[#213343]">{formatCurrency(paidTotal)}</p>
                </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-[#eadacc] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#182638]">
            <div className="mb-5 flex items-center gap-3 border-b border-[#eadacc] pb-4 dark:border-white/10">
              <UserRound className="h-5 w-5 text-[#c9692c]" />
              <div>
                <h2 className="font-semibold text-[#213343] dark:text-white">Identity & Contact</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Core student details used across the CRM.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClass}><span className={labelTextClass}>Full name</span><input disabled={readOnly} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} onBlur={checkDuplicates} className={fieldClass} required /></label>
              <label className={labelClass}><span className={labelTextClass}>Email</span><input disabled={readOnly} value={form.email} onChange={(e) => update("email", e.target.value)} onBlur={checkDuplicates} type="email" className={fieldClass} required /></label>
              <label className={labelClass}><span className={labelTextClass}>Phone</span><input disabled={readOnly} value={form.phone} onChange={(e) => update("phone", e.target.value)} onBlur={checkDuplicates} className={fieldClass} /></label>
              <label className={labelClass}><span className={labelTextClass}>Passport number</span><input disabled={readOnly} value={form.passport_number} onChange={(e) => update("passport_number", e.target.value)} onBlur={checkDuplicates} className={fieldClass} /></label>
              <label className={labelClass}><span className={labelTextClass}>Location</span><input disabled={readOnly} value={form.location} onChange={(e) => update("location", e.target.value)} className={fieldClass} /></label>
              <label className={labelClass}><span className={labelTextClass}>Registration source</span><input disabled={readOnly} value={form.lead_source} onChange={(e) => update("lead_source", e.target.value)} className={fieldClass} placeholder="Website, referral, walk-in, WhatsApp" /></label>
            </div>
          </section>

          <section className="rounded-xl border border-[#eadacc] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#182638]">
            <div className="mb-5 flex items-center gap-3 border-b border-[#eadacc] pb-4 dark:border-white/10">
              <GraduationCap className="h-5 w-5 text-[#c9692c]" />
              <div>
                <h2 className="font-semibold text-[#213343] dark:text-white">Study Pathway</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Destination, program, and current pipeline stage.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClass}><span className={labelTextClass}>Country interest</span><input disabled={readOnly} value={form.country_interest} onChange={(e) => update("country_interest", e.target.value)} className={fieldClass} /></label>
              <label className={labelClass}><span className={labelTextClass}>Program level</span><input disabled={readOnly} value={form.program_level} onChange={(e) => update("program_level", e.target.value)} className={fieldClass} /></label>
              <label className={labelClass}><span className={labelTextClass}>University</span><input disabled={readOnly} value={form.university_name} onChange={(e) => update("university_name", e.target.value)} className={fieldClass} /></label>
              <label className={labelClass}>
                <span className={labelTextClass}>Stage</span>
                <select disabled={readOnly} value={form.stage} onChange={(e) => update("stage", e.target.value as StudentStage)} className={fieldClass}>
                  {stages.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}
                </select>
              </label>
            </div>
          </section>
        </div>

        {canSeeFinance ? (
        <aside className="space-y-6">
          <section className="rounded-xl border border-[#eadacc] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#182638]">
            <div className="mb-5 flex items-center gap-3 border-b border-[#eadacc] pb-4 dark:border-white/10">
              <CreditCard className="h-5 w-5 text-[#c9692c]" />
              <div>
                <h2 className="font-semibold text-[#213343] dark:text-white">Payments & IELTS</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Consultation and training billing status.</p>
              </div>
            </div>
            <div className="space-y-4">
              <label className={labelClass}>
                <span className={labelTextClass}>Payment status</span>
                <select disabled={readOnly} value={form.payment_status} onChange={(e) => update("payment_status", e.target.value)} className={fieldClass}>
                  <option value="pending">Pending</option>
                  <option value="installment">Installment</option>
                  <option value="full">Full</option>
                </select>
              </label>
              <label className={labelClass}><span className={labelTextClass}>Consultation upfront</span><input disabled={readOnly} value={form.consultation_upfront_paid} onChange={(e) => update("consultation_upfront_paid", e.target.value)} type="number" className={fieldClass} /></label>
              <label className={labelClass}><span className={labelTextClass}>Consultation balance</span><input disabled={readOnly} value={form.consultation_balance_paid} onChange={(e) => update("consultation_balance_paid", e.target.value)} type="number" className={fieldClass} /></label>
              <label className="flex items-center gap-2 rounded-lg border border-[#eadacc] bg-[#fffaf5] px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200">
                <input disabled={readOnly} type="checkbox" checked={form.ielts_enrolled} onChange={(e) => update("ielts_enrolled", e.target.checked)} className="h-4 w-4 rounded border-[#d9c1ad] accent-[#213343]" />
                IELTS enrolled
              </label>
              <label className={labelClass}><span className={labelTextClass}>IELTS amount</span><input disabled={readOnly} value={form.ielts_amount} onChange={(e) => update("ielts_amount", e.target.value)} type="number" className={fieldClass} /></label>
              <label className={labelClass}>
                <span className={labelTextClass}>IELTS payment</span>
                <select disabled={readOnly} value={form.ielts_payment_status} onChange={(e) => update("ielts_payment_status", e.target.value as "paid" | "unpaid")} className={fieldClass}>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </label>
            </div>
          </section>
        </aside>
        ) : null}
      </div>

      <section className="rounded-xl border border-[#eadacc] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#182638]">
        <label className={labelClass}>
          <span className={labelTextClass}>Internal notes</span>
          <textarea disabled={readOnly} value={form.notes} onChange={(e) => update("notes", e.target.value)} className={`${fieldClass} min-h-32 w-full py-3`} />
        </label>

        {duplicates.length > 0 ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Possible duplicates found:</p>
            <div className="mt-2 space-y-2">
              {duplicates.map((student) => (
                <p key={student.id}>
                  <Link href={`/students/${student.id}`} className="font-medium underline">{student.full_name}</Link>
                  {" "} | {student.email} | {student.phone ?? "No phone"} | {stageLabels[student.stage]}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {!readOnly ? (
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              {initial ? "Save Student" : "Create Student"}
            </Button>
          ) : null}
          <Link href="/students" className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#213343] shadow-sm ring-1 ring-[#eadacc] transition hover:bg-[#fff6ef] dark:bg-white/[0.06] dark:text-slate-100 dark:ring-white/10 dark:hover:bg-white/[0.1]">
            Back
          </Link>
          {!readOnly && initial ? (
            <Button type="button" className="bg-rose-600 text-white hover:bg-rose-700" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          ) : null}
          {status ? <p className="self-center text-sm font-medium text-slate-500">{status}</p> : null}
        </div>
      </section>
    </form>
  );
}
