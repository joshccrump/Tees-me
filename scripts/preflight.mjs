// scripts/preflight.mjs
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
const required = ["SQUARE_ENVIRONMENT","SQUARE_ACCESS_TOKEN","SQUARE_LOCATION_ID","OUTPUT_PATH"];
let ok = true;
for (const k of required) {
  if (!process.env[k] || String(process.env[k]).trim()==="") { console.error(`❌ Missing ${k}`); ok=false; }
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
