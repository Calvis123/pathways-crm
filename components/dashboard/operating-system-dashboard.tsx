"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { OperatingSystemSnapshot } from "@/lib/types";

const inputClass = "w-full rounded-lg border border-[#eadacc] bg-white px-3 py-2 text-sm text-[#213343] outline-none dark:border-white/10 dark:bg-white/[0.06] dark:text-white";

export function OperatingSystemDashboard({ snapshot }: { snapshot: OperatingSystemSnapshot }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const visaQueue = snapshot.recommendations.filter(({ student }) => student.stage === "application" || student.stage === "visa");
  const qaEntityOptions = [
    ...snapshot.partners.map((partner) => ({ id: partner.id, label: `Partner | ${partner.name}`, entity_type: "partner" as const })),
    ...snapshot.partnerAgreements.map((agreement) => ({ id: agreement.id, label: `Agreement | ${agreement.partner?.name ?? agreement.id}`, entity_type: "partner_agreement" as const })),
    ...snapshot.applications.map((application) => ({ id: application.id, label: `Application | ${application.student?.full_name ?? application.id}`, entity_type: "application" as const })),
    ...snapshot.visaRecords.map((record) => ({ id: record.id, label: `Visa | ${record.student?.full_name ?? record.destination_country}`, entity_type: "visa_record" as const }))
  ];

  async function runOperatingAction(payload: Record<string, unknown>, successMessage: string) {
    setStatus("Saving...");
    const response = await fetch("/api/operating-system/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setStatus(body?.error ?? "Could not save.");
      return;
    }
    setStatus(successMessage);
    router.refresh();
  }

  function formValue(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  function visaRequirementsFromText(value: string | null) {
    return (value ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((label) => ({ label }));
  }

  return (
    <div className="space-y-5">
      {status ? (
        <div className="rounded-lg border border-[#eadacc] bg-[#fff6ef] px-4 py-3 text-sm font-medium text-[#213343] dark:border-white/10 dark:bg-white/[0.05] dark:text-white">
          {status}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Student Exceptions" />
          <div className="space-y-3">
            {snapshot.stuckStudents.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No stuck students.</p>
            ) : (
              snapshot.stuckStudents.map((student) => (
                <div key={student.student_id} className="grid gap-3 rounded-lg border border-[#eadacc] p-4 dark:border-white/10 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="font-semibold text-[#213343] dark:text-white">{student.full_name}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {student.gate} | {student.stage.replace(/_/g, " ")} | {student.owner}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Badge className="bg-rose-100 text-rose-800 ring-rose-200">
                      {student.daysInGate}/{student.maxDays} days
                    </Badge>
                    <Badge className={student.nextActionDate ? "bg-slate-100 text-slate-700 ring-slate-200" : "bg-amber-100 text-amber-800 ring-amber-200"}>
                      {student.nextActionDate ?? "No next action"}
                    </Badge>
                    <Link
                      href={`/students/${student.student_id}` as Route}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-[#eadacc] bg-white px-3 text-xs font-semibold text-[#213343] shadow-sm transition hover:bg-[#fff1e6] dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
                    >
                      Open Record
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Student Visa Queue" />
          <div className="space-y-3">
            {visaQueue.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No students waiting.</p>
            ) : (
              visaQueue.map(({ student }) => (
                <div key={student.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#eadacc] p-4 dark:border-white/10">
                  <div>
                    <p className="font-semibold text-[#213343] dark:text-white">{student.full_name}</p>
                    <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">{student.stage}</p>
                  </div>
                  <Link
                    href={`/students/${student.id}` as Route}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-[#eadacc] bg-white px-3 text-sm font-semibold text-[#213343] shadow-sm transition hover:bg-[#fff1e6] dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
                  >
                    Open Record
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader title="Country Packs" />
          <form
            action={(formData) =>
              runOperatingAction(
                {
                  action: "upsert_market_config",
                  country: formValue(formData, "country"),
                  language: formValue(formData, "language") ?? "en",
                  active: true,
                  policy_notes: formValue(formData, "policy_notes") ?? "",
                  market_owner: formValue(formData, "market_owner"),
                  visa_requirements: visaRequirementsFromText(formValue(formData, "visa_requirements")),
                  official_sources:
                    formValue(formData, "source_label") && formValue(formData, "source_url")
                      ? [
                          {
                            label: formValue(formData, "source_label"),
                            url: formValue(formData, "source_url"),
                            last_checked: new Date().toISOString().slice(0, 10)
                          }
                        ]
                      : []
                },
                "Country Pack saved."
              )
            }
            className="grid gap-3"
          >
            <input name="country" required placeholder="Country" className={inputClass} />
            <input name="language" defaultValue="en" placeholder="Language" className={inputClass} />
            <input name="market_owner" placeholder="Owner" className={inputClass} />
            <input name="policy_notes" placeholder="Policy notes" className={inputClass} />
            <textarea name="visa_requirements" placeholder="One checklist item per line" className={`${inputClass} min-h-24`} />
            <input name="source_label" placeholder="Official source label" className={inputClass} />
            <input name="source_url" placeholder="Official source URL" className={inputClass} />
            <Button type="submit">Save</Button>
          </form>
          <div className="mt-4 space-y-2">
            {snapshot.marketConfigs.map((config) => (
              <div key={config.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#eadacc] p-3 text-sm dark:border-white/10">
                <span className="font-medium text-[#213343] dark:text-white">{config.country}</span>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 rounded-md px-3 text-xs"
                  onClick={() =>
                    runOperatingAction(
                      { action: "verify_market_config", id: config.id, market_owner: config.market_owner ?? "operations" },
                      "Country Pack verified."
                    )
                  }
                >
                  Verify
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="QA Checkpoints" />
          <form
            action={(formData) => {
              const selected = qaEntityOptions.find((option) => option.id === formValue(formData, "entity_id"));
              runOperatingAction(
                {
                  action: "create_qa_checkpoint",
                  entity_type: selected?.entity_type ?? "partner",
                  entity_id: formValue(formData, "entity_id"),
                  stage: formValue(formData, "stage"),
                  label: formValue(formData, "label"),
                  passed: false
                },
                "QA checkpoint created."
              );
            }}
            className="grid gap-3"
          >
            <select name="entity_id" required className={inputClass}>
              {qaEntityOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            <select name="stage" required className={inputClass} defaultValue="partner_onboarding">
              {["intake", "counselling", "application", "visa", "partner_agreement", "partner_onboarding", "partner_performance"].map((stage) => (
                <option key={stage} value={stage}>{stage.replace(/_/g, " ")}</option>
              ))}
            </select>
            <input name="label" required placeholder="Checkpoint label" className={inputClass} />
            <Button type="submit" disabled={qaEntityOptions.length === 0}>Create</Button>
          </form>
          <div className="mt-4 space-y-2">
            {snapshot.qaCheckpoints.filter((checkpoint) => !checkpoint.passed).map((checkpoint) => (
              <div key={checkpoint.id} className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <span>{checkpoint.stage}: {checkpoint.label}</span>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 rounded-md px-3 text-xs"
                  onClick={() => runOperatingAction({ action: "sign_off_qa_checkpoint", id: checkpoint.id }, "QA checkpoint signed off.")}
                >
                  Sign Off
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Training" />
          <form
            action={(formData) =>
              runOperatingAction(
                {
                  action: "create_training_module",
                  consultant_username: formValue(formData, "consultant_username"),
                  module_name: formValue(formData, "module_name"),
                  module_type: formValue(formData, "module_type"),
                  completed: false
                },
                "Training module created."
              )
            }
            className="grid gap-3"
          >
            <input name="consultant_username" required placeholder="Consultant username" className={inputClass} />
            <input name="module_name" required placeholder="Module name" className={inputClass} />
            <select name="module_type" required className={inputClass}>
              {["onboarding", "certification", "skill_development"].map((type) => (
                <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
              ))}
            </select>
            <Button type="submit">Create</Button>
          </form>
          <div className="mt-4 space-y-2">
            {snapshot.consultantTraining.filter((module) => !module.completed).map((module) => (
              <div key={module.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#eadacc] p-3 text-sm dark:border-white/10">
                <span className="font-medium text-[#213343] dark:text-white">{module.module_name}</span>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 rounded-md px-3 text-xs"
                  onClick={() => runOperatingAction({ action: "complete_training_module", id: module.id, score: 100 }, "Training module completed.")}
                >
                  Complete
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Partner Legal Review" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.partnerAgreements.filter((agreement) => !agreement.legal_review_complete).map((agreement) => (
            <div key={agreement.id} className="rounded-lg border border-[#eadacc] p-4 dark:border-white/10">
              <p className="font-semibold text-[#213343] dark:text-white">{agreement.partner?.name ?? "Partner"}</p>
              <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">{agreement.agreement_type} | {agreement.status}</p>
              <Button
                type="button"
                variant="secondary"
                className="mt-3 h-8 rounded-md px-3 text-xs"
                onClick={() => runOperatingAction({ action: "complete_partner_legal_review", id: agreement.id }, "Partner legal review completed.")}
              >
                Complete
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
