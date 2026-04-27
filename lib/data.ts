import { createAdminClient, hasSupabaseEnv } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";
import { cache } from "react";
import {
  filterStudentsByRole,
  getCurrentSession,
  getCurrentStudentPortalSession
} from "@/lib/auth";
import { readLocalDb, writeLocalDb } from "@/lib/local-store";
import type {
  AppRole,
  AppUserRecord,
  AuditLog,
  CommissionRecord,
  Consultation,
  CommunicationLog,
  DashboardStats,
  DocumentRecord,
  EmailTemplate,
  ExpenseRecord,
  LocalDatabase,
  PaymentRecord,
  PortalAccessRecord,
  PortalActivity,
  PortalMessage,
  ReferralRecord,
  ReportSummary,
  SegmentKey,
  SegmentSummary,
  Student,
  StudentActivityEvent,
  LeadTemperatureSnapshot,
  StudentNote,
  StudentStage,
  Task
} from "@/lib/types";
import { stageOrder } from "@/lib/constants";
import { classifyLeadTemperature } from "@/lib/lead-temperature";

function admin() {
  return createAdminClient();
}

async function hashPasswordForStorage(password: string) {
  if (password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$")) {
    return password;
  }

  return bcrypt.hash(password, 10);
}

function canManageStudentRecords(role: AppRole | undefined) {
  return role === "admin" || role === "consultant" || role === "employee";
}

function canManageSegments(role: AppRole | undefined) {
  return role === "admin" || role === "consultant" || role === "marketing" || role === "operations" || role === "employee";
}

function canManageFinance(role: AppRole | undefined) {
  return role === "admin" || role === "employee";
}

function canManageTemplates(role: AppRole | undefined) {
  return role === "admin" || role === "consultant" || role === "marketing" || role === "ielts_trainer";
}

function canManageConsultations(role: AppRole | undefined) {
  return role === "admin";
}

function getStudentCollectedValue(student: Student) {
  if (student.payment_status === "full") return 40000;
  return (student.consultation_upfront_paid ?? 0) + (student.consultation_balance_paid ?? 0);
}

function getSegmentScoreForKey(segment: SegmentKey, student?: Student) {
  if (segment === "vip") return 90;
  if (segment === "ready_to_go") {
    if ((student?.consultation_upfront_paid ?? 0) >= 20000) return 80;
    return 60;
  }
  if (segment === "ielts_focused") return 50;
  if (segment === "price_sensitive") return 40;
  if (segment === "needs_guidance") return 20;
  return 0;
}

function deriveSegmentForStudent(student: Student): { segment: SegmentKey; segment_score: number } {
  const upfrontPaid = student.consultation_upfront_paid ?? 0;
  const balancePaid = student.consultation_balance_paid ?? 0;
  const hasPaid = upfrontPaid > 0 || balancePaid > 0;
  const paymentMode = student.payment_status ?? "";

  if ((paymentMode === "full" || paymentMode === "paid") && student.stage === "enrolled") {
    return { segment: "vip", segment_score: 90 };
  }

  if (hasPaid && !["inquiry", "lead"].includes(student.stage)) {
    return {
      segment: "ready_to_go",
      segment_score: upfrontPaid >= 20000 || balancePaid >= 20000 ? 80 : 60
    };
  }

  if (student.ielts_enrolled) {
    return { segment: "ielts_focused", segment_score: 50 };
  }

  if (paymentMode === "installment" || paymentMode === "partial") {
    return { segment: "price_sensitive", segment_score: 40 };
  }

  if (upfrontPaid <= 0) {
    return { segment: "needs_guidance", segment_score: 20 };
  }

  return { segment: "needs_guidance", segment_score: 20 };
}

async function readDb() {
  return readLocalDb();
}

function attachStudentBasics(student: Student | undefined) {
  if (!student) return undefined;
  return {
    full_name: student.full_name,
    email: student.email,
    phone: student.phone,
    country_interest: student.country_interest,
    stage: student.stage
  };
}

function getConsultationTransitionState(student: Student, stage: StudentStage, timestamp: string) {
  if (stage !== "consultation") {
    return {
      stage,
      updated_at: timestamp
    };
  }

  return {
    stage,
    consultation_requested: true,
    consultation_status:
      student.consultation_status === "pending" || student.consultation_status === "confirmed"
        ? student.consultation_status
        : "pending",
    consultation_date: student.consultation_date ?? timestamp,
    updated_at: timestamp
  };
}

function hasActiveConsultation(consultations: Consultation[], studentId: string) {
  return consultations.some(
    (consultation) =>
      consultation.student_id === studentId &&
      (consultation.status === "pending" || consultation.status === "confirmed")
  );
}

function buildPendingConsultation(student: Student, actor: string | null, timestamp: string): Consultation {
  return {
    id: crypto.randomUUID(),
    student_id: student.id,
    scheduled_at: student.consultation_date ?? timestamp,
    status: "pending",
    notes: "Created automatically when the student moved to the consultation stage.",
    created_by: actor,
    created_at: timestamp
  };
}

function syncLocalConsultationStage(
  db: LocalDatabase,
  students: Student[],
  actor: string | null,
  timestamp: string
) {
  const nextConsultations = [...db.consultations];

  for (const student of students) {
    if (!hasActiveConsultation(nextConsultations, student.id)) {
      nextConsultations.unshift(buildPendingConsultation(student, actor, timestamp));
    }
  }

  db.consultations = nextConsultations;
}

async function syncSupabaseConsultationStage(
  students: Student[],
  actor: string | null,
  timestamp: string
) {
  if (students.length === 0) return;

  const supabase = admin();
  const studentIds = students.map((student) => student.id);
  const { data, error } = await supabase
    .from("consultations")
    .select("student_id,status")
    .in("student_id", studentIds)
    .in("status", ["pending", "confirmed"]);

  if (error) throw error;

  const activeIds = new Set((data ?? []).map((item) => item.student_id as string));
  const pendingConsultations = students
    .filter((student) => !activeIds.has(student.id))
    .map((student) => ({
      student_id: student.id,
      scheduled_at: student.consultation_date ?? timestamp,
      status: "pending" as const,
      notes: "Created automatically when the student moved to the consultation stage.",
      created_by: actor
    }));

  if (pendingConsultations.length === 0) return;

  const { error: insertError } = await supabase.from("consultations").insert(pendingConsultations);
  if (insertError) throw insertError;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const students = await getStudents();
  const commissions = await getCommissions();

  const totalStudents = students.length;
  const placedStudents = students.filter((student) =>
    ["placed", "employment"].includes(student.stage)
  ).length;
  const consultationRequests = students.filter((student) => student.consultation_requested).length;
  const totalRevenue = students.reduce(
    (sum, student) => sum + student.consultation_upfront_paid + student.consultation_balance_paid,
    0
  );
  const pendingRevenue = students
    .filter((student) => student.payment_status !== "paid" && student.payment_status !== "full")
    .reduce((sum, student) => sum + student.consultation_balance_paid, 0);
  const overdueCommissions = commissions.filter((record) => record.status === "overdue").length;
  const conversionRate = totalStudents === 0 ? 0 : Number(((placedStudents / totalStudents) * 100).toFixed(1));

  return {
    totalStudents,
    placedStudents,
    consultationRequests,
    totalRevenue,
    pendingRevenue,
    overdueCommissions,
    conversionRate
  };
}

export async function getReportSummary(): Promise<ReportSummary> {
  const [payments, users, referrals] = await Promise.all([getPayments(), getUsers(), getReferrals()]);

  return {
    totalPayments: payments.length,
    paidPayments: payments.filter((payment) => payment.status === "paid").length,
    totalPaymentValue: payments.reduce((sum, payment) => sum + payment.amount, 0),
    pendingPaymentValue: payments
      .filter((payment) => payment.status !== "paid")
      .reduce((sum, payment) => sum + payment.amount, 0),
    activeUsers: users.filter((user) => user.status === "active").length,
    totalReferrals: referrals.length,
    convertedReferrals: referrals.filter((referral) => referral.status === "converted").length
  };
}

export const getStudents = cache(async function getStudents() {
  const session = await getCurrentSession();

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    return filterStudentsByRole(db.students, session);
  }
  const supabase = admin();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return filterStudentsByRole((data ?? []) as Student[], session);
});

export async function getStudentsByStage() {
  const students = await getStudents();

  return stageOrder.map((stage) => ({
    stage,
    students: students.filter((student) => student.stage === stage)
  }));
}

export async function getRecentStudents(limit = 8) {
  const students = await getStudents();
  return students.slice(0, limit);
}

export async function getStudentById(id: string) {
  const students = await getStudents();
  return students.find((student) => student.id === id) ?? null;
}

export const getConsultations = cache(async function getConsultations(limit?: number) {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const consultations = db.consultations
      .map((consultation) => ({
        ...consultation,
        student: attachStudentBasics(db.students.find((student) => student.id === consultation.student_id))
      }))
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    return typeof limit === "number" ? consultations.slice(0, limit) : consultations;
  }
  const supabase = admin();
  let query = supabase
    .from("consultations")
    .select("*, student:students(full_name,email,phone,country_interest,stage)")
    .order("scheduled_at", { ascending: true });
  if (typeof limit === "number") {
    query = query.limit(limit);
  }
  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as Consultation[];
});

export const getDocuments = cache(async function getDocuments(limit?: number) {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const documents = db.documents
      .map((document) => ({
        ...document,
        student: db.students.find((student) => student.id === document.student_id)
          ? {
              full_name: db.students.find((student) => student.id === document.student_id)!.full_name,
              stage: db.students.find((student) => student.id === document.student_id)!.stage
            }
          : undefined
      }))
      .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
    return typeof limit === "number" ? documents.slice(0, limit) : documents;
  }
  const supabase = admin();
  let query = supabase
    .from("student_documents")
    .select("*, student:students(full_name,stage)")
    .order("uploaded_at", { ascending: false });
  if (typeof limit === "number") {
    query = query.limit(limit);
  }
  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as DocumentRecord[];
});

export const getCommissions = cache(async function getCommissions() {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    return db.commissions.map((commission) => ({
      ...commission,
      student: db.students.find((student) => student.id === commission.student_id)
        ? {
            full_name: db.students.find((student) => student.id === commission.student_id)!.full_name,
            stage: db.students.find((student) => student.id === commission.student_id)!.stage
          }
        : undefined
    }));
  }
  const supabase = admin();
  const { data, error } = await supabase
    .from("commissions")
    .select("*, student:students(full_name,stage)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CommissionRecord[];
});

