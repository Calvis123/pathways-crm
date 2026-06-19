import { readFileSync } from "node:fs";
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

async function main() {
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

  const schemaSql = readFileSync("supabase/schema.sql", "utf8");
  const seedSql = readFileSync("supabase/seed.sql", "utf8");

  await client.connect();
  try {
    console.log("Applying supabase/schema.sql...");
    await client.query(schemaSql);
    console.log("Applying supabase/seed.sql...");
    await client.query(seedSql);
    const tables = [
      "student_profiles",
      "partners",
      "partner_agreements",
      "programmes",
      "applications",
      "visa_records",
      "placements",
      "revenue_records",
      "qa_checkpoints",
      "market_configs",
      "consultant_training"
    ];
    const counts = {};
    for (const table of tables) {
      const result = await client.query(`select count(*)::int as count from public.${table}`);
      counts[table] = result.rows[0].count;
    }
    console.log(JSON.stringify({ verified: counts }, null, 2));
    console.log("Supabase schema and seed applied.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
