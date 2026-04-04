import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const ENV_FILES = [".env.local", ".env"];
const BATCH_SIZE = 200;

for (const file of ENV_FILES) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) continue;

  const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function readEnv(primary, aliases = []) {
  for (const key of [primary, ...aliases]) {
    const value = process.env[key];
    if (value !== undefined && value !== "") {
      return value;
    }
  }
  return "";
}

function requireAnyEnv(primary, aliases = []) {
  const value = readEnv(primary, aliases);
  if (!value) {
    throw new Error(`Missing required environment variable: ${primary}${aliases.length ? ` (or ${aliases.join(", ")})` : ""}`);
  }
  return value;
}

function rows(value) {
  return Array.isArray(value) ? value : [];
}

function chunk(items, size = BATCH_SIZE) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toDateOnly(value) {
  const iso = toIso(value);
  return iso ? iso.slice(0, 10) : null;
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["1", "true", "yes", "y"].includes(value.trim().toLowerCase());
  }
  return false;
}

function pickString(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function placeholderEmail(prefix, id) {
  return `${prefix}-${id}@migrated.local`;
}

function buildUniqueEmail(rawEmail, fallbackBase, usedEmails) {
  const normalized = (pickString(rawEmail) ?? fallbackBase).toLowerCase();
  let candidate = normalized;
  let suffix = 1;

  while (usedEmails.has(candidate)) {
    const atIndex = normalized.indexOf("@");
    if (atIndex === -1) {
      candidate = `${normalized}-${suffix}`;
    } else {
      candidate = `${normalized.slice(0, atIndex)}+${suffix}${normalized.slice(atIndex)}`;
    }
    suffix += 1;
  }

  usedEmails.add(candidate);
  return candidate;
}

function normalizeRole(value) {
  const role = pickString(value)?.toLowerCase();
  if (role === "admin") return "admin";
  if (role === "consultant") return "consultant";
  if (role === "marketing") return "marketing";
  if (role === "operations") return "operations";
  if (role === "ielts_trainer") return "ielts_trainer";
  return "employee";
}

function normalizeStage(value) {
  const stage = pickString(value)?.toLowerCase();
  const allowed = new Set([
    "lead",
    "inquiry",
    "consultation",
    "application",
    "visa",
    "enrolled",
    "placed",
    "employment",
    "lost"
  ]);
  return allowed.has(stage) ? stage : "lead";
}

function normalizeConsultationStatus(value) {
  const status = pickString(value)?.toLowerCase();
  const allowed = new Set(["pending", "confirmed", "completed", "cancelled"]);
  return allowed.has(status) ? status : "pending";
}

function normalizeDocumentStatus(value) {
  const status = pickString(value)?.toLowerCase();
  if (status === "approved" || status === "verified") return "verified";
  if (status === "uploaded") return "uploaded";
  if (status === "rejected") return "rejected";
  return "pending";
}

function normalizeCommissionStatus(value) {
  const status = pickString(value)?.toLowerCase();
  if (status === "invoiced") return "invoiced";
  if (status === "paid") return "paid";
  if (status === "overdue") return "overdue";
  return "pending";
}

function normalizePaymentStatus(value) {
  const status = pickString(value)?.toLowerCase();
  if (status === "full" || status === "paid") return "paid";
  if (status === "partial") return "partial";
  if (status === "overdue") return "overdue";
  if (status === "refunded") return "refunded";
  return "pending";
}

function normalizePaymentMethod(value) {
  const method = pickString(value)?.toLowerCase();
  if (method === "cash") return "cash";
  if (method === "bank" || method === "bank_transfer") return "bank_transfer";
  if (method === "card") return "card";
  return "mpesa";
}

function normalizePaymentType(value) {
  const type = pickString(value)?.toLowerCase();
  if (["consultation", "application", "ielts", "visa", "tuition", "other"].includes(type)) {
    return type;
  }
  return "consultation";
}

function normalizeTaskStatus(value) {
  const status = pickString(value)?.toLowerCase();
  if (status === "in_progress") return "in_progress";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "pending";
}

function normalizePriority(value) {
  const priority = pickString(value)?.toLowerCase();
  if (priority === "low") return "low";
  if (priority === "high") return "high";
  if (priority === "urgent") return "urgent";
  return "medium";
}

function normalizeExpenseCategory(value) {
  const category = pickString(value)?.toLowerCase();
  const allowed = new Set([
    "rent",
    "salaries",
    "marketing",
    "utilities",
    "office_supplies",
    "travel",
    "training",
    "internet",
    "software",
    "other"
  ]);
  return allowed.has(category) ? category : "other";
}

function normalizeReferralStatus(value) {
  const status = pickString(value)?.toLowerCase();
  if (status === "contacted") return "contacted";
  if (status === "converted") return "converted";
  if (status === "rewarded") return "rewarded";
  return "new";
}

function normalizeNoteType(value) {
  const noteType = pickString(value)?.toLowerCase();
  const allowed = new Set(["general", "call", "meeting", "email", "whatsapp", "payment", "visa", "important"]);
  return allowed.has(noteType) ? noteType : "general";
}

function normalizeNotePriority(value) {
  const priority = pickString(value)?.toLowerCase();
  if (priority === "low") return "low";
  if (priority === "high") return "high";
  if (priority === "urgent") return "urgent";
  return "medium";
}

async function tableExists(connection, tableName) {
  const [result] = await connection.query("SHOW TABLES LIKE ?", [tableName]);
  return rows(result).length > 0;
}

async function readTable(connection, tableName) {
  const [result] = await connection.query(`SELECT * FROM \`${tableName}\``);
  return rows(result);
}

async function upsertBatches(supabase, tableName, payload, options = {}) {
  for (const batch of chunk(payload)) {
    const { error } = await supabase.from(tableName).upsert(batch, options);
    if (error) throw new Error(`Supabase upsert failed for ${tableName}: ${error.message}`);
  }
}

async function insertBatches(supabase, tableName, payload) {
  for (const batch of chunk(payload)) {
    const { error } = await supabase.from(tableName).insert(batch);
    if (error) throw new Error(`Supabase insert failed for ${tableName}: ${error.message}`);
  }
}

async function ensureFreshTarget(supabase) {
  if (String(process.env.SUPABASE_ALLOW_EXISTING_DATA).toLowerCase() === "true") return;

  const tables = ["users", "students", "payments", "student_documents"];
  for (const tableName of tables) {
    const { count, error } = await supabase.from(tableName).select("*", { head: true, count: "exact" });
    if (error) throw new Error(`Could not inspect ${tableName}: ${error.message}`);
    if ((count ?? 0) > 0) {
      throw new Error(
        `Supabase table "${tableName}" is not empty. Use a fresh schema or set SUPABASE_ALLOW_EXISTING_DATA=true.`
      );
    }
  }
}

async function main() {
  const mysqlConnection = await mysql.createConnection({
    host: requireAnyEnv("MYSQL_HOST", ["DB_HOST"]),
    port: Number(readEnv("MYSQL_PORT", ["DB_PORT"]) || "3306"),
    user: requireAnyEnv("MYSQL_USER", ["DB_USER"]),
    password: readEnv("MYSQL_PASSWORD", ["DB_PASS"]),
    database: requireAnyEnv("MYSQL_DATABASE", ["DB_NAME"])
  });

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    await ensureFreshTarget(supabase);

    const userIdMap = new Map();
    const studentIdMap = new Map();
    const summary = [];
    const usedUserEmails = new Set();
    const usedStudentEmails = new Set();

    if (await tableExists(mysqlConnection, "users")) {
      const source = await readTable(mysqlConnection, "users");
      const payload = source.map((user) => ({
        username: pickString(user.username)?.toLowerCase() ?? `user-${user.id}`,
        password: pickString(user.password) ?? "barak123",
        full_name: pickString(user.full_name) ?? pickString(user.username) ?? `User ${user.id}`,
        email: buildUniqueEmail(
          user.email,
          placeholderEmail("user", user.id),
          usedUserEmails
        ),
        role: normalizeRole(user.role),
        status: pickString(user.status)?.toLowerCase() === "inactive" ? "inactive" : "active",
        phone: pickString(user.phone),
        last_login_at: toIso(user.last_login ?? user.last_login_at),
        created_at: toIso(user.created_at) ?? new Date().toISOString()
      }));

      if (payload.length > 0) {
        await upsertBatches(supabase, "users", payload, { onConflict: "username" });
        const { data, error } = await supabase.from("users").select("id, username");
        if (error) throw new Error(`Failed to read users back from Supabase: ${error.message}`);
        const byUsername = new Map(rows(data).map((entry) => [entry.username, entry.id]));
        source.forEach((user, index) => {
          userIdMap.set(String(user.id), byUsername.get(payload[index].username) ?? null);
        });
      }

      summary.push(`Users: ${payload.length}`);
    }

    if (await tableExists(mysqlConnection, "students")) {
      const source = await readTable(mysqlConnection, "students");
      const payload = source.map((student) => ({
        full_name: pickString(student.name ?? student.full_name) ?? `Student ${student.id}`,
        email: buildUniqueEmail(
          student.email,
          placeholderEmail("student", student.id),
          usedStudentEmails
        ),
        phone: pickString(student.phone),
        passport_number: pickString(student.passport_number),
        location: pickString(student.location),
        country_interest: pickString(student.country ?? student.country_interest ?? student.destination),
        program_level: pickString(student.program ?? student.program_level),
        university_name: pickString(student.university ?? student.university_name),
        enrollment_date: toDateOnly(student.enrollment_date),
        stage: normalizeStage(student.stage),
        consultation_requested: toBool(student.consultation_requested),
        consultation_status: student.consultation_status
          ? normalizeConsultationStatus(student.consultation_status)
          : null,
        consultation_date: toIso(student.consultation_date),
        visa_status: pickString(student.visa_status),
        ielts_enrolled: toBool(student.ielts_enrolled),
        ielts_amount: student.ielts_amount === null ? null : toNumber(student.ielts_amount, 0),
        ielts_payment_status: pickString(student.ielts_payment_status)?.toLowerCase() ?? null,
        ielts_overall_score: student.ielts_overall_score === null ? null : toNumber(student.ielts_overall_score, 0),
        ielts_session_count: student.ielts_session_count === null ? null : Math.round(toNumber(student.ielts_session_count, 0)),
        ielts_test_date: toDateOnly(student.ielts_test_date),
        payment_status: student.payment || student.payment_status
          ? normalizePaymentStatus(student.payment ?? student.payment_status)
          : null,
        payment_due_date: toDateOnly(student.payment_due_date),
        payment_amount: student.payment_amount === null ? null : toNumber(student.payment_amount, 0),
        payment_paid: student.payment_paid === null ? null : toNumber(student.payment_paid, 0),
        payment_date: toDateOnly(student.payment_date),
        payment_method: student.payment_method ? normalizePaymentMethod(student.payment_method) : null,
        payment_notes: pickString(student.payment_notes),
        commission_amount: student.commission_amount === null ? null : toNumber(student.commission_amount, 140000),
        commission_status: student.commission_status
          ? normalizeCommissionStatus(student.commission_status)
          : null,
        commission_due_date: toDateOnly(student.commission_due_date),
        commission_paid_date: toDateOnly(student.commission_paid_date),
        commission_institution: pickString(student.commission_institution),
        commission_notes: pickString(student.commission_notes),
        consultation_upfront_paid: toNumber(student.consultation_upfront_paid, 0),
        consultation_balance_paid: toNumber(student.consultation_balance_paid, 0),
        segment: pickString(student.segment)?.toLowerCase() ?? "unsegmented",
        segment_score: student.segment_score === null ? null : Math.round(toNumber(student.segment_score, 0)),
        lead_source: pickString(student.referral_source ?? student.lead_source),
        referral_code: pickString(student.referral_code),
        notes: pickString(student.notes),
        created_by: typeof student.created_by === "string" ? pickString(student.created_by) : null,
        created_at: toIso(student.created_at) ?? new Date().toISOString(),
        updated_at: toIso(student.updated_at) ?? toIso(student.created_at) ?? new Date().toISOString()
      }));

      if (payload.length > 0) {
        await upsertBatches(supabase, "students", payload, { onConflict: "email" });
        const { data, error } = await supabase.from("students").select("id, email");
        if (error) throw new Error(`Failed to read students back from Supabase: ${error.message}`);
        const byEmail = new Map(rows(data).map((entry) => [entry.email, entry.id]));
        source.forEach((student, index) => {
          studentIdMap.set(String(student.id), byEmail.get(payload[index].email) ?? null);
        });
      }

      summary.push(`Students: ${payload.length}`);
    }

    const relationalMigrations = [
      {
        sourceTable: "consultations",
        targetTable: "consultations",
        mapRow: (row) => {
          const studentId = studentIdMap.get(String(row.student_id));
          if (!studentId) return null;
          return {
            student_id: studentId,
            scheduled_at: toIso(row.scheduled_at ?? row.consultation_date ?? row.created_at) ?? new Date().toISOString(),
            status: normalizeConsultationStatus(row.status),
            notes: pickString(row.notes),
            created_by: pickString(row.created_by),
            created_at: toIso(row.created_at) ?? new Date().toISOString()
          };
        }
      },
      {
        sourceTable: "documents",
        targetTable: "student_documents",
        mapRow: (row) => {
          const studentId = studentIdMap.get(String(row.student_id));
          if (!studentId) return null;
          return {
            student_id: studentId,
            document_type: pickString(row.document_type) ?? "other",
            original_filename: pickString(row.original_filename ?? row.filename) ?? `document-${row.id}`,
            file_url: pickString(row.file_path ?? row.file_url),
            file_size: row.file_size === null ? null : Math.round(toNumber(row.file_size, 0)),
            status: normalizeDocumentStatus(row.status),
            review_notes: pickString(row.review_notes),
            uploaded_by: pickString(row.uploaded_by),
            reviewed_by: pickString(row.reviewed_by),
            uploaded_at: toIso(row.uploaded_at) ?? toIso(row.created_at) ?? new Date().toISOString(),
            reviewed_at: toIso(row.reviewed_at)
          };
        }
      },
      {
        sourceTable: "payments",
        targetTable: "payments",
        mapRow: (row) => {
          const studentId = studentIdMap.get(String(row.student_id));
          if (!studentId) return null;
          return {
            student_id: studentId,
            payment_type: normalizePaymentType(row.payment_type),
            amount: toNumber(row.amount, 0),
            currency: pickString(row.currency) ?? "KES",
            status: normalizePaymentStatus(row.status),
            payment_method: normalizePaymentMethod(row.payment_method),
            reference_number: pickString(row.reference_number),
            notes: pickString(row.notes),
            paid_at: toIso(row.paid_at ?? row.payment_date),
            created_at: toIso(row.created_at) ?? new Date().toISOString()
          };
        }
      },
      {
        sourceTable: "commissions",
        targetTable: "commissions",
        mapRow: (row) => {
          const studentId = studentIdMap.get(String(row.student_id));
          if (!studentId) return null;
          return {
            student_id: studentId,
            university_name: pickString(row.university_name ?? row.institution) ?? "Unknown University",
            tuition_fee: toNumber(row.tuition_fee, 0),
            commission_rate: toNumber(row.commission_rate, 0),
            commission_amount: toNumber(row.commission_amount, 0),
            currency: pickString(row.currency) ?? "KES",
            status: normalizeCommissionStatus(row.status),
            due_date: toDateOnly(row.due_date),
            payment_date: toDateOnly(row.payment_date),
            notes: pickString(row.notes),
            created_at: toIso(row.created_at) ?? new Date().toISOString()
          };
        }
      },
      {
        sourceTable: "student_notes",
        targetTable: "student_notes",
        mapRow: (row) => {
          const studentId = studentIdMap.get(String(row.student_id));
          if (!studentId) return null;
          return {
            student_id: studentId,
            created_by: pickString(row.created_by),
            creator_name: pickString(row.creator_name),
            note_text: pickString(row.note_text) ?? "",
            note_type: normalizeNoteType(row.note_type),
            priority: normalizeNotePriority(row.priority),
            is_private: toBool(row.is_private),
            tags: pickString(row.tags),
            reminder_date: toIso(row.reminder_date),
            created_at: toIso(row.created_at) ?? new Date().toISOString(),
            updated_at: toIso(row.updated_at) ?? toIso(row.created_at) ?? new Date().toISOString()
          };
        }
      }
    ];

    for (const migration of relationalMigrations) {
      if (!(await tableExists(mysqlConnection, migration.sourceTable))) continue;
      const source = await readTable(mysqlConnection, migration.sourceTable);
      const payload = source.map(migration.mapRow).filter(Boolean);
      if (payload.length > 0) {
        await insertBatches(supabase, migration.targetTable, payload);
      }
      summary.push(`${migration.targetTable}: ${payload.length}`);
    }

    if (await tableExists(mysqlConnection, "referrals")) {
      const source = await readTable(mysqlConnection, "referrals");
      const payload = source.map((row) => ({
        referrer_name: pickString(row.referrer_name) ?? "Unknown Referrer",
        referrer_email: pickString(row.referrer_email),
        referrer_phone: pickString(row.referrer_phone),
        referral_code: pickString(row.referral_code) ?? `REF-${row.id}`,
        referred_student_name: pickString(row.referred_student_name) ?? "Unknown Student",
        referred_student_email: pickString(row.referred_student_email),
        status: normalizeReferralStatus(row.status),
        reward_amount: toNumber(row.reward_amount, 0),
        notes: pickString(row.notes),
        created_at: toIso(row.created_at) ?? new Date().toISOString()
      }));

      if (payload.length > 0) {
        await upsertBatches(supabase, "referrals", payload, { onConflict: "referral_code" });
      }
      summary.push(`Referrals: ${payload.length}`);
    }

    if (await tableExists(mysqlConnection, "tasks")) {
      const source = await readTable(mysqlConnection, "tasks");
      const payload = source.map((row) => ({
        title: pickString(row.title) ?? `Task ${row.id}`,
        description: pickString(row.description),
        status: normalizeTaskStatus(row.status),
        priority: normalizePriority(row.priority),
        due_date: toDateOnly(row.due_date),
        assigned_to: pickString(row.assigned_to),
        created_at: toIso(row.created_at) ?? new Date().toISOString()
      }));
      if (payload.length > 0) {
        await insertBatches(supabase, "tasks", payload);
      }
      summary.push(`Tasks: ${payload.length}`);
    }

    if (await tableExists(mysqlConnection, "expenses")) {
      const source = await readTable(mysqlConnection, "expenses");
      const payload = source.map((row) => ({
        category: normalizeExpenseCategory(row.category),
        amount: toNumber(row.amount, 0),
        description: pickString(row.description),
        expense_date: toDateOnly(row.expense_date) ?? new Date().toISOString().slice(0, 10),
        payment_method: row.payment_method ? normalizePaymentMethod(row.payment_method) : null,
        receipt_number: pickString(row.receipt_number),
        vendor: pickString(row.vendor),
        created_by: pickString(row.created_by),
        created_at: toIso(row.created_at) ?? new Date().toISOString()
      }));
      if (payload.length > 0) {
        await insertBatches(supabase, "expenses", payload);
      }
      summary.push(`Expenses: ${payload.length}`);
    }

    if (await tableExists(mysqlConnection, "audit_logs")) {
      const source = await readTable(mysqlConnection, "audit_logs");
      const payload = source.map((row) => ({
        action: pickString(row.action) ?? "Unknown Action",
        table_name: pickString(row.table_name) ?? "unknown",
        related_id: pickString(row.related_id ?? row.record_id),
        record_label: pickString(row.record_label ?? row.record_name),
        old_value: pickString(row.old_value),
        new_value: pickString(row.new_value),
        actor_name: pickString(row.actor_name ?? row.user_name),
        created_at: toIso(row.created_at) ?? new Date().toISOString()
      }));
      if (payload.length > 0) {
        await insertBatches(supabase, "audit_logs", payload);
      }
      summary.push(`Audit logs: ${payload.length}`);
    }

    for (const tableName of ["email_templates", "user_templates"]) {
      if (!(await tableExists(mysqlConnection, tableName))) continue;
      const source = await readTable(mysqlConnection, tableName);
      const payload = source.map((row) => ({
        template_name: pickString(row.template_name ?? row.name) ?? `Template ${row.id}`,
        subject: pickString(row.subject ?? row.subject_line) ?? "No subject",
        body: pickString(row.body ?? row.email_body) ?? "",
        category: pickString(row.category)?.toLowerCase() ?? "general",
        created_at: toIso(row.created_at) ?? new Date().toISOString()
      }));
      if (payload.length > 0) {
        await insertBatches(supabase, "email_templates", payload);
      }
      summary.push(`${tableName} copied: ${payload.length}`);
    }

    console.log("\nMigration completed successfully.");
    for (const line of summary) {
      console.log(`- ${line}`);
    }
    console.log("\nThe app will use Supabase automatically once your .env.local Supabase keys are set.");
  } finally {
    await mysqlConnection.end();
  }
}

main().catch((error) => {
  console.error("\nMigration failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