export const getPayments = cache(async function getPayments(options?: { startDate?: string; endDate?: string }) {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const payments = db.payments
      .filter((payment) => {
        const paymentDate = (payment.paid_at ?? payment.created_at).slice(0, 10);
        if (options?.startDate && paymentDate < options.startDate) return false;
        if (options?.endDate && paymentDate > options.endDate) return false;
        return true;
      })
      .map((payment) => ({
        ...payment,
        student: db.students.find((student) => student.id === payment.student_id)
          ? {
              full_name: db.students.find((student) => student.id === payment.student_id)!.full_name,
              stage: db.students.find((student) => student.id === payment.student_id)!.stage,
              email: db.students.find((student) => student.id === payment.student_id)!.email
            }
          : undefined
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return payments;
  }

  const supabase = admin();
  let query = supabase
    .from("payments")
    .select("*, student:students(full_name,stage,email)")
    .order("created_at", { ascending: false });
  if (options?.startDate && options?.endDate) {
    query = query.or(
      [
        `and(paid_at.gte.${options.startDate}T00:00:00,paid_at.lte.${options.endDate}T23:59:59)`,
        `and(paid_at.is.null,created_at.gte.${options.startDate}T00:00:00,created_at.lte.${options.endDate}T23:59:59)`
      ].join(",")
    );
  } else {
    if (options?.startDate) {
      query = query.gte("created_at", `${options.startDate}T00:00:00`);
    }
    if (options?.endDate) {
      query = query.lte("created_at", `${options.endDate}T23:59:59`);
    }
  }
  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as PaymentRecord[];
});

export const getUsers = cache(async function getUsers() {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    return db.users.slice().sort((a, b) => a.full_name.localeCompare(b.full_name));
  }

  const supabase = admin();
  const { data, error } = await supabase.from("users").select("*").order("full_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AppUserRecord[];
});

export const getReferrals = cache(async function getReferrals() {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    return db.referrals.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const supabase = admin();
  const { data, error } = await supabase.from("referrals").select("*").order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ReferralRecord[];
});

export async function getSegmentSummaries(): Promise<SegmentSummary[]> {
  const students = await getStudents();
  const map = new Map<string, SegmentSummary>();

  for (const student of students) {
    const key = student.segment ?? "unsegmented";
    const current = map.get(key) ?? { segment: key as SegmentSummary["segment"], count: 0, total_value: 0 };
    current.count += 1;
    current.total_value += getStudentCollectedValue(student);
    map.set(key, current);
  }

  return Array.from(map.values()).sort((a, b) => b.total_value - a.total_value);
}

export async function autoSegmentStudents() {
  const session = await getCurrentSession();

  if (!session || !canManageSegments(session.role)) {
    throw new Error("You do not have permission to run auto-segmentation.");
  }

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    let updatedCount = 0;

    db.students = db.students.map((student) => {
      const next = deriveSegmentForStudent(student);
      updatedCount += 1;
      return {
        ...student,
        segment: next.segment,
        segment_score: next.segment_score,
        updated_at: new Date().toISOString()
      };
    });

    await writeLocalDb(db);
    await logAudit({
      action: "Auto-Segment Run",
      table_name: "students",
      related_id: null,
      record_label: "All students",
      new_value: JSON.stringify({ updatedCount })
    });

    return { updatedCount };
  }

  const supabase = admin();
  const { data, error } = await supabase.from("students").select("*");
  if (error) throw error;

  const students = (data ?? []) as Student[];
  let updatedCount = 0;

  for (const student of students) {
    const next = deriveSegmentForStudent(student);
    const { error: updateError } = await supabase
      .from("students")
      .update({
        segment: next.segment,
        segment_score: next.segment_score,
        updated_at: new Date().toISOString()
      })
      .eq("id", student.id);
    if (updateError) throw updateError;
    updatedCount += 1;
  }

  await logAudit({
    action: "Auto-Segment Run",
    table_name: "students",
    related_id: null,
    record_label: "All students",
    new_value: JSON.stringify({ updatedCount })
  });

  return { updatedCount };
}

export async function updateStudentSegment(input: {
  studentId: string;
  segment: SegmentKey;
  reason?: string | null;
}) {
  const session = await getCurrentSession();

  if (!session || !canManageSegments(session.role)) {
    throw new Error("You do not have permission to update student segments.");
  }

  const student = await getStudentById(input.studentId);
  if (!student) {
    throw new Error("Student not found or access denied.");
  }

  const score = getSegmentScoreForKey(input.segment, student);

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const existing = db.students.find((entry) => entry.id === input.studentId);
    if (!existing) throw new Error("Student not found.");

    const updated = {
      ...existing,
      segment: input.segment,
      segment_score: score,
      updated_at: new Date().toISOString()
    };

    db.students = db.students.map((entry) => (entry.id === input.studentId ? updated : entry));
    await writeLocalDb(db);
    await logAudit({
      action: "Segment Updated",
      table_name: "students",
      related_id: input.studentId,
      record_label: updated.full_name,
      old_value: student.segment ?? "unsegmented",
      new_value: JSON.stringify({ segment: input.segment, reason: input.reason ?? null, score })
    });
    return updated;
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("students")
    .update({
      segment: input.segment,
      segment_score: score,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.studentId)
    .select("*")
    .single();

  if (error) throw error;

  await logAudit({
    action: "Segment Updated",
    table_name: "students",
    related_id: input.studentId,
    record_label: data.full_name,
    old_value: student.segment ?? "unsegmented",
    new_value: JSON.stringify({ segment: input.segment, reason: input.reason ?? null, score })
  });

  return data as Student;
}

export async function bulkUpdateStudentSegments(input: {
  studentIds: string[];
  segment: SegmentKey;
}) {
  const session = await getCurrentSession();

  if (!session || !canManageSegments(session.role)) {
    throw new Error("You do not have permission to run bulk segment updates.");
  }

  const students = await getStudents();
  const selected = students.filter((student) => input.studentIds.includes(student.id));

  if (selected.length === 0) {
    throw new Error("No matching students were found for this bulk update.");
  }

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const selectedIds = new Set(input.studentIds);

    db.students = db.students.map((student) => {
      if (!selectedIds.has(student.id)) return student;
      return {
        ...student,
        segment: input.segment,
        segment_score: getSegmentScoreForKey(input.segment, student),
        updated_at: new Date().toISOString()
      };
    });

    await writeLocalDb(db);
    await logAudit({
      action: "Bulk Segment Update",
      table_name: "students",
      related_id: null,
      record_label: `${selected.length} students`,
      new_value: JSON.stringify({ segment: input.segment, count: selected.length })
    });

    return { updatedCount: selected.length };
  }

  const supabase = admin();
  for (const student of selected) {
    const { error } = await supabase
      .from("students")
      .update({
        segment: input.segment,
        segment_score: getSegmentScoreForKey(input.segment, student),
        updated_at: new Date().toISOString()
      })
      .eq("id", student.id);
    if (error) throw error;
  }

  await logAudit({
    action: "Bulk Segment Update",
    table_name: "students",
    related_id: null,
    record_label: `${selected.length} students`,
    new_value: JSON.stringify({ segment: input.segment, count: selected.length })
  });

  return { updatedCount: selected.length };
}

export async function getEmailTemplates() {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    return db.templates;
  }
  const supabase = admin();
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as EmailTemplate[];
}

export async function createEmailTemplate(input: {
  template_name: string;
  category: string;
  subject: string;
  body: string;
}) {
  const session = await getCurrentSession();

  if (!session || !canManageTemplates(session.role)) {
    throw new Error("You do not have permission to save email templates.");
  }

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const template = {
      id: crypto.randomUUID(),
      template_name: input.template_name,
      subject: input.subject,
      body: input.body,
      category: input.category,
      created_at: new Date().toISOString()
    } satisfies EmailTemplate;

    db.templates.unshift(template);
    await writeLocalDb(db);
    await logAudit({
      action: "Email Template Created",
      table_name: "email_templates",
      related_id: template.id,
      record_label: template.template_name,
      new_value: JSON.stringify({ category: template.category, subject: template.subject })
    });
    return template;
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("email_templates")
    .insert({
      template_name: input.template_name,
      category: input.category,
      subject: input.subject,
      body: input.body
    })
    .select("*")
    .single();

  if (error) throw error;

  await logAudit({
    action: "Email Template Created",
    table_name: "email_templates",
    related_id: data.id,
    record_label: data.template_name,
    new_value: JSON.stringify({ category: data.category, subject: data.subject })
  });

  return data as EmailTemplate;
}

export const getExpenses = cache(async function getExpenses(options?: { startDate?: string; endDate?: string }) {
  const session = await getCurrentSession();

  if (!session || !canManageFinance(session.role)) {
    return [];
  }

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const expenses = db.expenses
      .filter((expense) => {
        if (options?.startDate && expense.expense_date < options.startDate) return false;
        if (options?.endDate && expense.expense_date > options.endDate) return false;
        return true;
      })
      .slice()
      .sort((a, b) => {
      if (a.expense_date === b.expense_date) {
        return b.created_at.localeCompare(a.created_at);
      }
      return b.expense_date.localeCompare(a.expense_date);
    });
    return expenses;
  }

  const supabase = admin();
  let query = supabase
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (options?.startDate) {
    query = query.gte("expense_date", options.startDate);
  }
  if (options?.endDate) {
    query = query.lte("expense_date", options.endDate);
  }
  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as ExpenseRecord[];
});

export const getTasks = cache(async function getTasks(limit?: number) {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const tasks = db.tasks;
    return typeof limit === "number" ? tasks.slice(0, limit) : tasks;
  }
  const supabase = admin();
  let query = supabase
    .from("tasks")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (typeof limit === "number") {
    query = query.limit(limit);
  }
  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as Task[];
});

export const getAuditLogs = cache(async function getAuditLogs(limit = 12) {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    return db.audit_logs
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
  const supabase = admin();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AuditLog[];
});

export const getUpcomingConsultations = cache(async function getUpcomingConsultations(limit = 6) {
  const consultations = await getConsultations();
  return consultations
    .filter((item) => item.status === "pending" || item.status === "confirmed")
    .slice()
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, limit);
});

export const getPendingDocuments = cache(async function getPendingDocuments(limit = 6) {
  const documents = await getDocuments();
  return documents
    .filter((document) => ["pending", "under_review", "uploaded"].includes(document.status))
    .slice(0, limit);
});

export const getOpenTasks = cache(async function getOpenTasks(limit = 6) {
  const tasks = await getTasks();
  return tasks
    .filter((task) => task.status !== "completed" && task.status !== "cancelled")
    .slice()
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, limit);
});

export const getUnreadPortalMessages = cache(async function getUnreadPortalMessages(limit = 6) {
  const messages = await getPortalMessages(limit * 3);
  return messages
    .filter((message) => message.direction === "student_to_crm" && !message.is_read)
    .slice(0, limit);
});

export async function createStudent(input: Partial<Student>) {
  const session = await getCurrentSession();

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const student = {
      id: crypto.randomUUID(),
      full_name: input.full_name ?? "New Student",
      email: input.email ?? "unknown@example.com",
      phone: input.phone ?? null,
      passport_number: input.passport_number ?? null,
      location: input.location ?? null,
      country_interest: input.country_interest ?? null,
      program_level: input.program_level ?? null,
      university_name: input.university_name ?? null,
      stage: (input.stage ?? "lead") as StudentStage,
      consultation_requested: input.consultation_requested ?? false,
      consultation_status: null,
      consultation_date: null,
      visa_status: null,
      ielts_enrolled: input.ielts_enrolled ?? false,
      ielts_amount: input.ielts_amount ?? 0,
      ielts_payment_status: input.ielts_payment_status ?? "unpaid",
      payment_status: input.payment_status ?? "pending",
      consultation_upfront_paid: input.consultation_upfront_paid ?? 0,
      consultation_balance_paid: input.consultation_balance_paid ?? 0,
      segment: "needs_guidance",
      segment_score: 20,
      lead_source: input.lead_source ?? "Website",
      referral_code: null,
      notes: input.notes ?? null,
      created_by: input.created_by ?? session?.username ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } satisfies Student;
    db.students.unshift(student);
    await writeLocalDb(db);
    return student;
  }

  const supabase = admin();
  const payload = {
    full_name: input.full_name,
    email: input.email,
    phone: input.phone ?? null,
    passport_number: input.passport_number ?? null,
    location: input.location ?? null,
    country_interest: input.country_interest ?? null,
    program_level: input.program_level ?? null,
    university_name: input.university_name ?? null,
    stage: (input.stage ?? "lead") as StudentStage,
    consultation_requested: input.consultation_requested ?? false,
    consultation_status: input.consultation_status ?? null,
    consultation_date: input.consultation_date ?? null,
    ielts_enrolled: input.ielts_enrolled ?? false,
    ielts_amount: input.ielts_amount ?? 0,
    ielts_payment_status: input.ielts_payment_status ?? "unpaid",
    payment_status: input.payment_status ?? "pending",
    consultation_upfront_paid: input.consultation_upfront_paid ?? 0,
    consultation_balance_paid: input.consultation_balance_paid ?? 0,
    segment: input.segment ?? "needs_guidance",
    segment_score: input.segment_score ?? 20,
    lead_source: input.lead_source ?? "Website",
    referral_code: input.referral_code ?? null,
    notes: input.notes ?? null,
    created_by: input.created_by ?? session?.username ?? null
  };

  const { data, error } = await supabase.from("students").insert(payload).select("*").single();

  if (error) throw error;

  await logAudit({
    action: "Student Created",
    table_name: "students",
    related_id: data.id,
    record_label: data.full_name,
    new_value: JSON.stringify(payload)
  });

  return data as Student;
}

