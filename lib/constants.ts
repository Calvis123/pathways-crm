import type { SegmentKey, StudentStage } from "@/lib/types";

export const stageOrder: StudentStage[] = [
  "lead",
  "inquiry",
  "consultation",
  "application",
  "visa",
  "enrolled",
  "placed",
  "employment",
  "lost"
];

export const stageLabels: Record<StudentStage, string> = {
  lead: "Lead",
  inquiry: "Inquiry",
  consultation: "Consultation",
  application: "Application",
  visa: "Visa",
  enrolled: "Enrolled",
  placed: "Placed",
  employment: "Employment",
  lost: "Lost"
};

export const segmentMeta: Record<
  SegmentKey,
  { label: string; tone: string; description: string; icon: string; color: string }
> = {
  ready_to_go: {
    label: "Ready To Go",
    tone: "bg-emerald-100 text-emerald-800",
    description: "Has paid and is actively moving through the process.",
    icon: "🚀",
    color: "#10B981"
  },
  needs_guidance: {
    label: "Needs Guidance",
    tone: "bg-sky-100 text-sky-800",
    description: "Early-stage lead that needs structured follow-up.",
    icon: "🔍",
    color: "#3B82F6"
  },
  price_sensitive: {
    label: "Price Sensitive",
    tone: "bg-amber-100 text-amber-800",
    description: "Shows interest but payment flexibility matters.",
    icon: "💰",
    color: "#F59E0B"
  },
  ielts_focused: {
    label: "IELTS Focused",
    tone: "bg-violet-100 text-violet-800",
    description: "Strong IELTS-only or IELTS-first interest.",
    icon: "📚",
    color: "#8B5CF6"
  },
  vip: {
    label: "VIP",
    tone: "bg-rose-100 text-rose-800",
    description: "High-value student with full payment or advanced progress.",
    icon: "👑",
    color: "#EF4444"
  },
  unsegmented: {
    label: "Unsegmented",
    tone: "bg-slate-100 text-slate-700",
    description: "Not yet classified by the segmentation rules.",
    icon: "❓",
    color: "#9CA3AF"
  }
};

export function getSegmentMeta(segment?: string | null) {
  if (!segment) {
    return segmentMeta.unsegmented;
  }

  return segmentMeta[segment as SegmentKey] ?? segmentMeta.unsegmented;
}
