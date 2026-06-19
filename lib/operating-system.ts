import type {
  ApplicationRecord,
  DecisionRecommendation,
  DocumentRecord,
  MarketConfig,
  Partner,
  PartnerAgreement,
  PartnerKpi,
  PaymentRecord,
  PlacementRecord,
  QaCheckpoint,
  QaGateResult,
  RevenueBlendItem,
  Student,
  StudentProfile,
  StudentStage,
  VisaRecord
} from "@/lib/types";
import { franchiseGateDefinitions } from "@/lib/constants";

type StudentContext = {
  student: Student;
  profile?: StudentProfile;
  documents: DocumentRecord[];
  payments: PaymentRecord[];
  applications: ApplicationRecord[];
  visaRecords: VisaRecord[];
  qaCheckpoints?: QaCheckpoint[];
};

export const operatingRhythm = [
  {
    cadence: "Daily",
    meeting: "Stand-up on the stuck list",
    question: "What is stalled and who is unblocking it today?",
    owner: "Desk lead"
  },
  {
    cadence: "Weekly",
    meeting: "Pipeline review + error log",
    question: "Are gates converting, and what error do we fix this week?",
    owner: "Quality lead"
  },
  {
    cadence: "Monthly",
    meeting: "Revenue blend + partner review",
    question: "Is the revenue mix safe and are partners delivering?",
    owner: "Manager"
  },
  {
    cadence: "Quarterly",
    meeting: "Partner business reviews + market refresh",
    question: "Which relationships deepen, and what changed in each market?",
    owner: "Partnerships"
  }
] as const;

export const stationMap = [
  { station: "Front desk / Intake", owns: "Lead capture, qualification, scheduling", gates: "G0-G1" },
  { station: "Counsellor", owns: "Counselling, pathway recommendation, conversion", gates: "G1-G2" },
  { station: "Applications officer", owns: "Document assembly, applications, personal statements", gates: "G3-G5" },
  { station: "Visa support", owns: "Evidence packs, lodging, interview prep", gates: "G6" },
  { station: "Partnerships", owns: "Institution, platform, and channel relationships", gates: "Module B" },
  { station: "Quality lead", owns: "Gate QA, error log, satisfaction pulse", gates: "All gates" }
];

export const promptTemplates = [
  {
    title: "Investor / Partner Deck Generator",
    role: "Strategy analyst building an investor-ready deck for Barak Pathways.",
    task: "Produce a 10-slide deck outline using real CRM traction, ask, and Country Pack market data.",
    output: "Slide title, three bullets, one data point, and two-line speaker notes.",
    guardrails: ["Use only provided numbers", "Flag missing data as NEEDS DATA", "No invented statistics"]
  },
  {
    title: "Partner Negotiation Script Generator",
    role: "Deal strategist preparing a retainer plus milestone negotiation.",
    task: "Draft value statement, anchored offer, objections, concession ladder, and contract guardrails.",
    output: "Negotiation script with jurisdiction, data protection, payment timing, and pipeline tail clauses.",
    guardrails: ["Never propose below walk-away", "Pair every concession with an ask", "Use Kenya DPA 2019 where Kenya applies"]
  },
  {
    title: "CRM Pipeline Configurator",
    role: "CRM systems designer configuring the seven gates.",
    task: "Map G0-G7 entry and exit criteria, required properties, automations, and dashboard widgets.",
    output: "Pipeline spec with max five above-fold dashboard widgets including the stuck list.",
    guardrails: ["Targets over raw numbers", "Color only exceptions", "No decorative icons"]
  },
  {
    title: "Counselling Note Assistant",
    role: "Admissions writing assistant working from verified counselling notes.",
    task: "Draft a personal statement or SOP in the student's voice.",
    output: "First-person draft plus a facts-to-verify checklist.",
    guardrails: ["No fabricated achievements", "Mark unverified details as CONFIRM", "Keep claims consistent across documents"]
  },
  {
    title: "Market Adaptation Researcher",
    role: "Research analyst maintaining a Country Pack.",
    task: "Summarize current study/work pathway, documents, processing times, work rights, pitfalls, and verification date.",
    output: "Country Pack update with official-source facts and uncertainty notes.",
    guardrails: ["Cite official sources", "Date every figure", "Say uncertain rather than guessing"]
  }
];