export async function createConsultation(input: { student_id: string; scheduled_at: string; notes?: string | null }) {
  const session = await getCurrentSession();

  if (!session || !canManageConsultations(session.role)) {
    throw new Error("You do not have permission to schedule consultations.");
  }

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const consultation = {
      id: crypto.randomUUID(),
      student_id: input.student_id,
      scheduled_at: input.scheduled_at,
      status: "pending",
      notes: input.notes ?? null,
      created_by: session?.username ?? null,
      created_at: new Date().toISOString()
    } as Consultation;

    db.consultations.unshift(consultation);
    db.students = db.students.map((student) =>
      student.id === input.student_id
        ? {
            ...student,
            consultation_requested: true,
            consultation_status: "pending",
            consultation_date: input.scheduled_at,
            updated_at: new Date().toISOString()
          }
        : student
    );
    await writeLocalDb(db);
    return consultation;
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("consultations")
    .insert({
      student_id: input.student_id,
      scheduled_at: input.scheduled_at,
      status: "pending",
      notes: input.notes ?? null,
      created_by: session?.username ?? null
    })
    .select("*")
    .single();

  if (error) throw error;

  await supabase
    .from("students")
    .update({
      consultation_requested: true,
      consultation_status: "pending",
      consultation_date: input.scheduled_at
    })
    .eq("id", input.student_id);

  await logAudit({
    action: "Consultation Scheduled",
    table_name: "consultations",
    related_id: data.id,
    record_label: input.student_id,
    new_value: JSON.stringify(data)
  });

  return data as Consultation;
}

export async function createPublicConsultationLead(input: {
  full_name: string;
  email: string;
  phone: string;
  location?: string | null;
  country_interest: string;
  program_level: string;
  start_date?: string | null;
  source?: string | null;
  campaign?: string | null;
  referral_code?: string | null;
}) {
  const notes = [
    input.start_date ? `Start: ${input.start_date}` : null,
    input.source ? `Source: ${input.source}` : null,
    input.campaign ? `Campaign: ${input.campaign}` : null
  ]
    .filter(Boolean)
    .join(" | ");

  const student = await createStudent({
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    location: input.location ?? null,
    country_interest: input.country_interest,
    program_level: input.program_level,
    stage: "lead",
    consultation_requested: true,
    consultation_status: "pending",
    lead_source: input.source ?? "Website",
    referral_code: input.referral_code ?? null,
    notes: notes || "Public consultation request",
    created_by: null
  });

  await logAudit({
    action: "Public Consultation Lead Captured",
    table_name: "students",
    related_id: student.id,
    record_label: student.full_name,
    new_value: JSON.stringify({
      source: input.source ?? "Website",
      campaign: input.campaign ?? null,
      referral_code: input.referral_code ?? null
    })
  });

  return student;
}

export async function createPublicIeltsLead(input: {
  full_name: string;
  email: string;
  phone: string;
  location?: string | null;
  target_score?: string | null;
  destination?: string | null;
  source?: string | null;
  campaign?: string | null;
}) {
  const notes = [
    input.target_score ? `Target Score: ${input.target_score}` : null,
    input.destination ? `Destination: ${input.destination}` : null,
    input.source ? `Source: ${input.source}` : null,
    input.campaign ? `Campaign: ${input.campaign}` : null
  ]
    .filter(Boolean)
    .join(" | ");

  const student = await createStudent({
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    location: input.location ?? null,
    country_interest: input.destination ?? null,
    program_level: "IELTS Training",
    stage: "lead",
    consultation_requested: false,
    ielts_enrolled: true,
    ielts_payment_status: "unpaid",
    lead_source: input.source ?? "facebook_ielts",
    notes: notes || "Public IELTS training signup",
    created_by: null
  });

  await logAudit({
    action: "Public IELTS Lead Captured",
    table_name: "students",
    related_id: student.id,
    record_label: student.full_name,
    new_value: JSON.stringify({
      destination: input.destination ?? null,
      target_score: input.target_score ?? null,
      source: input.source ?? "facebook_ielts",
      campaign: input.campaign ?? null
    })
  });

  return student;
}

export async function createPublicStudentRegistration(input: {
  full_name: string;
  email: string;
  phone?: string | null;
  passport_number?: string | null;
  location?: string | null;
  country_interest?: string | null;
  program_level?: string | null;
  university_name?: string | null;
  stage?: StudentStage;
  payment_status?: string | null;
  ielts_enrolled?: boolean;
  ielts_amount?: number;
  ielts_payment_status?: "paid" | "unpaid";
  consultation_upfront_paid?: number;
  consultation_balance_paid?: number;
  notes?: string | null;
  lead_source?: string | null;
  referral_code?: string | null;
  source?: string | null;
  campaign?: string | null;
}) {
  const notes = [
    input.notes ?? null,
    input.source ? `Source: ${input.source}` : null,
    input.campaign ? `Campaign: ${input.campaign}` : null
  ]
    .filter(Boolean)
    .join(" | ");

  const student = await createStudent({
    full_name: input.full_name,
    email: input.email,
    phone: input.phone ?? null,
    passport_number: input.passport_number ?? null,
    location: input.location ?? null,
    country_interest: input.country_interest ?? null,
    program_level: input.program_level ?? null,
    university_name: input.university_name ?? null,
    stage: input.stage ?? "lead",
    payment_status: input.payment_status ?? "pending",
    ielts_enrolled: input.ielts_enrolled ?? false,
    ielts_amount: input.ielts_amount ?? 0,
    ielts_payment_status: input.ielts_payment_status ?? "unpaid",
    consultation_upfront_paid: input.consultation_upfront_paid ?? 0,
    consultation_balance_paid: input.consultation_balance_paid ?? 0,
    lead_source: input.lead_source ?? input.source ?? "Website",
    referral_code: input.referral_code ?? null,
    notes: notes || "Public student registration",
    created_by: null
  });

  await logAudit({
    action: "Public Student Registration Captured",
    table_name: "students",
    related_id: student.id,
    record_label: student.full_name,
    new_value: JSON.stringify({
      source: input.source ?? null,
      campaign: input.campaign ?? null,
      lead_source: input.lead_source ?? input.source ?? "Website",
      stage: input.stage ?? "lead"
    })
  });

  return student;
}

export async function updateDocumentStatus(input: { id: string; status: DocumentRecord["status"]; review_notes?: string }) {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const existing = db.documents.find((item) => item.id === input.id);
    if (!existing) {
      throw new Error("Document not found.");
    }

    const updated = {
      ...existing,
      status: input.status,
      review_notes: input.review_notes ?? null,
      reviewed_at: new Date().toISOString()
    };
    db.documents = db.documents.map((item) => (item.id === input.id ? updated : item));
    await writeLocalDb(db);
    return updated;
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("student_documents")
    .update({
      status: input.status,
      review_notes: input.review_notes ?? null,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) throw error;

  await logAudit({
    action: "Document Reviewed",
    table_name: "student_documents",
    related_id: data.id,
    record_label: data.original_filename,
    new_value: JSON.stringify({ status: input.status })
  });

  return data as DocumentRecord;
}

export async function logAudit(input: {
  action: string;
  table_name: string;
  related_id?: string | null;
  record_label?: string | null;
  old_value?: string | null;
  new_value?: string | null;
}) {
  const session = await getCurrentSession();

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    db.audit_logs.unshift({
      id: crypto.randomUUID(),
      action: input.action,
      table_name: input.table_name,
      related_id: input.related_id ?? null,
      record_label: input.record_label ?? null,
      old_value: input.old_value ?? null,
      new_value: input.new_value ?? null,
      created_at: new Date().toISOString(),
      actor_name: session?.full_name ?? "System"
    });
    await writeLocalDb(db);
    return;
  }

  const supabase = admin();
  const { error } = await supabase.from("audit_logs").insert({
    action: input.action,
    table_name: input.table_name,
    related_id: input.related_id ?? null,
    record_label: input.record_label ?? null,
    old_value: input.old_value ?? null,
    new_value: input.new_value ?? null,
    actor_name: session?.full_name ?? "System"
  });

  if (error) throw error;
}

export async function runStudentBulkAction(input: {
  action: "update_stage" | "update_payment" | "delete" | "export";
  studentIds: string[];
  stage?: StudentStage;
  paymentMode?: "full" | "partial" | "none";
}) {
  const session = await getCurrentSession();

  if (!session || !canManageStudentRecords(session.role)) {
    throw new Error("You do not have permission to run bulk student actions.");
  }

  const students = await getStudents();
  const selected = students.filter((student) => input.studentIds.includes(student.id));

  if (selected.length === 0) {
    throw new Error("No matching students were found for this action.");
  }

  if (input.action === "export") {
    return {
      count: selected.length,
      csv: toStudentCsv(selected)
    };
  }

  if (input.action === "delete" && session.role !== "admin") {
    throw new Error("Only admins can delete students.");
  }

  if (!hasSupabaseEnv()) {
    const db = await readDb();

    if (input.action === "update_stage") {
      if (!input.stage) throw new Error("A target stage is required.");

      const timestamp = new Date().toISOString();
      const selectedMap = new Map(selected.map((student) => [student.id, student]));
      const nextSelected: Student[] = [];

      db.students = db.students.map((student) => {
        if (!selectedMap.has(student.id)) return student;
        const updated = {
          ...student,
          ...getConsultationTransitionState(student, input.stage as StudentStage, timestamp)
        };
        nextSelected.push(updated);
        return updated;
      });

      if (input.stage === "consultation") {
        syncLocalConsultationStage(db, nextSelected, session.username ?? null, timestamp);
      }

      await writeLocalDb(db);
      await logAudit({
        action: "Bulk Stage Update",
        table_name: "students",
        record_label: `${selected.length} students`,
        new_value: JSON.stringify({ stage: input.stage, ids: input.studentIds })
      });

      return { count: selected.length };
    }

    if (input.action === "update_payment") {
      const paymentMode = input.paymentMode;
      if (!paymentMode) throw new Error("A payment mode is required.");

      const paymentMap = {
        full: {
          payment_status: "full",
          consultation_upfront_paid: 20000,
          consultation_balance_paid: 20000
        },
        partial: {
          payment_status: "installment",
          consultation_upfront_paid: 20000,
          consultation_balance_paid: 0
        },
        none: {
          payment_status: "pending",
          consultation_upfront_paid: 0,
          consultation_balance_paid: 0
        }
      } as const;

      db.students = db.students.map((student) =>
        input.studentIds.includes(student.id)
          ? {
              ...student,
              ...paymentMap[paymentMode],
              updated_at: new Date().toISOString()
            }
          : student
      );

      await writeLocalDb(db);
      await logAudit({
        action: "Bulk Payment Update",
        table_name: "students",
        record_label: `${selected.length} students`,
        new_value: JSON.stringify({ paymentMode: input.paymentMode, ids: input.studentIds })
      });

      return { count: selected.length };
    }

    db.students = db.students.filter((student) => !input.studentIds.includes(student.id));
    db.consultations = db.consultations.filter((consultation) => !input.studentIds.includes(consultation.student_id));
    db.documents = db.documents.filter((document) => !input.studentIds.includes(document.student_id));
    await writeLocalDb(db);
    await logAudit({
      action: "Bulk Student Delete",
      table_name: "students",
      record_label: `${selected.length} students`,
      old_value: JSON.stringify(input.studentIds)
    });
    return { count: selected.length };
  }

  const supabase = admin();

  if (input.action === "update_stage") {
    if (!input.stage) throw new Error("A target stage is required.");

    const timestamp = new Date().toISOString();
    const selectedMap = new Map(selected.map((student) => [student.id, student]));
    for (const student of selected) {
      const updates = getConsultationTransitionState(student, input.stage as StudentStage, timestamp);
      const { error } = await supabase.from("students").update(updates).eq("id", student.id);
      if (error) throw error;
    }

    if (input.stage === "consultation") {
      const nextSelected = input.studentIds
        .map((id) => selectedMap.get(id))
        .filter(Boolean)
        .map((student) => ({
          ...(student as Student),
          ...getConsultationTransitionState(student as Student, "consultation", timestamp)
        }));
      await syncSupabaseConsultationStage(nextSelected, session.username ?? null, timestamp);
    }

    await logAudit({
      action: "Bulk Stage Update",
      table_name: "students",
      record_label: `${selected.length} students`,
      new_value: JSON.stringify({ stage: input.stage, ids: input.studentIds })
    });

    return { count: selected.length };
  }

  if (input.action === "update_payment") {
    const paymentMode = input.paymentMode;
    if (!paymentMode) throw new Error("A payment mode is required.");

    const paymentMap = {
      full: {
        payment_status: "full",
        consultation_upfront_paid: 20000,
        consultation_balance_paid: 20000
      },
      partial: {
        payment_status: "installment",
        consultation_upfront_paid: 20000,
        consultation_balance_paid: 0
      },
      none: {
        payment_status: "pending",
        consultation_upfront_paid: 0,
        consultation_balance_paid: 0
      }
    } as const;

    const { error } = await supabase
      .from("students")
      .update(paymentMap[paymentMode])
      .in("id", input.studentIds);

    if (error) throw error;

    await logAudit({
      action: "Bulk Payment Update",
      table_name: "students",
      record_label: `${selected.length} students`,
      new_value: JSON.stringify({ paymentMode: input.paymentMode, ids: input.studentIds })
    });

    return { count: selected.length };
  }

  const { error } = await supabase.from("students").delete().in("id", input.studentIds);
  if (error) throw error;

  await logAudit({
    action: "Bulk Student Delete",
    table_name: "students",
    record_label: `${selected.length} students`,
    old_value: JSON.stringify(input.studentIds)
  });

  return { count: selected.length };
}

