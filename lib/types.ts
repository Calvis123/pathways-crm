export type AppRole =
  | "admin"
  | "hr"
  | "consultant"
  | "marketing"
  | "operations"
  | "employee"
  | "ielts_trainer"
  | "partner";

export type StudentStage =
  | "lead"
  | "qualified"
  | "inquiry"
  | "engaged"
  | "consultation"
  | "application_ready"
  | "application"
  | "submitted"
  | "offer_secured"
  | "visa"
  | "visa_lodged"
  | "enrolled"
  | "placed"
  | "employment"
  | "lost";

export type ConsultationStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type SegmentKey =
  | "ready_to_go"
  | "needs_guidance"
  | "price_sensitive"
  | "ielts_focused"
  | "vip"
  | "unsegmented";

export type DocumentStatus = "pending" | "uploaded" | "verified" | "rejected";
export type CommissionStatus = "pending" | "invoiced" | "paid" | "overdue";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "partial" | "paid" | "overdue" | "refunded";
export type PaymentMethod = "cash" | "bank_transfer" | "mpesa" | "card";
export type TrackerCommissionStatus = "pending" | "paid" | "overdue";
export type PaymentType = "consultation" | "application" | "ielts" | "visa" | "tuition" | "other";
export type ReferralStatus = "new" | "contacted" | "converted" | "rewarded";
export type PortalAccessStatus = "active" | "inactive";
export type PortalDocumentStatus = "pending" | "approved" | "rejected" | "under_review";
export type NoteType = "general" | "call" | "meeting" | "email" | "whatsapp" | "payment" | "visa" | "important";
export type NotePriority = "low" | "medium" | "high" | "urgent";
export type ExpenseCategory =
  | "rent"
  | "salaries"
  | "marketing"
  | "utilities"
  | "office_supplies"
  | "travel"
  | "training"
  | "internet"
  | "software"
  | "other";
export type ExpensePaymentMethod = "cash" | "mpesa" | "bank" | "card";
export type PartnerType = "university" | "digital_skills_platform" | "employer";
export type PartnerAgreementStatus = "negotiation" | "legal_review" | "signed" | "active" | "renewal_due" | "cancelled";
export type ProgrammeLevel = "certificate" | "diploma" | "undergraduate" | "masters" | "professional" | "employment";
export type ApplicationStatus = "draft" | "submitted" | "accepted" | "rejected" | "deferred";
export type VisaRecordStatus = "not_started" | "checklist_generated" | "submitted" | "approved" | "rejected";
export type PlacementType = "admission" | "certification" | "employment";
export type RevenueRecordType = "retainer" | "commission" | "bonus";
export type RevenueStream = "retainer" | "commission" | "royalty" | "bonus";
export type TrainingModuleType = "onboarding" | "certification" | "skill_development";

export interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  passport_number?: string | null;
  location: string | null;
  country_interest: string | null;
  program_level: string | null;
  university_name: string | null;
  enrollment_date?: string | null;
  stage: StudentStage;
  consultation_requested: boolean;
  consultation_status: ConsultationStatus | null;
  consultation_date: string | null;
  next_action_date?: string | null;
  advisory_agreement_signed?: boolean;
  deposit_paid?: number | null;
  application_reference?: string | null;
  offer_letter_received?: boolean;
  testimonial_requested?: boolean;
  referral_requested?: boolean;
  visa_status: string | null;
  ielts_enrolled: boolean;
  ielts_amount?: number | null;
  ielts_payment_status?: "paid" | "unpaid" | null;
  ielts_overall_score?: number | null;
  ielts_session_count?: number | null;
  ielts_test_date?: string | null;
  payment_status: string | null;
  payment_due_date?: string | null;
  payment_amount?: number | null;
  payment_paid?: number | null;
  payment_date?: string | null;
  payment_method?: PaymentMethod | null;
  payment_notes?: string | null;
  commission_amount?: number | null;
  commission_status?: TrackerCommissionStatus | null;
  commission_due_date?: string | null;
  commission_paid_date?: string | null;
  commission_institution?: string | null;
  commission_notes?: string | null;
  consultation_upfront_paid: number;
  consultation_balance_paid: number;
  segment: SegmentKey | null;
  segment_score: number | null;
  lead_source: string | null;
  referral_code: string | null;
  notes: string | null;
  created_by: string | null;
  assigned_consultant_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  student_id: string;
  scheduled_at: string;
  status: ConsultationStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  student?: Pick<Student, "full_name" | "email" | "phone" | "country_interest" | "stage">;
}