export function getDecisionRecommendation(profile?: StudentProfile): DecisionRecommendation {
  if (!profile?.budget_range) {
    return {
      recommendation: "Budget confirmation required",
      confidence: 0,
      criteria: ["Budget range is missing"],
      error: "Missing budget field blocks programme/destination matching."
    };
  }

  const goal = profile.career_goal;
  const criteria = [`Budget: ${profile.budget_range}`, goal ? `Goal: ${goal}` : "Goal not specified"];

  if (profile.budget_range === "high" && goal === "research") {
    return { recommendation: "Research University", confidence: 92, criteria };
  }

  if (profile.budget_range === "high" && goal === "professional") {
    return { recommendation: "Professional Programme", confidence: 88, criteria };
  }

  if (profile.budget_range === "medium" && goal === "academic") {
    return { recommendation: "Regional University", confidence: 84, criteria };
  }

  if (profile.budget_range === "medium" && goal === "skills") {
    return { recommendation: "Skills Certification", confidence: 86, criteria };
  }

  if (profile.budget_range === "low" && goal === "flexible") {
    return { recommendation: "Online Programme", confidence: 82, criteria };
  }

  if (profile.budget_range === "low" && goal === "local") {
    return { recommendation: "Local Institution", confidence: 80, criteria };
  }

  const fallback =
    profile.budget_range === "high"
      ? "Research University"
      : profile.budget_range === "medium"
        ? "Regional University"
        : "Online Programme";

  return {
    recommendation: fallback,
    confidence: 68,
    criteria: [...criteria, "Defaulted because the career path is incomplete"]
  };
}

export function getQaGateResult(context: StudentContext): QaGateResult {
  const { student, profile, documents, payments, applications, visaRecords } = context;
  const verifiedDocuments = documents.filter((document) => document.status === "verified");
  const uploadedIdentityDocument = documents.some((document) => {
    const type = document.document_type.toLowerCase();
    return (type.includes("passport") || type.includes("id")) && ["uploaded", "verified"].includes(document.status);
  });
  const paidApplication = payments.some(
    (payment) => payment.payment_type === "application" && payment.status === "paid" && payment.amount > 0
  );
  const acceptedApplication = applications.some((application) => application.status === "accepted");
  const visaChecklist = visaRecords.find((record) => record.checklist_data.length > 0);
  const approvedVisa = visaRecords.find((record) => record.status === "approved" && Boolean(record.approved_at));

  if (student.stage === "lead" || student.stage === "inquiry") {
    const checks = [
      {
        label: "Profile complete",
        passed: Boolean(student.full_name && student.email && student.phone && student.country_interest && student.program_level),
        detail: "Requires name, email, phone, destination, and programme level."
      },
      {
        label: "Documents uploaded",
        passed: uploadedIdentityDocument,
        detail: "Requires an uploaded or verified passport/ID document."
      }
    ];

    return { stage: "intake", passed: checks.every((check) => check.passed), checks };
  }

  if (student.stage === "consultation") {
    const checks = [
      {
        label: "Counselling sign-off",
        passed: student.consultation_status === "completed",
        detail: "Consultation status must be completed by the assigned consultant."
      },
      {
        label: "Budget confirmed",
        passed: Boolean(profile?.budget_range && profile.intake_script_data?.budget_confirmed),
        detail: "Budget range and intake budget confirmation are required."
      }
    ];

    return { stage: "counselling", passed: checks.every((check) => check.passed), checks };
  }

  if (student.stage === "application" || student.stage === "enrolled") {
    const checks = [
      {
        label: "Documents verified",
        passed: verifiedDocuments.length > 0,
        detail: "At least one student document must be verified."
      },
      {
        label: "Fee payment confirmed",
        passed: paidApplication || (student.payment_paid ?? 0) > 0,
        detail: "Application payment proof or student payment record is required."
      }
    ];

    return { stage: "application", passed: checks.every((check) => check.passed), checks };
  }

  const checks = [
    {
      label: "Visa checklist generated",
      passed: Boolean(visaChecklist),
      detail: "Visa record must include a generated checklist from market configuration."
    },
    {
      label: "Visa approved",
      passed: Boolean(approvedVisa) || student.visa_status === "approved",
      detail: "Visa status requires approval and an approval date before placement."
    }
  ];

  return { stage: "visa", passed: checks.every((check) => check.passed), checks };
}