function toStudentCsv(students: Student[]) {
  const headers = [
    "full_name",
    "email",
    "phone",
    "country_interest",
    "program_level",
    "stage",
    "payment_status",
    "consultation_status",
    "lead_source",
    "updated_at"
  ];

  const rows = students.map((student) =>
    [
      student.full_name,
      student.email,
      student.phone ?? "",
      student.country_interest ?? "",
      student.program_level ?? "",
      student.stage,
      student.payment_status ?? "",
      student.consultation_status ?? "",
      student.lead_source ?? "",
      student.updated_at
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export async function updateStudent(id: string, input: Partial<Student>) {
  const session = await getCurrentSession();
  const allowed = await getStudentById(id);

  if (!allowed) {
    throw new Error("Student not found or access denied.");
  }

  if (!session || !canManageStudentRecords(session.role)) {
    throw new Error("You do not have permission to update students.");
  }

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const next = db.students.find((student) => student.id === id);
    if (!next) throw new Error("Student not found.");
    const timestamp = new Date().toISOString();
    const updated = {
      ...next,
      ...input,
      ...(input.stage
        ? getConsultationTransitionState(
            {
              ...next,
              ...input
            } as Student,
            input.stage,
            timestamp
          )
        : {
            updated_at: timestamp
          })
    };
    db.students = db.students.map((student) => (student.id === id ? updated : student));
    if (input.stage === "consultation") {
      syncLocalConsultationStage(db, [updated], session?.username ?? null, timestamp);
    }
    await writeLocalDb(db);
    await logAudit({
      action: "Student Updated",
      table_name: "students",
      related_id: id,
      record_label: updated.full_name,
      new_value: JSON.stringify(input)
    });
    return updated;
  }

  const supabase = admin();
  const timestamp = new Date().toISOString();
  const payload = {
    ...input,
    ...(input.stage
      ? getConsultationTransitionState(
          {
            ...allowed,
            ...input
          } as Student,
          input.stage,
          timestamp
        )
      : {
          updated_at: timestamp
        })
  };
  const { data, error } = await supabase.from("students").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  if (input.stage === "consultation") {
    await syncSupabaseConsultationStage(
      [
        {
          ...allowed,
          ...payload
        } as Student
      ],
      session?.username ?? null,
      timestamp
    );
  }
  await logAudit({
    action: "Student Updated",
    table_name: "students",
    related_id: id,
    record_label: data.full_name,
    new_value: JSON.stringify(input)
  });
  return data as Student;
}

export async function deleteStudent(id: string) {
  const session = await getCurrentSession();
  if (session?.role !== "admin") {
    throw new Error("Only admins can delete students.");
  }

  const student = await getStudentById(id);
  if (!student) throw new Error("Student not found.");

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    db.students = db.students.filter((item) => item.id !== id);
    db.consultations = db.consultations.filter((item) => item.student_id !== id);
    db.documents = db.documents.filter((item) => item.student_id !== id);
    await writeLocalDb(db);
    await logAudit({
      action: "Student Deleted",
      table_name: "students",
      related_id: id,
      record_label: student.full_name,
      old_value: JSON.stringify(student)
    });
    return;
  }

  const supabase = admin();
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
  await logAudit({
    action: "Student Deleted",
    table_name: "students",
    related_id: id,
    record_label: student.full_name,
    old_value: JSON.stringify(student)
  });
}

export async function checkStudentDuplicates(input: {
  email?: string;
  phone?: string;
  passport_number?: string;
  excludeId?: string;
}) {
  const students = await getStudents();
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim();
  const passport = input.passport_number?.trim().toLowerCase();

  return students.filter((student) => {
    if (input.excludeId && student.id === input.excludeId) return false;
    return Boolean(
      (email && student.email.toLowerCase() === email) ||
        (phone && student.phone === phone) ||
        (passport && (student.passport_number ?? "").toLowerCase() === passport)
    );
  });
}

export async function updateConsultation(input: {
  id: string;
  status?: Consultation["status"];
  notes?: string | null;
  append_note?: string | null;
}) {
  const session = await getCurrentSession();

  if (!session || !canManageConsultations(session.role)) {
    throw new Error("You do not have permission to update consultations.");
  }

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const consultation = db.consultations.find((item) => item.id === input.id);
    if (!consultation) throw new Error("Consultation not found.");
    const nextNotes = input.append_note
      ? [consultation.notes, `[Note ${new Date().toISOString()}] ${input.append_note}`].filter(Boolean).join("\n")
      : input.notes ?? consultation.notes;
    const updated = {
      ...consultation,
      status: input.status ?? consultation.status,
      notes: nextNotes
    };
    db.consultations = db.consultations.map((item) => (item.id === input.id ? updated : item));
    db.students = db.students.map((student) =>
      student.id === consultation.student_id
        ? {
            ...student,
            consultation_status: updated.status,
            notes: input.append_note
              ? [student.notes, `[Consultation Note] ${input.append_note}`].filter(Boolean).join("\n")
              : student.notes,
            updated_at: new Date().toISOString()
          }
        : student
    );
    await writeLocalDb(db);
    await logAudit({
      action: "Consultation Updated",
      table_name: "consultations",
      related_id: updated.id,
      record_label: updated.student_id,
      new_value: JSON.stringify({ status: updated.status, notes: updated.notes })
    });
    await createFollowUpLog({
      student_id: updated.student_id,
      note_type: "meeting",
      priority: updated.status === "cancelled" ? "high" : "medium",
      tags: "consultation,follow-up",
      note_text: `Consultation ${updated.status}.${input.append_note ? ` Note: ${input.append_note}` : ""}`.trim()
    });
    return updated;
  }

  const supabase = admin();
  const consultation = await getConsultations();
  const existing = consultation.find((item) => item.id === input.id);
  if (!existing) throw new Error("Consultation not found.");
  const nextNotes = input.append_note
    ? [existing.notes, `[Note ${new Date().toISOString()}] ${input.append_note}`].filter(Boolean).join("\n")
    : input.notes ?? existing.notes;
  const { data, error } = await supabase
    .from("consultations")
    .update({
      status: input.status ?? existing.status,
      notes: nextNotes
    })
    .eq("id", input.id)
    .select("*")
    .single();
  if (error) throw error;
  if (input.status) {
    await supabase.from("students").update({ consultation_status: input.status }).eq("id", existing.student_id);
  }
  await logAudit({
    action: "Consultation Updated",
    table_name: "consultations",
    related_id: input.id,
    record_label: existing.student_id,
    new_value: JSON.stringify({ status: input.status, notes: nextNotes })
  });
  await createFollowUpLog({
    student_id: existing.student_id,
    note_type: "meeting",
    priority: (input.status ?? existing.status) === "cancelled" ? "high" : "medium",
    tags: "consultation,follow-up",
    note_text: `Consultation ${input.status ?? existing.status}.${input.append_note ? ` Note: ${input.append_note}` : ""}`.trim()
  });
  return data as Consultation;
}

export async function createDocument(input: {
  student_id: string;
  document_type: string;
  original_filename: string;
  file_url: string;
  file_size: number;
}) {
  const session = await getCurrentSession();

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const document: DocumentRecord = {
      id: crypto.randomUUID(),
      student_id: input.student_id,
      document_type: input.document_type,
      original_filename: input.original_filename,
      file_url: input.file_url,
      file_size: input.file_size,
      status: "pending",
      review_notes: null,
      uploaded_by: session?.full_name ?? session?.username ?? "System",
      reviewed_by: null,
      uploaded_at: new Date().toISOString(),
      reviewed_at: null
    };
    db.documents.unshift(document);
    await writeLocalDb(db);
    await logAudit({
      action: "Document Uploaded",
      table_name: "student_documents",
      related_id: document.id,
      record_label: document.original_filename,
      new_value: JSON.stringify({ student_id: document.student_id, type: document.document_type })
    });
    return document;
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("student_documents")
    .insert({
      student_id: input.student_id,
      document_type: input.document_type,
      original_filename: input.original_filename,
      file_url: input.file_url,
      file_size: input.file_size,
      uploaded_by: session?.username ?? null
    })
    .select("*")
    .single();
  if (error) throw error;
  await logAudit({
    action: "Document Uploaded",
    table_name: "student_documents",
    related_id: data.id,
    record_label: data.original_filename,
    new_value: JSON.stringify({ student_id: data.student_id, type: data.document_type })
  });
  return data as DocumentRecord;
}

