// scripts/preflight.mjs
import process from "node:process";

const required = ["SQUARE_ENVIRONMENT", "SQUARE_ACCESS_TOKEN", "SQUARE_LOCATION_ID"];
let ok = true;
for (const key of required) {
  if (!process.env[key] || String(process.env[key]).trim() === "") {
    console.error(`❌ Missing ${key}`);
    ok = false;
  }
}
const env = process.env.SQUARE_ENVIRONMENT;
if (env !== "production" && env !== "sandbox") {
  console.error(`❌ SQUARE_ENVIRONMENT must be 'production' or 'sandbox' (got '${env}')`);
  ok = false;
}
const token = process.env.SQUARE_ACCESS_TOKEN || "";
if (!/^EAAA/i.test(token)) {
  console.error("❌ ACCESS TOKEN does not look like a valid Square token (should start with 'EAAA')");
  ok = false;
}
if (!ok) {
  console.error("Preflight FAILED. Fix env vars and retry.");
  process.exit(1);
}
console.log("=== Square preflight ===");
console.log(`Env: ${env}`);
console.log(`Token: ${token.slice(0,6)}… (len=${token.length})`);
console.log(`Location ID: ${process.env.SQUARE_LOCATION_ID}`);
console.log("Preflight OK.");
