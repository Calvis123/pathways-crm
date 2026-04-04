import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  mockAuditLogs,
  mockCommissions,
  mockConsultations,
  mockDocuments,
  mockExpenses,
  mockPayments,
  mockPortalAccess,
  mockPortalActivity,
  mockPortalMessages,
  mockReferrals,
  mockStudentNotes,
  mockStudents,
  mockTasks,
  mockTemplates,
  mockUsers
} from "@/lib/mock-data";
import type { LocalDatabase } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "local-db.json");

function createSeed(): LocalDatabase {
  return {
    students: structuredClone(mockStudents),
    consultations: structuredClone(mockConsultations),
    documents: structuredClone(mockDocuments),
    commissions: structuredClone(mockCommissions),
    payments: structuredClone(mockPayments),
    users: structuredClone(mockUsers),
    referrals: structuredClone(mockReferrals),
    student_notes: structuredClone(mockStudentNotes),
    portal_access: structuredClone(mockPortalAccess),
    portal_messages: structuredClone(mockPortalMessages),
    portal_activity: structuredClone(mockPortalActivity),
    templates: structuredClone(mockTemplates),
    tasks: structuredClone(mockTasks),
    audit_logs: structuredClone(mockAuditLogs),
    expenses: structuredClone(mockExpenses)
  };
}

async function ensureDbFile() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dbFile, "utf8");
  } catch {
    await writeFile(dbFile, JSON.stringify(createSeed(), null, 2), "utf8");
  }
}

export async function readLocalDb(): Promise<LocalDatabase> {
  await ensureDbFile();
  const raw = await readFile(dbFile, "utf8");
  const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
  const seed = createSeed();

  return {
    students: parsed.students ?? seed.students,
    consultations: parsed.consultations ?? seed.consultations,
    documents: parsed.documents ?? seed.documents,
    commissions: parsed.commissions ?? seed.commissions,
    payments: parsed.payments ?? seed.payments,
    users: parsed.users ?? seed.users,
    referrals: parsed.referrals ?? seed.referrals,
    student_notes: parsed.student_notes ?? seed.student_notes,
    portal_access: parsed.portal_access ?? seed.portal_access,
    portal_messages: parsed.portal_messages ?? seed.portal_messages,
    portal_activity: parsed.portal_activity ?? seed.portal_activity,
    templates: parsed.templates ?? seed.templates,
    tasks: parsed.tasks ?? seed.tasks,
    audit_logs: parsed.audit_logs ?? seed.audit_logs,
    expenses: parsed.expenses ?? seed.expenses
  };
}

export async function writeLocalDb(db: LocalDatabase) {
  await ensureDbFile();
  await writeFile(dbFile, JSON.stringify(db, null, 2), "utf8");
}