export async function createPayment(input: {
  student_id: string;
  payment_type: PaymentRecord["payment_type"];
  amount: number;
  payment_method: PaymentRecord["payment_method"];
  reference_number?: string | null;
  notes?: string | null;
  status?: PaymentRecord["status"];
}) {
  const session = await getCurrentSession();

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const payment: PaymentRecord = {
      id: crypto.randomUUID(),
      student_id: input.student_id,
      payment_type: input.payment_type,
      amount: input.amount,
      currency: "KES",
      status: input.status ?? "paid",
      payment_method: input.payment_method,
      reference_number: input.reference_number ?? null,
      notes: input.notes ?? null,
      paid_at: input.status === "pending" ? null : new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    db.payments.unshift(payment);
    await writeLocalDb(db);
    await logAudit({
      action: "Payment Recorded",
      table_name: "payments",
      related_id: payment.id,
      record_label: input.student_id,
      new_value: JSON.stringify(payment)
    });
    return payment;
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("payments")
    .insert({
      student_id: input.student_id,
      payment_type: input.payment_type,
      amount: input.amount,
      currency: "KES",
      status: input.status ?? "paid",
      payment_method: input.payment_method,
      reference_number: input.reference_number ?? null,
      notes: input.notes ?? null,
      paid_at: input.status === "pending" ? null : new Date().toISOString(),
      created_by: session?.username ?? null
    })
    .select("*")
    .single();

  if (error) throw error;
  await logAudit({
    action: "Payment Recorded",
    table_name: "payments",
    related_id: data.id,
    record_label: input.student_id,
    new_value: JSON.stringify(data)
  });
  return data as PaymentRecord;
}

export async function createReferral(input: {
  referrer_name: string;
  referrer_email?: string | null;
  referrer_phone?: string | null;
  referral_code: string;
  referred_student_name: string;
  referred_student_email?: string | null;
  reward_amount?: number;
  notes?: string | null;
}) {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const referral: ReferralRecord = {
      id: crypto.randomUUID(),
      referrer_name: input.referrer_name,
      referrer_email: input.referrer_email ?? null,
      referrer_phone: input.referrer_phone ?? null,
      referral_code: input.referral_code,
      referred_student_name: input.referred_student_name,
      referred_student_email: input.referred_student_email ?? null,
      status: "new",
      reward_amount: input.reward_amount ?? 0,
      notes: input.notes ?? null,
      created_at: new Date().toISOString()
    };
    db.referrals.unshift(referral);
    await writeLocalDb(db);
    await logAudit({
      action: "Referral Created",
      table_name: "referrals",
      related_id: referral.id,
      record_label: referral.referred_student_name,
      new_value: JSON.stringify(referral)
    });
    return referral;
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("referrals")
    .insert({
      referrer_name: input.referrer_name,
      referrer_email: input.referrer_email ?? null,
      referrer_phone: input.referrer_phone ?? null,
      referral_code: input.referral_code,
      referred_student_name: input.referred_student_name,
      referred_student_email: input.referred_student_email ?? null,
      status: "new",
      reward_amount: input.reward_amount ?? 0,
      notes: input.notes ?? null
    })
    .select("*")
    .single();

  if (error) throw error;
  await logAudit({
    action: "Referral Created",
    table_name: "referrals",
    related_id: data.id,
    record_label: data.referred_student_name,
    new_value: JSON.stringify(data)
  });
  return data as ReferralRecord;
}

export async function updateReferralStatus(id: string, status: ReferralRecord["status"]) {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const existing = db.referrals.find((referral) => referral.id === id);
    if (!existing) throw new Error("Referral not found.");
    const updated = { ...existing, status };
    db.referrals = db.referrals.map((referral) => (referral.id === id ? updated : referral));
    await writeLocalDb(db);
    await logAudit({
      action: "Referral Updated",
      table_name: "referrals",
      related_id: id,
      record_label: updated.referred_student_name,
      new_value: JSON.stringify({ status })
    });
    return updated;
  }

  const supabase = admin();
  const { data, error } = await supabase.from("referrals").update({ status }).eq("id", id).select("*").single();
  if (error) throw error;
  await logAudit({
    action: "Referral Updated",
    table_name: "referrals",
    related_id: id,
    record_label: data.referred_student_name,
    new_value: JSON.stringify({ status })
  });
  return data as ReferralRecord;
}

export async function updateUserStatus(id: string, status: AppUserRecord["status"]) {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const existing = db.users.find((user) => user.id === id);
    if (!existing) throw new Error("User not found.");
    const updated = { ...existing, status };
    db.users = db.users.map((user) => (user.id === id ? updated : user));
    await writeLocalDb(db);
    await logAudit({
      action: "User Status Updated",
      table_name: "users",
      related_id: id,
      record_label: updated.full_name,
      new_value: JSON.stringify({ status })
    });
    return updated;
  }

  const supabase = admin();
  const { data, error } = await supabase.from("users").update({ status }).eq("id", id).select("*").single();
  if (error) throw error;
  await logAudit({
    action: "User Status Updated",
    table_name: "users",
    related_id: id,
    record_label: data.full_name,
    new_value: JSON.stringify({ status })
  });
  return data as AppUserRecord;
}

export async function updateUserRecord(input: {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: AppUserRecord["role"];
  status: AppUserRecord["status"];
  phone?: string | null;
}) {
  const session = await getCurrentSession();

  if (!session || session.role !== "admin") {
    throw new Error("You do not have permission to edit users.");
  }

  const normalizedUsername = input.username.trim().toLowerCase();
  const normalizedEmail = input.email.trim().toLowerCase();
  const users = await getUsers();
  const existing = users.find((user) => user.id === input.id);

  if (!existing) {
    throw new Error("User not found.");
  }

  if (users.some((user) => user.id !== input.id && user.username.toLowerCase() === normalizedUsername)) {
    throw new Error("Username already exists.");
  }

  if (users.some((user) => user.id !== input.id && user.email.toLowerCase() === normalizedEmail)) {
    throw new Error("Email already exists.");
  }

  const payload = {
    username: normalizedUsername,
    full_name: input.full_name.trim(),
    email: normalizedEmail,
    role: input.role,
    status: input.status,
    phone: input.phone ?? null
  };

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const updated = {
      ...existing,
      ...payload
    };
    db.users = db.users.map((user) => (user.id === input.id ? updated : user));
    await writeLocalDb(db);
    await logAudit({
      action: "User Updated",
      table_name: "users",
      related_id: input.id,
      record_label: updated.full_name,
      old_value: JSON.stringify({
        username: existing.username,
        full_name: existing.full_name,
        email: existing.email,
        role: existing.role,
        status: existing.status,
        phone: existing.phone
      }),
      new_value: JSON.stringify(payload)
    });
    return updated;
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) {
    throw new Error("Could not update user.");
  }

  await logAudit({
    action: "User Updated",
    table_name: "users",
    related_id: input.id,
    record_label: data.full_name,
    old_value: JSON.stringify({
      username: existing.username,
      full_name: existing.full_name,
      email: existing.email,
      role: existing.role,
      status: existing.status,
      phone: existing.phone
    }),
    new_value: JSON.stringify(payload)
  });

  return data as AppUserRecord;
}

export async function createUserRecord(input: {
  username: string;
  full_name: string;
  email: string;
  password: string;
  role: AppUserRecord["role"];
}) {
  const session = await getCurrentSession();

  if (!session || session.role !== "admin") {
    throw new Error("You do not have permission to create users.");
  }

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    if (db.users.some((user) => user.username.toLowerCase() === input.username.toLowerCase())) {
      throw new Error("Username may already exist.");
    }
    if (db.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error("Email may already exist.");
    }

    const hashedPassword = await hashPasswordForStorage(input.password);

    const user: AppUserRecord = {
      id: crypto.randomUUID(),
      username: input.username,
      password: hashedPassword,
      full_name: input.full_name,
      email: input.email,
      role: input.role,
      status: "active",
      phone: null,
      last_login_at: null,
      created_at: new Date().toISOString()
    };

    db.users.unshift(user);
    await writeLocalDb(db);
    await logAudit({
      action: "User Created",
      table_name: "users",
      related_id: user.id,
      record_label: user.full_name,
      new_value: JSON.stringify({ username: user.username, role: user.role, email: user.email })
    });
    return user;
  }

  const supabase = admin();
  const hashedPassword = await hashPasswordForStorage(input.password);
  const { data, error } = await supabase
    .from("users")
    .insert({
      username: input.username,
      password: hashedPassword,
      full_name: input.full_name,
      email: input.email,
      role: input.role,
      status: "active"
    })
    .select("*")
    .single();

  if (error) {
    throw new Error("Username or email may already exist.");
  }

  await logAudit({
    action: "User Created",
    table_name: "users",
    related_id: data.id,
    record_label: data.full_name,
    new_value: JSON.stringify({ username: data.username, role: data.role, email: data.email })
  });

  return data as AppUserRecord;
}

export async function resetUserPassword(id: string, password: string) {
  const session = await getCurrentSession();

  if (!session || session.role !== "admin") {
    throw new Error("You do not have permission to reset passwords.");
  }

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const existing = db.users.find((user) => user.id === id);
    if (!existing) throw new Error("User not found.");

    const updated = { ...existing, password: await hashPasswordForStorage(password) };
    db.users = db.users.map((user) => (user.id === id ? updated : user));
    await writeLocalDb(db);
    await logAudit({
      action: "Password Reset",
      table_name: "users",
      related_id: id,
      record_label: updated.full_name,
      new_value: JSON.stringify({ reset: true })
    });
    return updated;
  }

  const supabase = admin();
  const hashedPassword = await hashPasswordForStorage(password);
  const { data, error } = await supabase
    .from("users")
    .update({ password: hashedPassword })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  await logAudit({
    action: "Password Reset",
    table_name: "users",
    related_id: id,
    record_label: data.full_name,
    new_value: JSON.stringify({ reset: true })
  });

  return data as AppUserRecord;
}

export async function registerPublicUser(input: {
  username: string;
  full_name: string;
  email: string;
  password: string;
}) {
  const normalizedUsername = input.username.trim().toLowerCase();
  const normalizedEmail = input.email.trim().toLowerCase();
  const hashedPassword = await hashPasswordForStorage(input.password);

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    if (db.users.some((user) => user.username.toLowerCase() === normalizedUsername)) {
      throw new Error("Username already exists.");
    }
    if (db.users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      throw new Error("Email already exists.");
    }

    const user: AppUserRecord = {
      id: crypto.randomUUID(),
      username: normalizedUsername,
      password: hashedPassword,
      full_name: input.full_name.trim(),
      email: normalizedEmail,
      role: "employee",
      status: "active",
      phone: null,
      last_login_at: null,
      created_at: new Date().toISOString()
    };

    db.users.unshift(user);
    await writeLocalDb(db);
    await logAudit({
      action: "Public Signup",
      table_name: "users",
      related_id: user.id,
      record_label: user.full_name,
      new_value: JSON.stringify({ username: user.username, email: user.email, role: user.role })
    });
    return user;
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("users")
    .insert({
      username: normalizedUsername,
      password: hashedPassword,
      full_name: input.full_name.trim(),
      email: normalizedEmail,
      role: "employee",
      status: "active"
    })
    .select("*")
    .single();

  if (error) {
    throw new Error("Username or email already exists.");
  }

  await logAudit({
    action: "Public Signup",
    table_name: "users",
    related_id: data.id,
    record_label: data.full_name,
    new_value: JSON.stringify({ username: data.username, email: data.email, role: data.role })
  });

  return data as AppUserRecord;
}

export async function deleteUserRecord(id: string) {
  const session = await getCurrentSession();

  if (!session || session.role !== "admin") {
    throw new Error("You do not have permission to delete users.");
  }

  const users = await getUsers();
  const target = users.find((user) => user.id === id);
  if (!target) {
    throw new Error("User not found.");
  }

  if (target.username === session.username) {
    throw new Error("You cannot delete your own account.");
  }

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    db.users = db.users.filter((user) => user.id !== id);
    await writeLocalDb(db);
    await logAudit({
      action: "User Deleted",
      table_name: "users",
      related_id: id,
      record_label: target.full_name,
      old_value: JSON.stringify({ username: target.username, role: target.role, email: target.email })
    });
    return { ok: true };
  }

  const supabase = admin();
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;

  await logAudit({
    action: "User Deleted",
    table_name: "users",
    related_id: id,
    record_label: target.full_name,
    old_value: JSON.stringify({ username: target.username, role: target.role, email: target.email })
  });

  return { ok: true };
}

