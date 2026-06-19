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
  await client.query(`
    alter table public.portal_access add column if not exists password_hash text;
    alter table public.portal_access add column if not exists must_change_password boolean not null default true;
    alter table public.portal_access add column if not exists password_reset_token text;
    alter table public.portal_access add column if not exists password_reset_expires_at timestamptz;
  `);
  console.log("portal_access password columns verified");
} finally {
  await client.end();
}
