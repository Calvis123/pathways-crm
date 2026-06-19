import {
  bookOutline,
  cashOutline,
  helpCircleOutline,
  rocketOutline,
  searchOutline,
  trophyOutline
} from "ionicons/icons";
import type { SegmentKey, StudentStage } from "@/lib/types";

export const stageOptions = [
  "lead",
  "qualified",
  "inquiry",
  "engaged",
  "consultation",
  "application_ready",
  "application",
  "submitted",
  "offer_secured",
  "visa",
  "visa_lodged",
  "enrolled",
  "placed",
  "employment",
  "lost"
] as const satisfies readonly StudentStage[];

export const stageOrder: StudentStage[] = [...stageOptions];

export const stageLabels: Record<StudentStage, string> = {
  lead: "Lead",
  qualified: "Qualified",
  inquiry: "Inquiry",
  engaged: "Engaged",
  consultation: "Consultation",
  application_ready: "Application Ready",
  application: "Application",
  submitted: "Submitted",
  offer_secured: "Offer Secured",
  visa: "Visa",
  visa_lodged: "Visa Lodged",
  enrolled: "Enrolled",
  placed: "Placed",
  employment: "Employment",
  lost: "Lost"
};

export const advisoryStageOrder: StudentStage[] = ["inquiry", "consultation", "application", "visa", "placed"];

export const franchiseGateDefinitions = [
  {
    gate: "G0",
    label: "Lead captured",
    stage: "lead",
    owner: "Front desk / Intake",
    maxDays: 1,
    exitChecklist: ["Contact logged", "Lead source logged", "Destination interest logged", "Next action scheduled"]
  },
  {
    gate: "G1",
    label: "Qualified",
    stage: "qualified",
    owner: "Front desk / Intake",
    maxDays: 3,
    exitChecklist: [
      "Destination interest and motivation captured",
      "English level, qualification and funds assessed honestly",
      "Timeline realistic against intake dates",
      "Lead source recorded; next action scheduled"
    ]
  },
  {
    gate: "G2",
    label: "Engaged",
    stage: "engaged",
    owner: "Counsellor",
    maxDays: 5,
    exitChecklist: ["Advisory agreement signed", "Deposit received", "Counselling note logged"]
  },
  {
    gate: "G3",
    label: "Application-ready",
    stage: "application_ready",
    owner: "Applications officer",
    maxDays: 7,
    exitChecklist: [
      "Programme and institution selected and confirmed with student",
      "Full destination document checklist complete and verified (two-pass)",
      "Statement / personal statement drafted and reviewed",
      "Financial evidence assembled in required format"
    ]
  },
  {
    gate: "G4",
    label: "Submitted",
    stage: "submitted",
    owner: "Applications officer",
    maxDays: 10,
    exitChecklist: ["Application lodged", "Reference logged", "Student updated"]
  },
  {
    gate: "G5",
    label: "Offer secured",
    stage: "offer_secured",
    owner: "Applications officer",
    maxDays: 5,
    exitChecklist: ["Offer letter received", "Offer explained", "Acceptance decision logged"]
  },
  {
    gate: "G6",
    label: "Visa-ready",
    stage: "visa_lodged",
    owner: "Visa support",
    maxDays: 14,
    exitChecklist: [
      "Offer letter and acceptance in hand",
      "Complete evidence pack assembled and internally consistent",
      "Student briefed on interview and on arrival realities",
      "Application lodged; reference and dates logged in CRM"
    ]
  },
  {
    gate: "G7",
    label: "Placed",
    stage: "placed",
    owner: "Quality lead",
    maxDays: 2,
    exitChecklist: ["Student enrolled", "Started confirmed", "Testimonial requested", "Referral requested"]
  }
] as const satisfies Array<{
  gate: "G0" | "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7";
  label: string;
  stage: StudentStage;
  owner: string;
  maxDays: number;
  exitChecklist: string[];
}>;

export const qaStageLabels = {
  intake: "Intake",
  counselling: "Counselling",
  application: "Application",
  visa: "Visa Support"
} as const;

export const qaStageChecklists = {
  intake: ["Profile complete", "Documents uploaded"],
  counselling: ["Counselling sign-off", "Budget confirmed"],
  application: ["Documents verified", "Fee payment confirmed"],
  visa: ["Visa checklist generated", "Visa approved"]
} as const;

export const segmentMeta: Record<
  SegmentKey,
  { label: string; tone: string; description: string; icon: string; color: string }
> = {
  ready_to_go: {
    label: "Ready To Go",
    tone: "bg-emerald-100 text-emerald-800",
    description: "Has paid and is actively moving through the process.",
    icon: rocketOutline,
    color: "#10B981"
  },
  needs_guidance: {
    label: "Needs Guidance",
    tone: "bg-sky-100 text-sky-800",
    description: "Early-stage lead that needs structured follow-up.",
    icon: searchOutline,
    color: "#3B82F6"
  },
  price_sensitive: {
    label: "Price Sensitive",
    tone: "bg-amber-100 text-amber-800",
    description: "Shows interest but payment flexibility matters.",
    icon: cashOutline,
    color: "#F59E0B"
  },
  ielts_focused: {
    label: "IELTS Focused",
    tone: "bg-violet-100 text-violet-800",
    description: "Strong IELTS-only or IELTS-first interest.",
    icon: bookOutline,
    color: "#8B5CF6"
  },
  vip: {
    label: "VIP",
    tone: "bg-rose-100 text-rose-800",
    description: "High-value student with full payment or advanced progress.",
    icon: trophyOutline,
    color: "#EF4444"
  },
  unsegmented: {
    label: "Unsegmented",
    tone: "bg-slate-100 text-slate-700",
    description: "Not yet classified by the segmentation rules.",
    icon: helpCircleOutline,
    color: "#9CA3AF"
  }
};

export function getSegmentMeta(segment?: string | null) {
  if (!segment) {
    return segmentMeta.unsegmented;
  }

  return segmentMeta[segment as SegmentKey] ?? segmentMeta.unsegmented;
}