export function getFranchiseGateExitChecks(context: StudentContext, gate: (typeof franchiseGateDefinitions)[number]) {
  const { student, profile, documents, payments, applications, visaRecords, qaCheckpoints = [] } = context;
  const hasNextAction = Boolean(student.next_action_date);
  const hasVerifiedDocument = documents.some((document) => document.status === "verified");
  const application = applications[0];
  const visaRecord = visaRecords[0];
  const manuallyTicked = new Set(
    qaCheckpoints
      .filter((checkpoint) => checkpoint.entity_type === "student" && checkpoint.entity_id === student.id && checkpoint.passed)
      .map((checkpoint) => checkpoint.label)
  );

  const checks: Record<string, boolean> = {
    "Contact logged": Boolean(student.phone || student.email),
    "Lead source logged": Boolean(student.lead_source),
    "Destination interest logged": Boolean(student.country_interest),
    "Next action scheduled": hasNextAction,
    "Fit assessed": Boolean(profile?.career_goal || student.program_level),
    "Funds assessed": Boolean(profile?.budget_range || (student.payment_amount ?? 0) > 0),
    "Intent confirmed": Boolean(student.notes || profile?.intake_script_data?.career_aspiration),
    "Timeline realistic": hasNextAction,
    "Destination interest and motivation captured": Boolean(student.country_interest && (student.notes || profile?.intake_script_data?.career_aspiration)),
    "English level, qualification and funds assessed honestly": Boolean(profile?.language_proficiency || profile?.academic_history || profile?.budget_range),
    "Timeline realistic against intake dates": hasNextAction,
    "Lead source recorded; next action scheduled": Boolean(student.lead_source && hasNextAction),
    "Advisory agreement signed": Boolean(student.advisory_agreement_signed),
    "Deposit received": (student.deposit_paid ?? 0) > 0 || (student.consultation_upfront_paid ?? 0) > 0,
    "Counselling note logged": Boolean(student.notes),
    "Programme selected": Boolean(student.university_name || application?.programme_id),
    "Full documents verified": hasVerifiedDocument,
    "Statement reviewed": Boolean(profile?.intake_script_data?.statement_reviewed),
    "Financial evidence assembled": Boolean(profile?.intake_script_data?.financial_evidence_assembled),
    "Programme and institution selected and confirmed with student": Boolean(student.university_name || application?.programme_id),
    "Full destination document checklist complete and verified (two-pass)": hasVerifiedDocument,
    "Statement / personal statement drafted and reviewed": Boolean(profile?.intake_script_data?.statement_reviewed),
    "Financial evidence assembled in required format": Boolean(profile?.intake_script_data?.financial_evidence_assembled),
    "Application lodged": Boolean(application?.submitted_at || student.application_reference),
    "Reference logged": Boolean(student.application_reference || visaRecord?.submitted_at),
    "Student updated": Boolean(student.updated_at),
    "Offer letter received": Boolean(student.offer_letter_received || application?.offer_letter_url),
    "Offer explained": Boolean(profile?.intake_script_data?.offer_explained),
    "Acceptance decision logged": Boolean(application?.accepted_at || application?.status === "accepted"),
    "Evidence pack complete": Boolean(visaRecord?.checklist_data?.length && visaRecord.checklist_data.every((item) => item.done)),
    "Interview briefing done": Boolean(profile?.intake_script_data?.interview_briefed),
    "Visa lodged": Boolean(visaRecord?.submitted_at || student.visa_status === "submitted" || student.visa_status === "approved"),
    "Offer letter and acceptance in hand": Boolean(student.offer_letter_received || application?.offer_letter_url || application?.status === "accepted"),
    "Complete evidence pack assembled and internally consistent": Boolean(visaRecord?.checklist_data?.length && visaRecord.checklist_data.every((item) => item.done)),
    "Student briefed on interview and on arrival realities": Boolean(profile?.intake_script_data?.interview_briefed),
    "Application lodged; reference and dates logged in CRM": Boolean(student.application_reference || visaRecord?.submitted_at),
    "Student enrolled": Boolean(student.enrollment_date || student.stage === "placed" || student.stage === "employment"),
    "Started confirmed": Boolean(student.stage === "placed" || student.stage === "employment"),
    "Testimonial requested": Boolean(student.testimonial_requested),
    "Referral requested": Boolean(student.referral_requested)
  };

  return gate.exitChecklist.map((label) => ({ label, passed: manuallyTicked.has(label) || checks[label] || false }));
}

export function getGateForStage(stage: StudentStage) {
  return (
    franchiseGateDefinitions.find((definition) => definition.stage === stage) ??
    franchiseGateDefinitions.find((definition) => definition.stage === "lead")!
  );
}