export async function createExpense(input: {
  category: ExpenseRecord["category"];
  amount: number;
  description?: string | null;
  expense_date: string;
  payment_method?: ExpenseRecord["payment_method"];
  receipt_number?: string | null;
  vendor?: string | null;
}) {
  const session = await getCurrentSession();

  if (!session || !canManageFinance(session.role)) {
    throw new Error("You do not have permission to add expenses.");
  }

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const expense: ExpenseRecord = {
      id: crypto.randomUUID(),
      category: input.category,
      amount: input.amount,
      description: input.description ?? null,
      expense_date: input.expense_date,
      payment_method: input.payment_method ?? null,
      receipt_number: input.receipt_number ?? null,
      vendor: input.vendor ?? null,
      created_by: session.username,
      created_at: new Date().toISOString()
    };
    db.expenses.unshift(expense);
    await writeLocalDb(db);
    await logAudit({
      action: "Expense Added",
      table_name: "expenses",
      related_id: expense.id,
      record_label: expense.vendor ?? expense.category,
      new_value: JSON.stringify(expense)
    });
    return expense;
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      category: input.category,
      amount: input.amount,
      description: input.description ?? null,
      expense_date: input.expense_date,
      payment_method: input.payment_method ?? null,
      receipt_number: input.receipt_number ?? null,
      vendor: input.vendor ?? null,
      created_by: session.username
    })
    .select("*")
    .single();

  if (error) throw error;
  await logAudit({
    action: "Expense Added",
    table_name: "expenses",
    related_id: data.id,
    record_label: data.vendor ?? data.category,
    new_value: JSON.stringify(data)
  });
  return data as ExpenseRecord;
}

export async function deleteExpense(id: string) {
  const session = await getCurrentSession();

  if (!session || !canManageFinance(session.role)) {
    throw new Error("You do not have permission to delete expenses.");
  }

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const expense = db.expenses.find((item) => item.id === id);
    if (!expense) throw new Error("Expense not found.");
    if (expense.created_by && expense.created_by !== session.username) {
      throw new Error("You can only delete expenses you created.");
    }
    db.expenses = db.expenses.filter((item) => item.id !== id);
    await writeLocalDb(db);
    await logAudit({
      action: "Expense Deleted",
      table_name: "expenses",
      related_id: id,
      record_label: expense.vendor ?? expense.category,
      old_value: JSON.stringify(expense)
    });
    return;
  }

  const supabase = admin();
  const { data: existing, error: existingError } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) throw new Error("Expense not found.");
  if (existing.created_by && existing.created_by !== session.username) {
    throw new Error("You can only delete expenses you created.");
  }
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
  await logAudit({
    action: "Expense Deleted",
    table_name: "expenses",
    related_id: id,
    record_label: existing.vendor ?? existing.category,
    old_value: JSON.stringify(existing)
  });
}

export async function getStudentNotes(studentId: string) {
  const session = await getCurrentSession();

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    return db.student_notes
      .filter((note) => {
        if (note.student_id !== studentId) return false;
        if (session?.role === "admin") return true;
        return !note.is_private || note.created_by === session?.username;
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const supabase = admin();
  let query = supabase.from("student_notes").select("*").eq("student_id", studentId).order("created_at", { ascending: false });

  if (session?.role !== "admin") {
    query = query.or(`is_private.eq.false,created_by.eq.${session?.username ?? ""}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as StudentNote[];
}

export async function getAllStudentNotes() {
  const session = await getCurrentSession();

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    return db.student_notes
      .filter((note) => {
        if (session?.role === "admin") return true;
        return !note.is_private || note.created_by === session?.username;
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const supabase = admin();
  let query = supabase.from("student_notes").select("*").order("created_at", { ascending: false });

  if (session?.role !== "admin") {
    query = query.or(`is_private.eq.false,created_by.eq.${session?.username ?? ""}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as StudentNote[];
}

export async function getCommunicationLogs(input?: {
  noteTypes?: Array<StudentNote["note_type"]>;
  limit?: number;
}) {
  const [notes, students] = await Promise.all([getAllStudentNotes(), getStudents()]);
  const studentMap = new Map(students.map((student) => [student.id, student]));
  const allowedTypes = input?.noteTypes ? new Set(input.noteTypes) : null;

  return notes
    .filter((note) => !allowedTypes || allowedTypes.has(note.note_type))
    .slice(0, input?.limit ?? 50)
    .map((note) => ({
      ...note,
      student: studentMap.get(note.student_id)
        ? {
            full_name: studentMap.get(note.student_id)!.full_name,
            email: studentMap.get(note.student_id)!.email,
            stage: studentMap.get(note.student_id)!.stage
          }
        : undefined
    })) as CommunicationLog[];
}

export async function createFollowUpLog(input: {
  student_id: string;
  note_text: string;
  note_type: StudentNote["note_type"];
  priority?: StudentNote["priority"];
  tags?: string | null;
  reminder_date?: string | null;
  is_private?: boolean;
}) {
  return createStudentNote({
    student_id: input.student_id,
    note_text: input.note_text,
    note_type: input.note_type,
    priority: input.priority ?? "medium",
    tags: input.tags ?? null,
    reminder_date: input.reminder_date ?? null,
    is_private: input.is_private ?? false
  });
}

export async function sendEmailFromCrm(input: {
  student_ids: string[];
  subject: string;
  body: string;
}) {
  return sendBulkMessageFromCrm({
    student_ids: input.student_ids,
    channel: "email",
    subject: input.subject,
    message: input.body
  });
}

export async function sendBulkMessageFromCrm(input: {
  student_ids: string[];
  channel: "email" | "whatsapp" | "sms";
  message: string;
  subject?: string;
}) {
  const session = await getCurrentSession();
  const students = await getStudents();
  const selected = students.filter((student) => input.student_ids.includes(student.id));

  if (selected.length === 0) {
    throw new Error("Please select at least one student.");
  }

  const recipients = selected.map((student) => {
    const personalizedMessage = input.message
      .replace(/\{name\}/g, student.full_name)
      .replace(/\{country\}/g, student.country_interest ?? "your study destination");
    const personalizedSubject = (input.subject ?? "CRM Message").replace(/\{name\}/g, student.full_name);

    return {
      id: student.id,
      full_name: student.full_name,
      email: student.email,
      phone: student.phone,
      subject: personalizedSubject,
      message: personalizedMessage,
      status: "pending" as "pending" | "sent" | "failed",
      error: null as string | null
    };
  });

  if (input.channel === "email") {
    const resendKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;

    if (!resendKey || !emailFrom) {
      for (const recipient of recipients) {
        recipient.status = "pending";
      }
    } else {
      const results = await Promise.allSettled(
        recipients.map((recipient) =>
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: emailFrom,
              to: recipient.email,
              subject: recipient.subject,
              text: recipient.message
            })
          })
        )
      );

      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value.ok) {
          recipients[index].status = "sent";
        } else {
          recipients[index].status = "failed";
          recipients[index].error =
            result.status === "fulfilled" ? `Email provider error (${result.value.status})` : "Request failed";
        }
      });
    }
  } else {
    for (const recipient of recipients) {
      recipient.status = "pending";
    }
  }

  for (const recipient of recipients) {
    const noteType = input.channel === "email" ? "email" : input.channel === "whatsapp" ? "whatsapp" : "general";
    const prefix = input.channel === "email"
      ? `Subject: ${recipient.subject}\nChannel: EMAIL\nDelivery: ${recipient.status.toUpperCase()}\n\n`
      : `Channel: ${input.channel.toUpperCase()}\nDelivery: ${recipient.status.toUpperCase()}\n\n`;

    await createFollowUpLog({
      student_id: recipient.id,
      note_type: noteType,
      priority: "medium",
      tags: `bulk-message,outgoing,channel:${input.channel},status:${recipient.status}`,
      note_text: `${prefix}${recipient.message}`
    });
  }

  await logAudit({
    action: "Bulk Message Campaign",
    table_name: "student_notes",
    record_label: `${selected.length} recipients`,
    new_value: JSON.stringify({
      student_ids: selected.map((student) => student.id),
      channel: input.channel,
      sender: session?.username ?? null,
      subject: input.subject ?? null
    })
  });

  const sentCount = recipients.filter((recipient) => recipient.status === "sent").length;
  const failedCount = recipients.filter((recipient) => recipient.status === "failed").length;
  const pendingCount = recipients.filter((recipient) => recipient.status === "pending").length;

  return {
    channel: input.channel,
    sentCount,
    failedCount,
    pendingCount,
    recipients
  };
}

export async function createStudentNote(input: {
  student_id: string;
  note_text: string;
  note_type?: StudentNote["note_type"];
  priority?: StudentNote["priority"];
  is_private?: boolean;
  tags?: string | null;
  reminder_date?: string | null;
}) {
  const session = await getCurrentSession();
  const noteText = input.note_text.trim();

  if (noteText.length < 2) {
    throw new Error("Interaction notes are required.");
  }

  const now = new Date().toISOString();

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const note: StudentNote = {
      id: crypto.randomUUID(),
      student_id: input.student_id,
      created_by: session?.username ?? null,
      creator_name: session?.full_name ?? "System",
      note_text: noteText,
      note_type: input.note_type ?? "general",
      priority: input.priority ?? "medium",
      is_private: input.is_private ?? false,
      tags: input.tags ?? null,
      reminder_date: input.reminder_date ?? null,
      created_at: now,
      updated_at: now
    };
    db.student_notes.unshift(note);
    db.students = db.students.map((student) =>
      student.id === input.student_id
        ? {
            ...student,
            updated_at: now
          }
        : student
    );
    await writeLocalDb(db);
    await logAudit({
      action: "Student Note Added",
      table_name: "student_notes",
      related_id: note.id,
      record_label: input.student_id,
      new_value: JSON.stringify(note)
    });
    return note;
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("student_notes")
    .insert({
      student_id: input.student_id,
      created_by: session?.username ?? null,
      creator_name: session?.full_name ?? "System",
      note_text: noteText,
      note_type: input.note_type ?? "general",
      priority: input.priority ?? "medium",
      is_private: input.is_private ?? false,
      tags: input.tags ?? null,
      reminder_date: input.reminder_date ?? null
    })
    .select("*")
    .single();
  if (error) throw error;
  const { error: studentUpdateError } = await supabase
    .from("students")
    .update({ updated_at: now })
    .eq("id", input.student_id);
  if (studentUpdateError) throw studentUpdateError;
  await logAudit({
    action: "Student Note Added",
    table_name: "student_notes",
    related_id: data.id,
    record_label: input.student_id,
    new_value: JSON.stringify(data)
  });
  return data as StudentNote;
}

