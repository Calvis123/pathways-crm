import { existsSync, readFileSync, writeFileSync } from "node:fs";
import pg from "pg";

function readEnvFile(path) {
  const env = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    env[key] = value;
  }
  return env;
}

function requireEnv(env, key) {
  const value = env[key];
  if (!value) throw new Error(`Missing ${key} in .env.local`);
  return value;
}

const ids = {
  students: [
    "9e9956df-fc55-4ee8-a47a-c5ff58d29a01",
    "495fc1e4-b0ff-42be-9568-a275ca4010a8",
    "2b9178cc-ae7b-4945-af51-c2bbde4c63db"
  ],
  consultations: [
    "ca403647-ac01-4f11-aac4-0d6e9f9fdcb7",
    "bd676c1d-b0ce-4d3c-817f-fd91554e5478"
  ],
  student_documents: [
    "535fe534-45d2-4a90-b6ef-a85242da62eb",
    "f73de48c-c09d-49b1-bf1c-5e4c175c1d07"
  ],
  student_profiles: [
    "f8a3e0a4-2282-4d70-9d61-538c89317e21",
    "4edca12f-3e27-45f4-bb7e-43f99344b90a"
  ],
  partners: [
    "b3d4f0df-82bb-4f3d-adb3-9f71631cd901",
    "44d22a34-dfa5-4af6-a062-538f6474a551",
    "db431df7-2c9d-48e7-91bb-08a3f3bdbe57"
  ],
  partner_agreements: [
    "b24767eb-26a8-4c20-9321-f3bc036c29b0",
    "19f2835d-b8b6-4dc0-b4cf-06121581e925"
  ],
  programmes: [
    "273d6a5a-f355-4cb7-aa52-81ff275d7932",
    "37037d42-a932-4d8c-a6ee-7f164187a5da"
  ],
  applications: [
    "ee4e4897-fdc7-4647-bb34-37eb29bb533a",
    "b93a02a8-351a-4030-9c32-f85949683426"
  ],
  market_configs: [
    "52ce5d4f-6571-4b24-a1a2-1d18a13082be",
    "d00d75f4-6337-4d44-9d81-2ef05a8e9d1e"
  ],
  visa_records: ["8ef8cfbb-8dcb-4331-b431-c7fcb97d2fa2"],
  placements: ["1e8c88b0-e590-4dab-b9dc-a6b5dd1f9ec7"],
  revenue_records: [
    "e0f7909d-09f0-4c9e-8830-1d5665ed1a7d",
    "e552b704-a4e8-4e76-9567-173b68b52bed",
    "6a7eb49b-9e50-46c6-bb6d-f38687e370a7"
  ],
  qa_checkpoints: [
    "09fce5cf-0ca4-4fea-954d-b5a60876a10b",
    "4e595a1b-7921-42fb-b538-94fd189b772f"
  ],
  consultant_training: [
    "a15afd35-a31a-4325-9653-d1d77c37d71c",
    "31d88955-b7ec-404d-9d32-aa08a787cdbb",
    "d931e14c-9af3-4ddb-84d2-15f2fd72c611",
    "e8e7e54f-4cf9-4e98-aa2a-a85ae5a826aa",
    "fa529a75-202d-4a13-8895-4b9182485a21",
    "2d3fbfb4-0d03-4ee8-af89-e8442fbcb793",
    "60e212fa-18ce-4fb4-9d0e-3e50aa3bb14f"
  ],
  commissions: ["3d1c0856-6964-4024-9ee5-c2bb814840c4"],
  tasks: [
    "1b76a306-b7cb-4897-9185-0e1db860aa31",
    "a566197d-b8ea-456e-a94a-991d736bb325"
  ],
  email_templates: [
    "6586d570-d70d-4062-b5e0-ee57f97ff2a5",
    "44c3355d-2a9d-4b4c-a273-4d66d3f07a49"
  ],
  audit_logs: [
    "3ab2ee94-fa89-457c-8856-7128ee7c28c2",
    "c3ca1278-8825-4d59-a104-42d01b5ec431"
  ]
};

const deleteOrder = [
  "audit_logs",
  "tasks",
  "email_templates",
  "qa_checkpoints",
  "revenue_records",
  "placements",
  "visa_records",
  "applications",
  "commissions",
  "student_profiles",
  "student_documents",
  "consultations",
  "partner_agreements",
  "programmes",
  "market_configs",
  "partners",
  "consultant_training",
  "students"
];

async function clearSupabase() {
  const env = readEnvFile(".env.local");
  const supabaseProjectRef = env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const looksLikeLocalMysql = env.DB_HOST === "127.0.0.1" || env.DB_HOST === "localhost" || env.DB_PORT === "3306";
  const inferredSupabase = looksLikeLocalMysql && supabaseProjectRef;

  const client = new pg.Client({
    host: inferredSupabase ? `db.${supabaseProjectRef}.supabase.co` : requireEnv(env, "DB_HOST"),
    port: inferredSupabase ? 5432 : Number(env.DB_PORT || 5432),
    database: inferredSupabase ? "postgres" : requireEnv(env, "DB_NAME"),
    user: inferredSupabase ? "postgres" : requireEnv(env, "DB_USER"),
    password: requireEnv(env, "DB_PASS"),
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    await client.query("begin");
    const deleted = {};
    for (const table of deleteOrder) {
      const tableIds = ids[table];
      if (!tableIds?.length) continue;
      const result = await client.query(`delete from public.${table} where id = any($1::uuid[])`, [tableIds]);
      deleted[table] = result.rowCount;
    }
    await client.query("commit");
    console.log(JSON.stringify({ supabaseDeleted: deleted }, null, 2));
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

function clearLocalDb() {
  const path = "data/local-db.json";
  if (!existsSync(path)) return;
  const db = JSON.parse(readFileSync(path, "utf8"));
  const mapping = {
    students: "students",
    consultations: "consultations",
    documents: "student_documents",
    student_profiles: "student_profiles",
    partners: "partners",
    partner_agreements: "partner_agreements",
    programmes: "programmes",
    applications: "applications",
    market_configs: "market_configs",
    visa_records: "visa_records",
    placements: "placements",
    revenue_records: "revenue_records",
    qa_checkpoints: "qa_checkpoints",
    consultant_training: "consultant_training",
    commissions: "commissions",
    tasks: "tasks",
    templates: "email_templates",
    audit_logs: "audit_logs"
  };
  const deleted = {};

  for (const [localKey, seedKey] of Object.entries(mapping)) {
    if (!Array.isArray(db[localKey])) continue;
    const seedIds = new Set(ids[seedKey] ?? []);
    const before = db[localKey].length;
    db[localKey] = db[localKey].filter((item) => !seedIds.has(item.id));
    deleted[localKey] = before - db[localKey].length;
  }

  writeFileSync(path, JSON.stringify(db, null, 2), "utf8");
  console.log(JSON.stringify({ localDeleted: deleted }, null, 2));
}

await clearSupabase();
clearLocalDb();
console.log("Seeded data cleared.");
