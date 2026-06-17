import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnvFile(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = readEnvFile(".env.local");
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.log(JSON.stringify({ ok: false, message: "Missing Supabase URL or service role key." }, null, 2));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const { data, error } = await supabase.from("payments").select("id,created_by").limit(1);

if (error) {
  console.log(JSON.stringify({ ok: false, code: error.code, message: error.message }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, rows: data.length, hasCreatedBy: true }, null, 2));
