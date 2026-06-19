"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { OperatingSystemSnapshot, Student } from "@/lib/types";

export function PartnerOperationsDashboard({
  snapshot,
  canSeeFinance,
  students
}: {
  snapshot: OperatingSystemSnapshot;
  canSeeFinance: boolean;
  students: Pick<Student, "id" | "full_name" | "country_interest" | "stage">[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function runAction(payload: Record<string, unknown>, success: string) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/partners/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(body?.error ?? "Partner action failed.");
        return;
      }
      setMessage(success);
      router.refresh();
    });
  }

  function formValue(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-lg border border-[#eadacc] bg-[#fff6ef] px-4 py-3 text-sm font-medium text-[#213343] dark:border-white/10 dark:bg-white/[0.05] dark:text-white">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Create Partner" />
          <form
            action={(formData) =>
              runAction(
                {
                  action: "create_partner",
                  name: formValue(formData, "name"),
                  type: formValue(formData, "type"),
                  country: formValue(formData, "country"),
                  agreement_status: formValue(formData, "agreement_status"),
                  primary_contact_name: formValue(formData, "primary_contact_name"),
                  primary_contact_email: formValue(formData, "primary_contact_email"),
                  response_time_hours: formValue(formData, "response_time_hours"),
                  satisfaction_score: formValue(formData, "satisfaction_score")
                },
                "Partner created."
              )
            }
            className="grid gap-3"
          >
            <Field name="name" label="Partner name" required />
            <div className="grid gap-3 md:grid-cols-2">
              <Select name="type" label="Type" options={["university", "digital_skills_platform", "employer"]} />
              <Select name="agreement_status" label="Status" options={["negotiation", "legal_review", "signed", "active", "renewal_due", "cancelled"]} />
              <Field name="country" label="Country" />
              <Field name="primary_contact_name" label="Contact name" />
              <Field name="primary_contact_email" label="Contact email" type="email" />
              <Field name="response_time_hours" label="Response hours" type="number" />
              <Field name="satisfaction_score" label="Satisfaction /10" type="number" />
            </div>
            <Button type="submit" disabled={isPending}>Add Partner</Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Partner Records" />
          <div className="space-y-3">
            {snapshot.partners.map((partner) => (
              <form
                key={partner.id}
                action={(formData) =>
                  runAction(
                    {
                      action: "update_partner",
                      id: partner.id,
                      name: formValue(formData, "name"),
                      type: formValue(formData, "type"),
                      country: formValue(formData, "country"),
                      agreement_status: formValue(formData, "agreement_status"),
                      primary_contact_name: formValue(formData, "primary_contact_name"),
                      primary_contact_email: formValue(formData, "primary_contact_email"),
                      response_time_hours: formValue(formData, "response_time_hours"),
                      satisfaction_score: formValue(formData, "satisfaction_score")
                    },
                    "Partner updated."
                  )
                }
                className="rounded-lg border border-[#eadacc] p-4 dark:border-white/10"
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <Field name="name" label="Name" defaultValue={partner.name} required />
                  <Select name="type" label="Type" options={["university", "digital_skills_platform", "employer"]} defaultValue={partner.type} />
                  <Select name="agreement_status" label="Status" options={["negotiation", "legal_review", "signed", "active", "renewal_due", "cancelled"]} defaultValue={partner.agreement_status} />
                  <Field name="country" label="Country" defaultValue={partner.country ?? ""} />
                  <Field name="primary_contact_name" label="Contact" defaultValue={partner.primary_contact_name ?? ""} />
                  <Field name="primary_contact_email" label="Email" defaultValue={partner.primary_contact_email ?? ""} />
                  <Field name="response_time_hours" label="Hours" type="number" defaultValue={partner.response_time_hours?.toString() ?? ""} />
                  <Field name="satisfaction_score" label="Score" type="number" defaultValue={partner.satisfaction_score?.toString() ?? ""} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button type="submit" variant="secondary" disabled={isPending}>Save</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => {
                      if (window.confirm(`Delete ${partner.name}? Agreements and programmes will also be removed.`)) {
                        runAction({ action: "delete_partner", id: partner.id }, "Partner deleted.");
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </form>
            ))}
          </div>
        </Card>
      </div>

      {canSeeFinance ? (
      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader title="Create Agreement" />
          <form action={(formData) => runAction({
            action: "create_agreement",
            partner_id: formValue(formData, "partner_id"),
            agreement_type: formValue(formData, "agreement_type"),
            status: formValue(formData, "status"),
            commission_rate: formValue(formData, "commission_rate"),
            retainer_amount: formValue(formData, "retainer_amount"),
            renewal_date: formValue(formData, "renewal_date")
          }, "Agreement created.")} className="grid gap-3">
            <PartnerSelect partners={snapshot.partners} />
            <Select name="agreement_type" label="Type" options={["retainer", "commission", "bonus"]} />
            <Select name="status" label="Status" options={["negotiation", "legal_review", "signed", "active", "renewal_due", "cancelled"]} />
            <Field name="commission_rate" label="Commission %" type="number" />
            <Field name="retainer_amount" label="Retainer" type="number" />
            <Field name="renewal_date" label="Renewal date" type="date" />
            <Button type="submit" disabled={isPending}>Add Agreement</Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Create Programme" />
          <form action={(formData) => runAction({
            action: "create_programme",
            partner_id: formValue(formData, "partner_id"),
            name: formValue(formData, "name"),
            destination: formValue(formData, "destination"),
            level: formValue(formData, "level"),
            tuition_fee: formValue(formData, "tuition_fee"),
            currency: formValue(formData, "currency") ?? "KES",
            active: true
          }, "Programme created.")} className="grid gap-3">
            <PartnerSelect partners={snapshot.partners} />
            <Field name="name" label="Programme name" required />
            <Field name="destination" label="Destination" required />
            <Select name="level" label="Level" options={["certificate", "diploma", "undergraduate", "masters", "professional", "employment"]} />
            <Field name="tuition_fee" label="Tuition fee" type="number" />
            <Field name="currency" label="Currency" defaultValue="KES" />
            <Button type="submit" disabled={isPending}>Add Programme</Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Record Partner Revenue" />
          <form action={(formData) => runAction({
            action: "create_revenue",
            partner_id: formValue(formData, "partner_id"),
            type: formValue(formData, "type"),
            amount: formValue(formData, "amount"),
            currency: formValue(formData, "currency") ?? "KES",
            recognized_at: formValue(formData, "recognized_at"),
            notes: formValue(formData, "notes")
          }, "Revenue recorded.")} className="grid gap-3">
            <PartnerSelect partners={snapshot.partners} />
            <Select name="type" label="Revenue type" options={["retainer", "commission", "royalty", "bonus"]} />
            <Field name="amount" label="Amount" type="number" required />
            <Field name="currency" label="Currency" defaultValue="KES" />
            <Field name="recognized_at" label="Recognized date" type="date" />
            <Field name="notes" label="Notes" />
            <Button type="submit" disabled={isPending}>Record Revenue</Button>
          </form>
        </Card>
      </div>
      ) : null}

      <Card>
        <CardHeader title="Referral Pipeline" />
        <form action={(formData) => runAction({
          action: "create_application",
          student_id: formValue(formData, "student_id"),
          programme_id: formValue(formData, "programme_id"),
          status: formValue(formData, "status"),
          offer_letter_url: formValue(formData, "offer_letter_url")
        }, "Application/referral created.")} className="mb-4 grid gap-3 md:grid-cols-5">
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-2 block font-medium text-[#213343] dark:text-white">Student</span>
            <select name="student_id" required className={inputClass}>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.full_name} | {student.stage}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-2 block font-medium text-[#213343] dark:text-white">Programme</span>
            <select name="programme_id" required className={inputClass}>
              {snapshot.programmes.map((programme) => (
                <option key={programme.id} value={programme.id}>{programme.name} | {programme.destination}</option>
              ))}
            </select>
          </label>
          <Select name="status" label="Status" options={["draft", "submitted", "accepted", "rejected", "deferred"]} />
          <Field name="offer_letter_url" label="Offer URL" />
          <div className="self-end"><Button type="submit" disabled={isPending}>Create</Button></div>
        </form>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Programme</th>
                <th className="px-3 py-2">Destination</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Offer</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.applications.map((application) => (
                <tr key={application.id} className="border-t border-[#eadacc] dark:border-white/10">
                  <td className="px-3 py-3 font-medium text-[#213343] dark:text-white">{application.student?.full_name ?? "Student"}</td>
                  <td className="px-3 py-3">{application.programme?.name ?? "Programme"}</td>
                  <td className="px-3 py-3">{application.programme?.destination ?? "-"}</td>
                  <td className="px-3 py-3">{application.status}</td>
                  <td className="px-3 py-3">{application.offer_letter_url ? "Uploaded" : "Pending"}</td>
                  <td className="px-3 py-3">
                    <select
                      value={application.status}
                      onChange={(event) => runAction({ action: "update_application", id: application.id, status: event.target.value }, "Application updated.")}
                      className={inputClass}
                    >
                      {["draft", "submitted", "accepted", "rejected", "deferred"].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}

const inputClass = "w-full rounded-lg border border-[#eadacc] bg-white px-3 py-2 text-sm text-[#213343] outline-none dark:border-white/10 dark:bg-white/[0.06] dark:text-white";

function Field({ name, label, type = "text", defaultValue = "", required = false }: { name: string; label: string; type?: string; defaultValue?: string; required?: boolean }) {
  return (
    <label className="block text-sm text-slate-600 dark:text-slate-300">
      <span className="mb-2 block font-medium text-[#213343] dark:text-white">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} required={required} className={inputClass} />
    </label>
  );
}

function Select({ name, label, options, defaultValue }: { name: string; label: string; options: string[]; defaultValue?: string }) {
  return (
    <label className="block text-sm text-slate-600 dark:text-slate-300">
      <span className="mb-2 block font-medium text-[#213343] dark:text-white">{label}</span>
      <select name={name} defaultValue={defaultValue ?? options[0]} required className={inputClass}>
        {options.map((option) => <option key={option} value={option}>{option.replace(/_/g, " ")}</option>)}
      </select>
    </label>
  );
}

function PartnerSelect({ partners }: { partners: OperatingSystemSnapshot["partners"] }) {
  return (
    <label className="block text-sm text-slate-600 dark:text-slate-300">
      <span className="mb-2 block font-medium text-[#213343] dark:text-white">Partner</span>
      <select name="partner_id" required className={inputClass}>
        {partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
      </select>
    </label>
  );
}
