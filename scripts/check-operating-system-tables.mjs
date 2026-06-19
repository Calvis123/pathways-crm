import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnvFile(path) {
  const env = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    env[line.slice(0, eqIndex).trim()] = line.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = readEnvFile(".env.local");
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const tables = ["partners", "market_configs", "consultant_training", "qa_checkpoints", "programmes", "revenue_records"];
const result = {};

for (const table of tables) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) {
    console.log(JSON.stringify({ ok: false, table, message: error.message }, null, 2));
    process.exit(1);
  }
  result[table] = count;
}

console.log(JSON.stringify({ ok: true, tables: result }, null, 2));
