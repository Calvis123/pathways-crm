"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Student, StudentStage } from "@/lib/types";
import { Button } from "@/components/ui/button";

const stages: StudentStage[] = ["lead", "inquiry", "consultation", "application", "visa", "enrolled", "placed", "employment", "lost"];

export function StudentEditor({
  initial,
  readOnly = false
}: {
  initial?: Student | null;
  readOnly?: boolean;
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
    const body = (await response.json()) as { duplicates?: typeof duplicates };
    setDuplicates(body.duplicates ?? []);
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
      payment_status: form.payment_status,
      consultation_upfront_paid: Number(form.consultation_upfront_paid || 0),
      consultation_balance_paid: Number(form.consultation_balance_paid || 0),
      ielts_enrolled: form.ielts_enrolled,
      ielts_amount: Number(form.ielts_amount || 0),
      ielts_payment_status: form.ielts_payment_status as "paid" | "unpaid",
      notes: form.notes || null,
      lead_source: form.lead_source || null
    };

    const response = await fetch(initial ? `/api/students/${initial.id}` : "/api/students", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = (await response.json()) as { error?: string; id?: string };
    if (!response.ok) {
      setStatus(body.error ?? "Could not save student.");
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
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(body.error ?? "Could not delete student.");
      return;
    }
    router.push("/students");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-panel">
        <div className="grid gap-4 md:grid-cols-2">
          <input disabled={readOnly} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} onBlur={checkDuplicates} placeholder="Full name" className="rounded-2xl border border-slate-200 px-4 py-3" required />
          <input disabled={readOnly} value={form.email} onChange={(e) => update("email", e.target.value)} onBlur={checkDuplicates} type="email" placeholder="Email" className="rounded-2xl border border-slate-200 px-4 py-3" required />
          <input disabled={readOnly} value={form.phone} onChange={(e) => update("phone", e.target.value)} onBlur={checkDuplicates} placeholder="Phone" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <input disabled={readOnly} value={form.passport_number} onChange={(e) => update("passport_number", e.target.value)} onBlur={checkDuplicates} placeholder="Passport number" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <input disabled={readOnly} value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Location" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <input disabled={readOnly} value={form.country_interest} onChange={(e) => update("country_interest", e.target.value)} placeholder="Country interest" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <input disabled={readOnly} value={form.program_level} onChange={(e) => update("program_level", e.target.value)} placeholder="Program level" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <input disabled={readOnly} value={form.university_name} onChange={(e) => update("university_name", e.target.value)} placeholder="University" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <select disabled={readOnly} value={form.stage} onChange={(e) => update("stage", e.target.value as StudentStage)} className="rounded-2xl border border-slate-200 px-4 py-3">
            {stages.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
          <input disabled={readOnly} value={form.lead_source} onChange={(e) => update("lead_source", e.target.value)} placeholder="Lead source" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <select disabled={readOnly} value={form.payment_status} onChange={(e) => update("payment_status", e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3">
            <option value="pending">Pending</option>
            <option value="installment">Installment</option>
            <option value="full">Full</option>
          </select>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
            <input disabled={readOnly} type="checkbox" checked={form.ielts_enrolled} onChange={(e) => update("ielts_enrolled", e.target.checked)} />
            IELTS enrolled
          </label>
          <input disabled={readOnly} value={form.consultation_upfront_paid} onChange={(e) => update("consultation_upfront_paid", e.target.value)} type="number" placeholder="Consultation upfront" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <input disabled={readOnly} value={form.consultation_balance_paid} onChange={(e) => update("consultation_balance_paid", e.target.value)} type="number" placeholder="Consultation balance" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <input disabled={readOnly} value={form.ielts_amount} onChange={(e) => update("ielts_amount", e.target.value)} type="number" placeholder="IELTS amount" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <select disabled={readOnly} value={form.ielts_payment_status} onChange={(e) => update("ielts_payment_status", e.target.value as "paid" | "unpaid")} className="rounded-2xl border border-slate-200 px-4 py-3">
            <option value="unpaid">IELTS unpaid</option>
            <option value="paid">IELTS paid</option>
          </select>
          <textarea disabled={readOnly} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Notes" className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" />
        </div>

        {duplicates.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Possible duplicates found:</p>
            <div className="mt-2 space-y-2">
              {duplicates.map((student) => (
                <p key={student.id}>
                  <Link href={`/students/${student.id}`} className="font-medium underline">
                    {student.full_name}
                  </Link>
                  {" "} | {student.email} | {student.phone ?? "No phone"} | {student.stage}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {!readOnly ? <Button type="submit">{initial ? "Save Student" : "Create Student"}</Button> : null}
          <Link href="/students" className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-slate-200">Back</Link>
          {!readOnly && initial ? (
            <Button type="button" className="bg-rose-600 text-white hover:bg-rose-700" onClick={handleDelete}>
              Delete
            </Button>
          ) : null}
          {status ? <p className="self-center text-sm text-slate-500">{status}</p> : null}
        </div>
      </form>
    </div>
  );
}
