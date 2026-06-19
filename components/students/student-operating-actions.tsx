"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { stageLabels } from "@/lib/constants";
import type { DecisionRecommendation, QaGateResult, Student, StudentStage } from "@/lib/types";

const inputClass = "w-full rounded-lg border border-[#eadacc] bg-white px-3 py-2 text-sm text-[#213343] outline-none dark:border-white/10 dark:bg-white/[0.06] dark:text-white";

type GateStatus = {
  gate: "G0" | "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7";
  label: string;
  owner: string;
  stage: StudentStage;
  maxDays: number;
  daysInGate: number;
  exitChecklist: Array<{ label: string; passed: boolean }>;
};

export function StudentOperatingActions({
  student,
  gateStatus,
  qaGate,
  recommendation,
  openQaCheckpoints,
  consultants
}: {
  student: Pick<
    Student,
    | "id"
    | "stage"
    | "assigned_consultant_id"
    | "consultation_status"
    | "next_action_date"
    | "advisory_agreement_signed"
    | "deposit_paid"
    | "application_reference"
    | "offer_letter_received"
    | "testimonial_requested"
    | "referral_requested"
  >;
  gateStatus: GateStatus;
  qaGate: QaGateResult;
  recommendation: DecisionRecommendation;
  openQaCheckpoints: Array<{ id: string; stage: string; label: string }>;
  consultants: Array<{ id: string; username: string; full_name: string; role: string }>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [deposit, setDeposit] = useState(String(student.deposit_paid ?? 0));
  const [reference, setReference] = useState(student.application_reference ?? "");
  const [qaLabel, setQaLabel] = useState("");
  const [assignedConsultantId, setAssignedConsultantId] = useState(student.assigned_consultant_id ?? "");
  const [nextStage, setNextStage] = useState(getRecommendedNextStage(student.stage));
  const [consultationStatus, setConsultationStatus] = useState(student.consultation_status ?? "pending");
  const gateReady = gateStatus.exitChecklist.every((item) => item.passed);
  const missingRequirements = gateStatus.exitChecklist.filter((item) => !item.passed);
  const canMoveStage = gateReady && nextStage !== student.stage;

  async function updateStudent(payload: Record<string, unknown>, successMessage: string) {
    setStatus("Saving...");
    const response = await fetch(`/api/students/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setStatus(body?.error ?? "Could not update student.");
      return;
    }
    setStatus(successMessage);
    router.refresh();
  }

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

  async function generateVisaChecklist() {
    setStatus("Generating visa checklist...");
    const response = await fetch("/api/operating-system/visa-checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: student.id })
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setStatus(body?.error ?? "Could not generate visa checklist.");
      return;
    }
    setStatus("Visa checklist generated.");
    router.refresh();
  }

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <Card className="p-4 sm:p-5">
      <CardHeader
        title="Next Step"
        description="Work from the current stage, clear the missing requirements, then move the student forward."
      />
      {status ? (
        <div className="mb-4 rounded-lg border border-[#eadacc] bg-[#fff6ef] px-3 py-2 text-sm font-medium text-[#213343] dark:border-white/10 dark:bg-white/[0.05] dark:text-white">
          {status}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <div className="rounded-lg border border-[#eadacc] bg-[#fffaf5] p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-slate-100 text-slate-700 ring-slate-200">Current: {stageLabels[student.stage]}</Badge>
                  <Badge className={gateReady ? "bg-emerald-100 text-emerald-800 ring-emerald-200" : "bg-amber-100 text-amber-800 ring-amber-200"}>
                    Next: {stageLabels[nextStage]}
                  </Badge>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-[#213343] dark:text-white">{gateStatus.label}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {gateStatus.gate} | {gateStatus.owner} | {gateStatus.daysInGate}/{gateStatus.maxDays} days
                </p>
              </div>
              <Badge className={gateReady ? "bg-emerald-100 text-emerald-800 ring-emerald-200" : "bg-amber-100 text-amber-800 ring-amber-200"}>
                {gateStatus.exitChecklist.filter((item) => item.passed).length}/{gateStatus.exitChecklist.length} ready
              </Badge>
            </div>

            {gateReady ? (
              <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                All requirements are complete. You can move this student to {stageLabels[nextStage]}.
              </p>
            ) : (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                <p className="font-semibold">Needed before moving</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {missingRequirements.map((item) => (
                    <div key={item.label} className="flex items-start gap-2">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {gateStatus.exitChecklist.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-[#eadacc] bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={item.passed ? "h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" : "h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500"} />
                    <span className="text-slate-700 dark:text-slate-200">{item.label}</span>
                  </div>
                  {!item.passed ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-7 shrink-0 rounded-md px-2 text-xs"
                      onClick={() =>
                        runOperatingAction(
                          {
                            action: "create_qa_checkpoint",
                            entity_type: "student",
                            entity_id: student.id,
                            stage: qaGate.stage,
                            label: item.label,
                            passed: true
                          },
                          "Checklist item ticked."
                        )
                      }
                    >
                      Tick
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-[#eadacc] p-4 dark:border-white/10 md:grid-cols-3">
            <form
              action={() => updateStudent({ assigned_consultant_id: assignedConsultantId || null }, "Consultant assigned.")}
              className="space-y-2"
            >
              <label className="text-sm font-semibold text-[#213343] dark:text-white">Assign Consultant</label>
              <select value={assignedConsultantId} onChange={(event) => setAssignedConsultantId(event.target.value)} className={inputClass}>
                <option value="">Unassigned</option>
                {consultants.map((consultant) => (
                  <option key={consultant.id} value={consultant.id}>
                    {consultant.full_name} ({consultant.role})
                  </option>
                ))}
              </select>
              <Button type="submit" className="w-full">Assign</Button>
            </form>

            <form
              action={() => updateStudent({ stage: nextStage }, `Moved to ${stageLabels[nextStage]}.`)}
              className="space-y-2"
            >
              <label className="text-sm font-semibold text-[#213343] dark:text-white">Move Step</label>
              <select value={nextStage} onChange={(event) => setNextStage(event.target.value as StudentStage)} className={inputClass}>
                {documentStageFlow.map((stage) => (
                  <option key={stage} value={stage}>{stageLabels[stage]}</option>
                ))}
              </select>
              <Button type="submit" className="w-full" disabled={!canMoveStage}>Move Student</Button>
            </form>

            <form
              action={() => updateStudent({ consultation_status: consultationStatus }, "Consultation status updated.")}
              className="space-y-2"
            >
              <label className="text-sm font-semibold text-[#213343] dark:text-white">Consultation</label>
              <select value={consultationStatus} onChange={(event) => setConsultationStatus(event.target.value as "pending" | "confirmed" | "completed" | "cancelled")} className={inputClass}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button type="submit" className="w-full">Update</Button>
            </form>
          </div>

          <details className="rounded-lg border border-[#eadacc] bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <summary className="cursor-pointer text-sm font-semibold text-[#213343] dark:text-white">More actions and QA</summary>
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Button type="button" variant="secondary" onClick={() => runOperatingAction({ action: "update_student_gate_fields", student_id: student.id, next_action_date: tomorrow }, "Next action scheduled.")}>
                  Schedule Next Action
                </Button>
                <Button type="button" variant="secondary" onClick={() => runOperatingAction({ action: "update_student_gate_fields", student_id: student.id, advisory_agreement_signed: true }, "Advisory agreement marked signed.")}>
                  Mark Agreement Signed
                </Button>
                <Button type="button" variant="secondary" onClick={() => runOperatingAction({ action: "update_student_gate_fields", student_id: student.id, offer_letter_received: true }, "Offer letter marked received.")}>
                  Mark Offer Received
                </Button>
                <Button type="button" variant="secondary" onClick={generateVisaChecklist}>
                  Generate Visa Checklist
                </Button>
                <Button type="button" variant="secondary" onClick={() => runOperatingAction({ action: "update_student_gate_fields", student_id: student.id, testimonial_requested: true }, "Testimonial requested.")}>
                  Request Testimonial
                </Button>
                <Button type="button" variant="secondary" onClick={() => runOperatingAction({ action: "update_student_gate_fields", student_id: student.id, referral_requested: true }, "Referral requested.")}>
                  Request Referral
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <form
                  action={() =>
                    runOperatingAction(
                      { action: "update_student_gate_fields", student_id: student.id, deposit_paid: Number(deposit || 0) },
                      "Deposit updated."
                    )
                  }
                  className="rounded-lg border border-[#eadacc] p-4 dark:border-white/10"
                >
                  <label className="text-sm font-semibold text-[#213343] dark:text-white">Deposit Paid</label>
                  <div className="mt-3 flex gap-2">
                    <input value={deposit} onChange={(event) => setDeposit(event.target.value)} type="number" className={inputClass} />
                    <Button type="submit">Save</Button>
                  </div>
                </form>

                <form
                  action={() =>
                    runOperatingAction(
                      { action: "update_student_gate_fields", student_id: student.id, application_reference: reference || null },
                      "Application reference saved."
                    )
                  }
                  className="rounded-lg border border-[#eadacc] p-4 dark:border-white/10"
                >
                  <label className="text-sm font-semibold text-[#213343] dark:text-white">Application / Visa Reference</label>
                  <div className="mt-3 flex gap-2">
                    <input value={reference} onChange={(event) => setReference(event.target.value)} className={inputClass} />
                    <Button type="submit">Save</Button>
                  </div>
                </form>
              </div>

              <form
                action={() => {
                  if (!qaLabel.trim()) return;
                  runOperatingAction(
                    {
                      action: "create_qa_checkpoint",
                      entity_type: "student",
                      entity_id: student.id,
                      stage: qaGate.stage,
                      label: qaLabel,
                      passed: false
                    },
                    "QA checkpoint created."
                  );
                  setQaLabel("");
                }}
                className="rounded-lg border border-[#eadacc] p-4 dark:border-white/10"
              >
                <label className="text-sm font-semibold text-[#213343] dark:text-white">New QA Checkpoint</label>
                <div className="mt-3 flex gap-2">
                  <input value={qaLabel} onChange={(event) => setQaLabel(event.target.value)} placeholder="Checkpoint label" className={inputClass} />
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </div>
          </details>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-[#eadacc] bg-[#fffaf5] p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="font-semibold text-[#213343] dark:text-white">QA Gate</p>
            <Badge className={qaGate.passed ? "mt-3 bg-emerald-100 text-emerald-800 ring-emerald-200" : "mt-3 bg-rose-100 text-rose-800 ring-rose-200"}>
              {qaGate.stage} | {qaGate.passed ? "Ready" : "Blocked"}
            </Badge>
            <div className="mt-3 space-y-2 text-sm">
              {qaGate.checks.slice(0, 3).map((check) => (
                <div key={check.label} className="rounded-lg bg-white px-3 py-2 dark:bg-white/[0.04]">
                  <p className="font-medium text-[#213343] dark:text-white">{check.label}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{check.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#eadacc] p-4 dark:border-white/10">
            <p className="font-semibold text-[#213343] dark:text-white">Pathway Recommendation</p>
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">{recommendation.recommendation}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{recommendation.confidence}% confidence</p>
          </div>

          {openQaCheckpoints.length > 0 ? (
            <div className="rounded-lg border border-[#eadacc] p-4 dark:border-white/10">
              <p className="font-semibold text-[#213343] dark:text-white">Open QA</p>
              <div className="mt-3 space-y-2">
                {openQaCheckpoints.map((checkpoint) => (
                  <div key={checkpoint.id} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
                    <p className="font-medium">{checkpoint.stage}: {checkpoint.label}</p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-2 h-8 rounded-md px-3 text-xs"
                      onClick={() => runOperatingAction({ action: "sign_off_qa_checkpoint", id: checkpoint.id }, "QA checkpoint signed off.")}
                    >
                      Sign Off
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </Card>
  );
}

const documentStageFlow: StudentStage[] = [
  "lead",
  "qualified",
  "engaged",
  "application_ready",
  "submitted",
  "offer_secured",
  "visa_lodged",
  "placed"
];

function getRecommendedNextStage(stage: StudentStage): StudentStage {
  const index = documentStageFlow.indexOf(stage);
  if (index === -1) return "qualified";
  return documentStageFlow[Math.min(index + 1, documentStageFlow.length - 1)];
}