export function calculateDaysInGate(student: Student) {
  return Math.max(0, Math.floor((Date.now() - new Date(student.updated_at ?? student.created_at).getTime()) / (24 * 60 * 60 * 1000)));
}

export function calculateRevenueBlend(records: Array<{ type: string; amount: number }>): RevenueBlendItem[] {
  const streams = ["retainer", "commission", "royalty", "bonus"] as const;
  const total = records.reduce((sum, record) => sum + record.amount, 0);
  const commissionAmount = records.filter((record) => record.type === "commission").reduce((sum, record) => sum + record.amount, 0);
  const predictableAmount = records
    .filter((record) => record.type === "retainer" || record.type === "royalty")
    .reduce((sum, record) => sum + record.amount, 0);

  return streams.map((stream) => {
    const amount = records.filter((record) => record.type === stream).reduce((sum, record) => sum + record.amount, 0);
    const share = total === 0 ? 0 : Number(((amount / total) * 100).toFixed(1));
    const status =
      stream === "commission" && total > 0 && commissionAmount / total > 0.7
        ? "fragile"
        : stream === "retainer" || stream === "royalty"
          ? predictableAmount > 0
            ? "healthy"
            : "watch"
          : "healthy";

    return {
      stream,
      amount,
      share,
      target:
        stream === "commission"
          ? "Keep below 70%"
          : stream === "retainer" || stream === "royalty"
            ? "Cover fixed costs"
            : "Growth upside",
      status
    };
  });
}

export function assertStageGateAllowsTransition(context: StudentContext, nextStage: StudentStage) {
  const ordered: StudentStage[] = ["lead", "inquiry", "consultation", "application", "visa", "placed", "employment"];
  const currentIndex = ordered.indexOf(context.student.stage);
  const nextIndex = ordered.indexOf(nextStage);

  if (currentIndex === -1 || nextIndex === -1 || nextIndex <= currentIndex || nextStage === "employment") {
    return;
  }

  const result = getQaGateResult(context);
  if (result.passed) return;

  const missing = result.checks.filter((check) => !check.passed).map((check) => check.label).join(", ");
  throw new Error(`Stage gate blocked: ${result.stage} requires ${missing}.`);
}

export function buildVisaChecklist(country: string | null | undefined, marketConfigs: MarketConfig[]) {
  const config = marketConfigs.find(
    (item) => item.active && item.country.toLowerCase() === String(country ?? "").toLowerCase()
  );

  return (config?.visa_requirements ?? []).map((requirement) => ({
    label: requirement.label,
    done: false
  }));
}

export function calculatePartnerKpis(input: {
  partners: Partner[];
  agreements: PartnerAgreement[];
  applications: ApplicationRecord[];
  programmes: Array<{ id: string; partner_id: string }>;
  placements: PlacementRecord[];
  revenueRecords: Array<{ partner_id: string | null; amount: number }>;
}): PartnerKpi[] {
  return input.partners.map((partner) => {
    const programmeIds = new Set(input.programmes.filter((programme) => programme.partner_id === partner.id).map((programme) => programme.id));
    const partnerApplications = input.applications.filter((application) => programmeIds.has(application.programme_id));
    const acceptedApplications = partnerApplications.filter((application) => application.status === "accepted");
    const partnerPlacements = input.placements.filter((placement) => placement.partner_id === partner.id);
    const revenue = input.revenueRecords
      .filter((record) => record.partner_id === partner.id)
      .reduce((sum, record) => sum + record.amount, 0);
    const partnershipCost = input.agreements
      .filter((agreement) => agreement.partner_id === partner.id)
      .reduce((sum, agreement) => sum + (agreement.retainer_amount ?? 0), 0);

    return {
      partner_id: partner.id,
      partner_name: partner.name,
      conversion_rate:
        partnerApplications.length === 0 ? 0 : Number(((acceptedApplications.length / partnerApplications.length) * 100).toFixed(1)),
      retention_rate:
        acceptedApplications.length === 0 ? 0 : Number(((partnerPlacements.length / acceptedApplications.length) * 100).toFixed(1)),
      roi: partnershipCost === 0 ? revenue : Number((revenue / partnershipCost).toFixed(2)),
      response_time_hours: partner.response_time_hours,
      satisfaction_score: partner.satisfaction_score
    };
  });
}