export interface LocalDatabase {
  students: Student[];
  student_profiles: StudentProfile[];
  partners: Partner[];
  partner_agreements: PartnerAgreement[];
  programmes: Programme[];
  applications: ApplicationRecord[];
  visa_records: VisaRecord[];
  placements: PlacementRecord[];
  revenue_records: RevenueRecord[];
  qa_checkpoints: QaCheckpoint[];
  market_configs: MarketConfig[];
  consultant_training: ConsultantTraining[];
  consultations: Consultation[];
  documents: DocumentRecord[];
  commissions: CommissionRecord[];
  payments: PaymentRecord[];
  users: AppUserRecord[];
  referrals: ReferralRecord[];
  student_notes: StudentNote[];
  portal_access: PortalAccessRecord[];
  portal_messages: PortalMessage[];
  portal_activity: PortalActivity[];
  templates: EmailTemplate[];
  tasks: Task[];
  audit_logs: AuditLog[];
  expenses: ExpenseRecord[];
}

export interface StudentProfile {
  id: string;
  student_id: string;
  budget_range: "high" | "medium" | "low" | null;
  career_goal: "research" | "professional" | "academic" | "skills" | "flexible" | "local" | null;
  academic_history: string | null;
  preferred_destinations: string[] | null;
  language_proficiency: string | null;
  intake_script_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  student?: Pick<Student, "full_name" | "stage" | "country_interest">;
}

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  country: string | null;
  agreement_status: PartnerAgreementStatus;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  response_time_hours: number | null;
  satisfaction_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerAgreement {
  id: string;
  partner_id: string;
  agreement_type: RevenueRecordType;
  status: PartnerAgreementStatus;
  legal_review_complete: boolean;
  commission_rate: number | null;
  retainer_amount: number | null;
  bonus_criteria: Record<string, unknown> | null;
  fee_structure: Record<string, unknown>;
  onboarding_checklist: Array<{ label: string; done: boolean }>;
  signed_at: string | null;
  renewal_date: string | null;
  created_at: string;
  partner?: Pick<Partner, "name" | "type" | "country">;
}

export interface Programme {
  id: string;
  partner_id: string;
  name: string;
  destination: string;
  level: ProgrammeLevel;
  tuition_fee: number;
  currency: string;
  eligibility_criteria: Record<string, unknown>;
  active: boolean;
  created_at: string;
  partner?: Pick<Partner, "name" | "type">;
}

export interface ApplicationRecord {
  id: string;
  student_id: string;
  programme_id: string;
  status: ApplicationStatus;
  offer_letter_url: string | null;
  submitted_at: string | null;
  accepted_at: string | null;
  created_at: string;
  student?: Pick<Student, "full_name" | "stage">;
  programme?: Pick<Programme, "name" | "destination" | "tuition_fee">;
}

export interface VisaRecord {
  id: string;
  student_id: string;
  destination_country: string;
  status: VisaRecordStatus;
  checklist_data: Array<{ label: string; done: boolean }>;
  embassy_location: string | null;
  appointment_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  student?: Pick<Student, "full_name" | "stage">;
}

export interface PlacementRecord {
  id: string;
  student_id: string;
  programme_id: string | null;
  partner_id: string | null;
  type: PlacementType;
  institution: string | null;
  role_title: string | null;
  salary_range: string | null;
  satisfaction_score: number | null;
  placed_at: string;
  created_at: string;
  student?: Pick<Student, "full_name" | "stage">;
  partner?: Pick<Partner, "name" | "type">;
}

export interface RevenueRecord {
  id: string;
  student_id: string | null;
  partner_id: string | null;
  type: RevenueStream;
  amount: number;
  currency: string;
  recognized_at: string;
  notes: string | null;
  created_at: string;
  partner?: Pick<Partner, "name" | "type">;
}