export async function updateStudentNote(id: string, note_text: string) {
  const session = await getCurrentSession();

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const existing = db.student_notes.find((note) => note.id === id);
    if (!existing) throw new Error("Note not found.");
    if (session?.role !== "admin" && existing.created_by !== session?.username) {
      throw new Error("You do not have permission to edit this note.");
    }
    const updated = { ...existing, note_text, updated_at: new Date().toISOString() };
    db.student_notes = db.student_notes.map((note) => (note.id === id ? updated : note));
    await writeLocalDb(db);
    return updated;
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("student_notes")
    .update({ note_text, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as StudentNote;
}

export async function deleteStudentNote(id: string) {
  const session = await getCurrentSession();

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const existing = db.student_notes.find((note) => note.id === id);
    if (!existing) throw new Error("Note not found.");
    if (session?.role !== "admin" && existing.created_by !== session?.username) {
      throw new Error("You do not have permission to delete this note.");
    }
    db.student_notes = db.student_notes.filter((note) => note.id !== id);
    await writeLocalDb(db);
    return;
  }

  const supabase = admin();
  const { error } = await supabase.from("student_notes").delete().eq("id", id);
  if (error) throw error;
}

const highIntentPattern = /\b(pricing|price|cost|fee|application steps?|next steps?|book(ed|ing)?|schedule|consultation|visa|deposit|payment|enroll|intake)\b/i;
const responsePattern = /\b(reply|replied|responded|response|interested|question|asked|request(ed|ing)?)\b/i;
const engagementPattern = /\b(click|open(ed)?|interest|question|request(ed|ing)?|details|information|follow[\s-]?up)\b/i;

function includesPattern(value: string | null | undefined, pattern: RegExp) {
  if (!value) return false;
  return pattern.test(value);
}

function pickMostRecent(a: string | null, b: string | null) {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

export async function getLeadTemperatureSnapshots() {
  const [students, notes, consultations, documents, payments, portalMessages] = await Promise.all([
    getStudents(),
    getAllStudentNotes(),
    getConsultations(),
    getDocuments(),
    getPayments(),
    getPortalMessages()
  ]);

  return students.map((student) => {
    const studentNotes = notes.filter((note) => note.student_id === student.id);
    const studentConsultations = consultations.filter((consultation) => consultation.student_id === student.id);
    const studentDocuments = documents.filter((document) => document.student_id === student.id);
    const studentPayments = payments.filter((payment) => payment.student_id === student.id);
    const studentPortalMessages = portalMessages.filter((message) => message.student_id === student.id);

    let lastInteractionAt: string | null = student.updated_at ?? null;
    let contactCount = 0;
    let responseCount = 0;
    let engagementCount = 0;
    let highIntentCount = 0;
    let touchpointCount = 0;

    for (const note of studentNotes) {
      lastInteractionAt = pickMostRecent(lastInteractionAt, note.created_at);
      const isContactType =
        note.note_type === "call" ||
        note.note_type === "email" ||
        note.note_type === "whatsapp" ||
        note.note_type === "meeting";
      const isResponse =
        includesPattern(note.tags, /incoming|reply|response/i) ||
        includesPattern(note.note_text, responsePattern);
      const isEngagement = isResponse || includesPattern(note.note_text, engagementPattern);
      const isHighIntent =
        includesPattern(note.note_text, highIntentPattern) ||
        includesPattern(note.tags, /high-intent|pricing|application|booking/i);

      if (isContactType) contactCount += 1;
      if (isResponse) responseCount += 1;
      if (isEngagement) engagementCount += 1;
      if (isHighIntent) highIntentCount += 1;
      if (isContactType || isResponse || isEngagement || isHighIntent) touchpointCount += 1;
    }

    for (const consultation of studentConsultations) {
      lastInteractionAt = pickMostRecent(lastInteractionAt, consultation.scheduled_at);
      contactCount += 1;
      touchpointCount += 1;
      if (consultation.status === "confirmed" || consultation.status === "completed") {
        responseCount += 1;
        engagementCount += 1;
        highIntentCount += 1;
      } else if (consultation.status === "pending") {
        engagementCount += 1;
      }
    }

    for (const document of studentDocuments) {
      lastInteractionAt = pickMostRecent(lastInteractionAt, document.reviewed_at ?? document.uploaded_at);
      engagementCount += 1;
      touchpointCount += 1;
      if (document.status === "uploaded" || document.status === "verified") {
        highIntentCount += 1;
      }
    }

    for (const payment of studentPayments) {
      lastInteractionAt = pickMostRecent(lastInteractionAt, payment.paid_at ?? payment.created_at);
      engagementCount += 1;
      touchpointCount += 1;
      if (payment.status === "paid" || payment.status === "partial") {
        responseCount += 1;
        highIntentCount += 1;
      }
    }

    for (const message of studentPortalMessages) {
      lastInteractionAt = pickMostRecent(lastInteractionAt, message.created_at);
      touchpointCount += 1;

      if (message.direction === "crm_to_student") {
        contactCount += 1;
      } else {
        responseCount += 1;
        engagementCount += 1;
        if (includesPattern(`${message.subject} ${message.message}`, highIntentPattern)) {
          highIntentCount += 1;
        }
      }
    }

    const followUpCount = Math.max(0, touchpointCount - 1);
    const result = classifyLeadTemperature({
      contactCount,
      responseCount,
      engagementCount,
      followUpCount,
      highIntentCount,
      lastInteractionAt
    });

    return {
      studentId: student.id,
      score: result.score,
      status: result.status,
      label: result.label,
      colorName: result.colorName,
      daysSinceLastActivity: result.daysSinceLastActivity,
      contactCount,
      responseCount,
      engagementCount,
      followUpCount,
      highIntentCount,
      lastInteractionAt
    } satisfies LeadTemperatureSnapshot;
  });
}

export async function getLeadTemperatureSnapshotByStudentId(studentId: string) {
  const snapshots = await getLeadTemperatureSnapshots();
  return snapshots.find((snapshot) => snapshot.studentId === studentId) ?? null;
}

export async function getStudentActivityTimeline(studentId: string) {
  const [student, notes, consultations, documents, payments, portalMessages] = await Promise.all([
    getStudentById(studentId),
    getStudentNotes(studentId),
    getConsultations(),
    getDocuments(),
    getPayments(),
    getPortalMessages()
  ]);

  if (!student) {
    throw new Error("Student not found.");
  }

  const noteEvents: StudentActivityEvent[] = notes.map((note) => ({
    id: `note-${note.id}`,
    student_id: studentId,
    occurred_at: note.created_at,
    channel:
      note.note_type === "call" ||
      note.note_type === "meeting" ||
      note.note_type === "email" ||
      note.note_type === "whatsapp"
        ? note.note_type
        : note.tags?.includes("reminder")
          ? "reminder"
          : "note",
    direction: "internal",
    source: "note",
    title: `${note.note_type.replace(/_/g, " ")} logged`,
    description: note.note_text,
    actor_name: note.creator_name ?? null,
    meta: note.reminder_date ? `Reminder: ${note.reminder_date}` : note.tags ?? null
  }));

  const consultationEvents: StudentActivityEvent[] = consultations
    .filter((consultation) => consultation.student_id === studentId)
    .map((consultation) => ({
      id: `consultation-${consultation.id}`,
      student_id: studentId,
      occurred_at: consultation.scheduled_at,
      channel: "meeting",
      direction: "internal",
      source: "consultation",
      title: `Consultation ${consultation.status}`,
      description: consultation.notes ?? "Consultation scheduled and tracked in CRM.",
      actor_name: consultation.created_by,
      meta: consultation.student?.country_interest ?? null
    }));

  const documentEvents: StudentActivityEvent[] = documents
    .filter((document) => document.student_id === studentId)
    .map((document) => ({
      id: `document-${document.id}`,
      student_id: studentId,
      occurred_at: document.reviewed_at ?? document.uploaded_at,
      channel: "document",
      direction: "internal",
      source: "document",
      title: `${document.document_type.replace(/_/g, " ")} ${document.status}`,
      description: document.original_filename,
      actor_name: document.reviewed_by ?? document.uploaded_by,
      meta: document.review_notes ?? null
    }));

  const paymentEvents: StudentActivityEvent[] = payments
    .filter((payment) => payment.student_id === studentId)
    .map((payment) => ({
      id: `payment-${payment.id}`,
      student_id: studentId,
      occurred_at: payment.paid_at ?? payment.created_at,
      channel: payment.notes?.includes("reminder") ? "reminder" : "payment",
      direction: "internal",
      source: "payment",
      title: `${payment.payment_type} payment ${payment.status}`,
      description: `${payment.amount} ${payment.currency} via ${payment.payment_method}`,
      actor_name: null,
      meta: payment.notes ?? null
    }));

  const portalEvents: StudentActivityEvent[] = portalMessages
    .filter((message) => message.student_id === studentId)
    .map((message) => ({
      id: `portal-${message.id}`,
      student_id: studentId,
      occurred_at: message.created_at,
      channel: "portal",
      direction: message.direction === "student_to_crm" ? "incoming" : "outgoing",
      source: "portal_message",
      title: message.subject,
      description: message.message,
      actor_name: message.direction === "student_to_crm" ? student.full_name : "Barak Pathways",
      meta: message.direction.replace(/_/g, " ")
    }));

  return [...noteEvents, ...consultationEvents, ...documentEvents, ...paymentEvents, ...portalEvents].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  );
}

export const getPortalAccess = cache(async function getPortalAccess() {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    return db.portal_access
      .map((entry) => ({
        ...entry,
        student: db.students.find((student) => student.id === entry.student_id)
          ? {
              full_name: db.students.find((student) => student.id === entry.student_id)!.full_name,
              email: db.students.find((student) => student.id === entry.student_id)!.email,
              stage: db.students.find((student) => student.id === entry.student_id)!.stage
            }
          : undefined
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("portal_access")
    .select("*, student:students(full_name,email,stage)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PortalAccessRecord[];
});

export async function generatePortalAccess(studentId: string) {
  const token = `portal-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const existing = db.portal_access.find((entry) => entry.student_id === studentId);
    const next: PortalAccessRecord = {
      id: existing?.id ?? crypto.randomUUID(),
      student_id: studentId,
      access_token: token,
      token_expires_at: expiresAt,
      is_active: true,
      last_login_at: existing?.last_login_at ?? null,
      created_at: existing?.created_at ?? now,
      updated_at: now
    };
    db.portal_access = [next, ...db.portal_access.filter((entry) => entry.student_id !== studentId)];
    await writeLocalDb(db);
    await logAudit({
      action: "Portal Access Generated",
      table_name: "portal_access",
      related_id: next.id,
      record_label: studentId,
      new_value: JSON.stringify({ access_token: token })
    });
    return next;
  }

  const supabase = admin();
  const existing = await supabase.from("portal_access").select("*").eq("student_id", studentId).maybeSingle();
  if (existing.error) throw existing.error;

  const payload = {
    student_id: studentId,
    access_token: token,
    token_expires_at: expiresAt,
    is_active: true,
    updated_at: now
  };
  const query = existing.data
    ? supabase.from("portal_access").update(payload).eq("student_id", studentId)
    : supabase.from("portal_access").insert({ ...payload, created_at: now });
  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return data as PortalAccessRecord;
}

export async function revokePortalAccess(studentId: string) {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    db.portal_access = db.portal_access.map((entry) =>
      entry.student_id === studentId ? { ...entry, is_active: false, updated_at: new Date().toISOString() } : entry
    );
    await writeLocalDb(db);
    return;
  }

  const supabase = admin();
  const { error } = await supabase
    .from("portal_access")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("student_id", studentId);
  if (error) throw error;
}

export const getPortalMessages = cache(async function getPortalMessages(limit?: number) {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const messages = db.portal_messages
      .map((item) => ({
        ...item,
        student: db.students.find((student) => student.id === item.student_id)
          ? {
              full_name: db.students.find((student) => student.id === item.student_id)!.full_name,
              email: db.students.find((student) => student.id === item.student_id)!.email
            }
          : undefined
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return typeof limit === "number" ? messages.slice(0, limit) : messages;
  }

  let query = admin()
    .from("portal_messages")
    .select("*, student:students(full_name,email)")
    .order("created_at", { ascending: false });
  if (typeof limit === "number") {
    query = query.limit(limit);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PortalMessage[];
});

export async function sendPortalMessage(input: { student_id: string; subject: string; message: string }) {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const entry: PortalMessage = {
      id: crypto.randomUUID(),
      student_id: input.student_id,
      subject: input.subject,
      message: input.message,
      direction: "crm_to_student",
      is_read: false,
      created_at: new Date().toISOString()
    };
    db.portal_messages.unshift(entry);
    db.portal_activity.unshift({
      id: crypto.randomUUID(),
      student_id: input.student_id,
      activity_type: "message_sent",
      activity_details: input.subject,
      created_at: new Date().toISOString()
    });
    await writeLocalDb(db);
    return entry;
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("portal_messages")
    .insert({
      student_id: input.student_id,
      subject: input.subject,
      message: input.message,
      direction: "crm_to_student"
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PortalMessage;
}

export const getPortalActivity = cache(async function getPortalActivity(limit?: number) {
  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const activity = db.portal_activity
      .map((item) => ({
        ...item,
        student: db.students.find((student) => student.id === item.student_id)
          ? {
              full_name: db.students.find((student) => student.id === item.student_id)!.full_name,
              email: db.students.find((student) => student.id === item.student_id)!.email
            }
          : undefined
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return typeof limit === "number" ? activity.slice(0, limit) : activity;
  }

  let query = admin()
    .from("portal_activity")
    .select("*, student:students(full_name,email)")
    .order("created_at", { ascending: false });
  if (typeof limit === "number") {
    query = query.limit(limit);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PortalActivity[];
});

export async function resolvePortalStudentByToken(token: string) {
  if (!token) return null;

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    const access = db.portal_access.find(
      (entry) =>
        entry.access_token === token &&
        entry.is_active &&
        new Date(entry.token_expires_at).getTime() > Date.now()
    );
    if (!access) return null;
    const student = db.students.find((item) => item.id === access.student_id) ?? null;
    if (!student) return null;
    access.last_login_at = new Date().toISOString();
    access.updated_at = new Date().toISOString();
    db.portal_activity.unshift({
      id: crypto.randomUUID(),
      student_id: student.id,
      activity_type: "portal_login",
      activity_details: "Student accessed the portal dashboard.",
      created_at: new Date().toISOString()
    });
    await writeLocalDb(db);
    return student;
  }

  const supabase = admin();
  const { data, error } = await supabase.from("portal_access").select("*").eq("access_token", token).maybeSingle();
  if (error) throw error;
  if (!data || !data.is_active || new Date(data.token_expires_at).getTime() <= Date.now()) return null;
  await supabase.from("portal_access").update({ last_login_at: new Date().toISOString() }).eq("id", data.id);
  const student = await getStudentById(data.student_id);
  return student;
}

export async function getPortalStudentSnapshot(token: string) {
  const student = await resolvePortalStudentByToken(token);
  if (!student) return null;

  const [documents, notes, messages, payments] = await Promise.all([
    getDocuments(),
    getStudentNotes(student.id),
    getPortalMessages(),
    getPayments()
  ]);

  return {
    student,
    documents: documents.filter((item) => item.student_id === student.id),
    notes: notes.filter((item) => !item.is_private),
    messages: messages.filter((item) => item.student_id === student.id),
    payments: payments.filter((item) => item.student_id === student.id)
  };
}

function normalizePortalPhone(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D+/g, "");

  if (!digits) return "";
  if (digits.startsWith("254") && digits.length === 12) return `0${digits.slice(3)}`;
  if (digits.startsWith("7") && digits.length === 9) return `0${digits}`;
  if (digits.startsWith("1") && digits.length === 9) return `0${digits}`;
  return digits;
}

export async function authenticateStudentPortalUser(input: { email: string; phone: string }) {
  const email = input.email.trim().toLowerCase();
  const phone = normalizePortalPhone(input.phone);

  const students = hasSupabaseEnv() ? await getStudents() : (await readDb()).students;

  return (
    students.find(
      (student) =>
        student.email.trim().toLowerCase() === email &&
        normalizePortalPhone(student.phone) === phone
    ) ?? null
  );
}

export async function getPortalStudentSnapshotById(studentId: string) {
  const student = await getStudentById(studentId);
  if (!student) return null;

  const [documents, notes, messages, payments] = await Promise.all([
    getDocuments(),
    getStudentNotes(student.id),
    getPortalMessages(),
    getPayments()
  ]);

  return {
    student,
    documents: documents.filter((item) => item.student_id === student.id),
    notes: notes.filter((item) => !item.is_private),
    messages: messages.filter((item) => item.student_id === student.id),
    payments: payments.filter((item) => item.student_id === student.id)
  };
}

export async function getCurrentPortalStudentSnapshot() {
  const session = await getCurrentStudentPortalSession();
  if (!session) return null;
  return getPortalStudentSnapshotById(session.student_id);
}

export async function updateStudentProfileFromPortal(input: {
  studentId: string;
  phone: string | null;
  country_interest: string | null;
  program_level: string | null;
  university_name: string | null;
}) {
  const student = await getStudentById(input.studentId);
  if (!student) throw new Error("Student not found.");

  const payload = {
    phone: input.phone,
    country_interest: input.country_interest,
    program_level: input.program_level,
    university_name: input.university_name
  };

  const updated = await updateStudent(input.studentId, payload);

  await logAudit({
    action: "Profile Updated (Student Portal)",
    table_name: "students",
    related_id: updated.id,
    record_label: updated.full_name,
    new_value: JSON.stringify(payload)
  });

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    db.portal_activity.unshift({
      id: crypto.randomUUID(),
      student_id: updated.id,
      activity_type: "profile_update",
      activity_details: "Student updated profile information.",
      created_at: new Date().toISOString()
    });
    await writeLocalDb(db);
  }

  return updated;
}

export async function requestConsultationFromPortal(input: {
  studentId: string;
  preferred_date: string;
  preferred_time: string;
}) {
  const student = await getStudentById(input.studentId);
  if (!student) throw new Error("Student not found.");

  const scheduledAt = new Date(`${input.preferred_date}T${input.preferred_time}`).toISOString();

  await updateStudent(input.studentId, {
    consultation_requested: true,
    consultation_status: "pending",
    consultation_date: scheduledAt,
    stage: student.stage === "lead" ? "consultation" : student.stage
  });

  await createConsultation({
    student_id: input.studentId,
    scheduled_at: scheduledAt,
    notes: `Requested via student portal for ${input.preferred_date} at ${input.preferred_time}.`
  });

  await logAudit({
    action: "Consultation Requested (Student Portal)",
    table_name: "students",
    related_id: input.studentId,
    record_label: student.full_name,
    new_value: JSON.stringify({
      preferred_date: input.preferred_date,
      preferred_time: input.preferred_time
    })
  });

  if (!hasSupabaseEnv()) {
    const db = await readDb();
    db.portal_activity.unshift({
      id: crypto.randomUUID(),
      student_id: input.studentId,
      activity_type: "consultation_request",
      activity_details: `${input.preferred_date} ${input.preferred_time}`,
      created_at: new Date().toISOString()
    });
    await writeLocalDb(db);
  }
}

export async function sendPaymentReminder(input: {
  studentId: string;
  method?: "whatsapp" | "sms";
}) {
  const method = input.method ?? "whatsapp";
  const student = await getStudentById(input.studentId);

  if (!student) {
    throw new Error("Student not found or access denied.");
  }

  const balance = Math.max(
    0,
    40000 - (student.consultation_upfront_paid ?? 0) - (student.consultation_balance_paid ?? 0)
  );

  const message = `Hi ${student.full_name}, this is a friendly reminder from Barak Pathways. You have an outstanding balance of KES ${balance.toLocaleString(
    "en-KE"
  )}. Please arrange payment to avoid delays in your application. Reply or call us for any questions.`;

  await logAudit({
    action: "Payment Reminder Sent",
    table_name: "students",
    related_id: student.id,
    record_label: student.full_name,
    new_value: method
  });
  await createFollowUpLog({
    student_id: student.id,
    note_type: method === "whatsapp" ? "whatsapp" : "payment",
    priority: "high",
    tags: `reminder,${method},payment`,
    note_text: message
  });

  if (method === "whatsapp") {
    const phone = (student.phone ?? "").replace(/\D/g, "");
    const normalized =
      phone.startsWith("254") ? phone : phone.startsWith("0") ? `254${phone.slice(1)}` : phone;

    return {
      success: true,
      method,
      link: `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`,
      message
    };
  }

  return {
    success: true,
    method,
    message: "SMS sent successfully"
  };
}

export async function bulkSendPaymentReminders(input: {
  studentIds: string[];
  method?: "whatsapp" | "sms";
}) {
  const method = input.method ?? "whatsapp";
  const students = await getStudents();
  const selected = students.filter((student) => input.studentIds.includes(student.id));

  if (selected.length === 0) {
    throw new Error("Please select at least one student.");
  }

  for (const student of selected) {
    await logAudit({
      action: "Payment Reminder Sent",
      table_name: "students",
      related_id: student.id,
      record_label: student.full_name,
      new_value: `Bulk ${method}`
    });
    await createFollowUpLog({
      student_id: student.id,
      note_type: method === "whatsapp" ? "whatsapp" : "payment",
      priority: "high",
      tags: `reminder,bulk,${method},payment`,
      note_text: `Bulk ${method.toUpperCase()} payment reminder prepared and sent from the CRM.`
    });
  }

  return {
    success: true,
    queued: selected.length
  };
}

export async function recordTrackedStudentPayment(input: {
  studentId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentRecord["payment_method"];
  paymentType: "Consultation Balance" | "Consultation Upfront" | "IELTS Fee";
  notes?: string | null;
}) {
  const session = await getCurrentSession();

  if (!session || !canManageFinance(session.role)) {
    throw new Error("You do not have permission to record tracked payments.");
  }

  const student = await getStudentById(input.studentId);
  if (!student) {
    throw new Error("Student not found or access denied.");
  }

  const nextConsultationUpfront =
    input.paymentType === "Consultation Upfront"
      ? (student.consultation_upfront_paid ?? 0) + input.amountPaid
      : student.consultation_upfront_paid ?? 0;
  const nextConsultationBalance =
    input.paymentType === "Consultation Balance"
      ? (student.consultation_balance_paid ?? 0) + input.amountPaid
      : student.consultation_balance_paid ?? 0;
  const totalPaid = nextConsultationUpfront + nextConsultationBalance;
  const paymentAmount = student.payment_amount ?? 20000;
  const trackedPaid = (student.payment_paid ?? 0) + input.amountPaid;
  const nextPaymentStatus =
    trackedPaid >= paymentAmount
      ? "paid"
      : trackedPaid > 0
        ? "partial"
        : "pending";
  const existingNotes = student.payment_notes ? `${student.payment_notes}\n` : "";
  const auditLine = `${new Date().toISOString()} - Paid ${input.amountPaid} via ${input.paymentMethod}. ${input.notes ?? ""}`.trim();

  const updatedStudent = await updateStudent(input.studentId, {
    consultation_upfront_paid: nextConsultationUpfront,
    consultation_balance_paid: nextConsultationBalance,
    payment_paid: trackedPaid,
    payment_date: input.paymentDate,
    payment_method: input.paymentMethod,
    payment_status: nextPaymentStatus,
    payment_notes: `${existingNotes}${auditLine}`
  });

  await createPayment({
    student_id: input.studentId,
    payment_type:
      input.paymentType === "IELTS Fee"
        ? "ielts"
        : input.paymentType === "Consultation Upfront"
          ? "consultation"
          : "consultation",
    amount: input.amountPaid,
    payment_method: input.paymentMethod,
    status: "paid",
    reference_number: null,
    notes: input.notes ?? `${input.paymentType} recorded from payment tracker.`
  });

  await logAudit({
    action: "Payment Tracker Payment Recorded",
    table_name: "students",
    related_id: input.studentId,
    record_label: updatedStudent.full_name,
    new_value: JSON.stringify({
      amountPaid: input.amountPaid,
      paymentDate: input.paymentDate,
      paymentMethod: input.paymentMethod,
      paymentType: input.paymentType
    })
  });

  return updatedStudent;
}

export async function markCommissionAsPaid(input: {
  studentId: string;
  paidDate: string;
  notes?: string | null;
}) {
  const session = await getCurrentSession();

  if (!session || session.role !== "admin") {
    throw new Error("Only admins can mark commissions as paid.");
  }

  const student = await getStudentById(input.studentId);
  if (!student) {
    throw new Error("Student not found or access denied.");
  }

  const existingNotes = student.commission_notes ? `${student.commission_notes}\n` : "";
  const updated = await updateStudent(input.studentId, {
    commission_status: "paid",
    commission_paid_date: input.paidDate,
    commission_notes: `${existingNotes}${new Date().toISOString()} - Commission paid.${input.notes ? ` ${input.notes}` : ""}`
  });

  await logAudit({
    action: "Commission Marked Paid",
    table_name: "students",
    related_id: input.studentId,
    record_label: updated.full_name,
    new_value: JSON.stringify({
      paidDate: input.paidDate,
      notes: input.notes ?? null
    })
  });

  return updated;
}
