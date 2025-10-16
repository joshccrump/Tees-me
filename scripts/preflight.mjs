// scripts/preflight.mjs
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function loadEnvFile(filePath) {
  try {
    const text = fs.readFileSync(filePath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1);
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      value = value.replace(/\\n/g, "\n");
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
    console.log(`Loaded env from ${path.basename(filePath)}`);
  } catch (err) {
    if (err?.code !== "ENOENT") {
      console.warn(`Warning: Could not load ${filePath}:`, err.message || err);
    }
  }
}

const cwdEnv = path.resolve(process.cwd(), ".env");
loadEnvFile(cwdEnv);

let ok = true;

if (!process.env.SQUARE_ACCESS_TOKEN || String(process.env.SQUARE_ACCESS_TOKEN).trim() === "") {
  console.error("❌ Missing SQUARE_ACCESS_TOKEN");
  ok = false;
}

if (!process.env.SQUARE_LOCATION_ID || String(process.env.SQUARE_LOCATION_ID).trim() === "") {
  console.error("❌ Missing SQUARE_LOCATION_ID");
  ok = false;
}

let env = process.env.SQUARE_ENVIRONMENT;
if (!env || String(env).trim() === "") {
  env = "production";
  console.warn("ℹ️  SQUARE_ENVIRONMENT not set; defaulting to 'production'.");
}
env = String(env).trim();
if (env !== "production" && env !== "sandbox") {
  console.error(`❌ SQUARE_ENVIRONMENT must be 'production' or 'sandbox' (got '${env}')`);
  ok = false;
}
process.env.SQUARE_ENVIRONMENT = env;

const token = process.env.SQUARE_ACCESS_TOKEN || "";
if (!/^EAAA/i.test(token)) {
  console.warn("ℹ️  ACCESS TOKEN does not look like the expected Square format (should start with 'EAAA').");
}

if (!ok) {
  console.error("Preflight FAILED. Fix env vars and retry.");
  process.exit(1);
}
console.log("=== Square preflight ===");
console.log(`Env: ${env}`);
console.log(`Token: ${token.slice(0,6)}… (len=${token.length})`);
console.log(`Location ID: ${process.env.SQUARE_LOCATION_ID}`);
const optional = {
  SQUARE_API_VERSION: process.env.SQUARE_API_VERSION || "(default: 2024-08-21)",
  STRICT: process.env.STRICT ?? "true",
  INCLUDE_OUT_OF_STOCK: process.env.INCLUDE_OUT_OF_STOCK ?? "false",
  OUTPUT_PATHS: process.env.OUTPUT_PATHS || process.env.OUTPUT_PATH || "(default outputs)"
};
for (const [key, value] of Object.entries(optional)) {
  console.log(`${key}: ${value}`);
}
console.log("Preflight OK.");