export interface QaCheckpoint {
  id: string;
  entity_type: "student" | "application" | "visa_record" | "partner_agreement" | "partner";
  entity_id: string;
  stage: "intake" | "counselling" | "application" | "visa" | "partner_agreement" | "partner_onboarding" | "partner_performance";
  label: string;
  passed: boolean;
  checklist_data: Record<string, unknown> | null;
  signed_off_by: string | null;
  signed_off_at: string | null;
  created_at: string;
}

export interface MarketConfig {
  id: string;
  country: string;
  language: string;
  active: boolean;
  visa_requirements: Array<{ label: string; timeline?: string; fee?: string }>;
  policy_notes: string;
  market_owner: string | null;
  official_sources: Array<{ label: string; url: string; last_checked: string }>;
  last_verified_at: string | null;
  fee_configuration: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ConsultantTraining {
  id: string;
  consultant_username: string;
  module_name: string;
  module_type: TrainingModuleType;
  completed: boolean;
  score: number | null;
  certified_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface DecisionRecommendation {
  recommendation: string;
  confidence: number;
  criteria: string[];
  error?: string;
}

export interface QaGateResult {
  stage: string;
  passed: boolean;
  checks: Array<{ label: string; passed: boolean; detail: string }>;
}

export interface PartnerKpi {
  partner_id: string;
  partner_name: string;
  conversion_rate: number;
  retention_rate: number;
  roi: number;
  response_time_hours: number | null;
  satisfaction_score: number | null;
}

export interface OperatingSystemSnapshot {
  partners: Partner[];
  partnerAgreements: PartnerAgreement[];
  programmes: Programme[];
  applications: ApplicationRecord[];
  visaRecords: VisaRecord[];
  placements: PlacementRecord[];
  revenueRecords: RevenueRecord[];
  qaCheckpoints: QaCheckpoint[];
  marketConfigs: MarketConfig[];
  consultantTraining: ConsultantTraining[];
  studentProfiles: StudentProfile[];
  partnerKpis: PartnerKpi[];
  qaGateResults: QaGateResult[];
  recommendations: Array<{ student: Pick<Student, "id" | "full_name" | "stage">; recommendation: DecisionRecommendation }>;
  franchiseGates: FranchiseGateStatus[];
  stuckStudents: StuckStudent[];
  revenueBlend: RevenueBlendItem[];
  operatingRhythm: OperatingRhythmItem[];
  stationMap: StationMapItem[];
  promptTemplates: PromptTemplate[];
  validationChecklist: ValidationChecklistGroup[];
  metrics: {
    placementRate: number;
    averageSatisfaction: number;
    partnerRoi: number;
    averageTimeToPlacementDays: number;
    pipelineConversion: number;
    qaComplianceRate: number;
  };
}

export interface FranchiseGateStatus {
  gate: "G0" | "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7";
  label: string;
  stage: StudentStage;
  owner: string;
  maxDays: number;
  count: number;
  exitChecklist: Array<{ label: string; passed: boolean }>;
}

export interface StuckStudent {
  student_id: string;
  full_name: string;
  gate: string;
  stage: StudentStage;
  daysInGate: number;
  maxDays: number;
  owner: string;
  nextActionDate: string | null;
}

export interface RevenueBlendItem {
  stream: RevenueStream;
  amount: number;
  share: number;
  target: string;
  status: "healthy" | "watch" | "fragile";
}

export interface OperatingRhythmItem {
  cadence: "Daily" | "Weekly" | "Monthly" | "Quarterly";
  meeting: string;
  question: string;
  owner: string;
}

export interface StationMapItem {
  station: string;
  owns: string;
  gates: string;
}

export interface PromptTemplate {
  title: string;
  role: string;
  task: string;
  output: string;
  guardrails: string[];
}

export interface ValidationChecklistGroup {
  title: string;
  items: Array<{ label: string; passed: boolean }>;
}

export interface DocumentRecord {
  id: string;
  student_id: string;
  document_type: string;
  original_filename: string;
  file_url: string | null;
  file_size: number | null;
  status: DocumentStatus;
  review_notes: string | null;
  uploaded_by: string | null;
  reviewed_by: string | null;
  uploaded_at: string;
  reviewed_at: string | null;
  student?: Pick<Student, "full_name" | "stage">;
}

export interface CommissionRecord {
  id: string;
  student_id: string;
  university_name: string;
  tuition_fee: number;
  commission_rate: number;
  commission_amount: number;
  currency: string;
  status: CommissionStatus;
  due_date: string | null;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  student?: Pick<Student, "full_name" | "stage">;
}

export interface PaymentRecord {
  id: string;
  student_id: string;
  payment_type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  reference_number: string | null;
  notes: string | null;
  paid_at: string | null;
  created_by?: string | null;
  created_at: string;
  student?: Pick<Student, "full_name" | "stage" | "email">;
}

export interface AppUserRecord {
  id: string;
  username: string;
  password?: string | null;
  full_name: string;
  email: string;
  role: AppRole;
  status: "active" | "inactive";
  phone: string | null;
  last_login_at: string | null;
  created_at: string;
}

export interface ReferralRecord {
  id: string;
  referrer_name: string;
  referrer_email: string | null;
  referrer_phone: string | null;
  referral_code: string;
  referred_student_name: string;
  referred_student_email: string | null;
  status: ReferralStatus;
  reward_amount: number;
  notes: string | null;
  created_at: string;
}

export interface StudentNote {
  id: string;
  student_id: string;
  created_by: string | null;
  creator_name: string | null;
  note_text: string;
  note_type: NoteType;
  priority: NotePriority;
  is_private: boolean;
  tags: string | null;
  reminder_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunicationLog extends StudentNote {
  student?: Pick<Student, "full_name" | "email" | "stage">;
}

export interface PortalAccessRecord {
  id: string;
  student_id: string;
  access_token: string;
  token_expires_at: string;
  password_hash: string | null;
  must_change_password: boolean;
  password_reset_token: string | null;
  password_reset_expires_at: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  student?: Pick<Student, "full_name" | "email" | "stage">;
}

export interface PortalMessage {
  id: string;
  student_id: string;
  subject: string;
  message: string;
  direction: "crm_to_student" | "student_to_crm";
  is_read: boolean;
  created_at: string;
  student?: Pick<Student, "full_name" | "email">;
}

export interface PortalActivity {
  id: string;
  student_id: string;
  activity_type: string;
  activity_details: string | null;
  created_at: string;
  student?: Pick<Student, "full_name" | "email">;
}

export interface StudentActivityEvent {
  id: string;
  student_id: string;
  occurred_at: string;
  channel: "call" | "meeting" | "email" | "whatsapp" | "reminder" | "portal" | "document" | "payment" | "note";
  direction: "incoming" | "outgoing" | "internal";
  source: "note" | "consultation" | "portal_message" | "document" | "payment";
  title: string;
  description: string;
  actor_name: string | null;
  meta: string | null;
}

export type LeadTemperatureStatus = "cold" | "warm" | "hot";

export interface LeadTemperatureSnapshot {
  studentId: string;
  score: number;
  status: LeadTemperatureStatus;
  label: "Cold" | "Warm" | "Hot";
  colorName: "Yellow" | "Green" | "Red";
  daysSinceLastActivity: number | null;
  contactCount: number;
  responseCount: number;
  engagementCount: number;
  followUpCount: number;
  highIntentCount: number;
  lastInteractionAt: string | null;
}

export interface SegmentSummary {
  segment: SegmentKey;
  count: number;
  total_value: number;
}

export interface EmailTemplate {
  id: string;
  template_name: string;
  subject: string;
  body: string;
  category: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  assigned_to: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  related_id: string | null;
  record_label: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  actor_name: string | null;
}

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  expense_date: string;
  payment_method: ExpensePaymentMethod | null;
  receipt_number: string | null;
  vendor: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalStudents: number;
  placedStudents: number;
  consultationRequests: number;
  totalRevenue: number;
  pendingRevenue: number;
  overdueCommissions: number;
  conversionRate: number;
}

export interface ReportSummary {
  totalPayments: number;
  paidPayments: number;
  totalPaymentValue: number;
  pendingPaymentValue: number;
  activeUsers: number;
  totalReferrals: number;
  convertedReferrals: number;
}
