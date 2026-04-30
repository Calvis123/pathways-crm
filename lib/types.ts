export type AppRole =
  | "admin"
  | "hr"
  | "consultant"
  | "marketing"
  | "operations"
  | "employee"
  | "ielts_trainer";

export type StudentStage =
  | "lead"
  | "inquiry"
  | "consultation"
  | "application"
  | "visa"
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
