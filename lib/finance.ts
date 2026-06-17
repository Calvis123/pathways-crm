import type { Student } from "@/lib/types";

export const CONSULTATION_FEE = 40000;
export const CONSULTATION_UPFRONT_AMOUNT = 20000;
export const CONSULTATION_BALANCE_AMOUNT = CONSULTATION_FEE - CONSULTATION_UPFRONT_AMOUNT;

export function getConsultationPaid(student: Pick<Student, "consultation_upfront_paid" | "consultation_balance_paid">) {
  return (student.consultation_upfront_paid ?? 0) + (student.consultation_balance_paid ?? 0);
}

export function getConsultationBalance(student: Pick<Student, "consultation_upfront_paid" | "consultation_balance_paid">) {
  return Math.max(0, CONSULTATION_FEE - getConsultationPaid(student));
}

export function getTrackedPaymentTarget(student: Pick<Student, "payment_amount">) {
  return student.payment_amount && student.payment_amount > 0 ? student.payment_amount : CONSULTATION_BALANCE_AMOUNT;
}

export function getStudentPaymentStatus(totalPaid: number) {
  if (totalPaid >= CONSULTATION_FEE) return "paid";
  if (totalPaid > 0) return "partial";
  return "pending";
}

