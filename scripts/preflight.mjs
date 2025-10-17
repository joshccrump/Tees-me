// scripts/preflight.mjs
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function loadEnvFile(filename = ".env") {
  const envPath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(envPath)) {
    return false;
  }

  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
  return true;
}

const loaded = loadEnvFile();
if (loaded) {
  console.log("Loaded environment variables from .env");
}

const required = ["SQUARE_ENVIRONMENT", "SQUARE_ACCESS_TOKEN", "SQUARE_LOCATION_ID"];
let ok = true;
for (const k of required) {
  if (!process.env[k] || String(process.env[k]).trim() === "") {
    console.error(`❌ Missing ${k}`);
    ok = false;
  }
}
const env = process.env.SQUARE_ENVIRONMENT;
if (!["production","sandbox"].includes(env)) { console.error(`❌ SQUARE_ENVIRONMENT must be 'production' or 'sandbox' (got '${env}')`); ok=false; }
const token = process.env.SQUARE_ACCESS_TOKEN || "";
if (!/^EAAA/i.test(token)) { console.error("❌ ACCESS TOKEN should start with 'EAAA'"); ok=false; }
if (!ok) { console.error("Preflight FAILED."); process.exit(1); }
console.log("=== Square preflight ===");
console.log(`Env: ${env}`);
console.log(`Token: ${token.slice(0,6)}… (len=${token.length})`);
console.log(`Location ID: ${process.env.SQUARE_LOCATION_ID}`);
const outputEnv = process.env.OUTPUT_PATHS || process.env.OUTPUT_PATH;
if (!outputEnv) {
  console.log("OUTPUT_PATHS: (default outputs)");
} else {
  console.log(`OUTPUT_PATHS: ${outputEnv}`);
}
const optional = {
  SQUARE_API_VERSION: process.env.SQUARE_API_VERSION || "(default: 2024-08-21)",
  STRICT: process.env.STRICT ?? "true",
  INCLUDE_OUT_OF_STOCK: process.env.INCLUDE_OUT_OF_STOCK ?? "false"
};
for (const [key, value] of Object.entries(optional)) {
  console.log(`${key}: ${value}`);
}
console.log("Preflight OK.");
