// scripts/fetch-square.mjs
// Robust Square catalog exporter → data/products.json for GitHub Pages
// Node 20+, ESM

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function collectOutputPaths() {
  const outputs = new Set();

  const envPaths = process.env.OUTPUT_PATHS || process.env.OUTPUT_PATH;
  if (envPaths) {
    for (const entry of String(envPaths).split(",")) {
      const trimmed = entry.trim();
      if (trimmed) outputs.add(trimmed);
    }
  }

  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--out" || token === "-o") {
      const value = argv[i + 1];
      if (!value) {
        console.error("Missing value for", token);
        process.exit(1);
      }
      outputs.add(value);
      i += 1;
    }
  }

  if (outputs.size === 0) {
    outputs.add("data/products.json");
  }

  return Array.from(outputs);
}

const OUTPUT_PATHS = collectOutputPaths();
const ENV = (process.env.SQUARE_ENVIRONMENT || "production").toLowerCase();
const ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const STRICT = /^true$/i.test(process.env.STRICT || "true");
const INCLUDE_OOS = /^true$/i.test(process.env.INCLUDE_OUT_OF_STOCK || "false");
const API_VERSION = process.env.SQUARE_API_VERSION || "2024-08-21";

const BASE_URL = ENV === "production"
  ? "https://connect.squareup.com"
  : "https://connect.squareupsandbox.com";

// Basic guardrails
if (!["production", "sandbox"].includes(ENV)) {
  console.error("Invalid SQUARE_ENVIRONMENT. Use 'production' or 'sandbox'.");
  process.exit(1);
}
if (!ACCESS_TOKEN || !LOCATION_ID) {
  console.error("Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID");
  process.exit(1);
}

function safe(v, fallback = null) {
  return v === undefined || v === null ? fallback : v;
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, value);
  }
  return query.toString();
}

async function squareRequest(path, { method = "GET", query, json } = {}) {
  const url = new URL(path, BASE_URL);
  if (query) {
    const qs = buildQuery(query);
    if (qs) {
      url.search = qs;
    }
  }

  const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    Accept: "application/json",
    "Square-Version": API_VERSION
  };

  let body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  const response = await fetch(url, { method, headers, body });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch (parseErr) {
    data = text;
  }

  if (!response.ok) {
    const message = data?.errors?.[0]?.detail || data?.message || `${response.status} ${response.statusText}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Fetch all catalog objects (ITEM, ITEM_VARIATION, IMAGE). Paged via cursor.
async function* listCatalog(types = ["ITEM", "ITEM_VARIATION", "IMAGE"]) {
  let cursor;
  do {
    const res = await squareRequest("/v2/catalog/list", {
      method: "GET",
      query: { cursor, types: types.join(",") }
    });
    if (res?.objects) yield* res.objects;
    cursor = res?.cursor;
  } while (cursor);
}

// Build index by id
async function fetchCatalogIndex() {
  const byId = new Map();
  for await (const obj of listCatalog()) {
    byId.set(obj.id, obj);
  }
  return byId;
}

// Optionally query inventory counts for LOCATION_ID
async function getInventoryCounts(variationIds) {
  const map = new Map();
  if (!variationIds.length) return map;

  try {
    for (let i = 0; i < variationIds.length; i += 50) {
      const ids = variationIds.slice(i, i + 50);
      const res = await squareRequest("/v2/inventory/batch-retrieve-counts", {
        method: "POST",
        json: {
          catalog_object_ids: ids,
          location_ids: [LOCATION_ID],
          states: ["IN_STOCK", "RESERVED", "SOLD", "WASTE", "UNACCOUNTED_FOR"]
        }
      });
      const counts = res?.counts ?? [];
      for (const c of counts) {
        const key = c.catalog_object_id;
        const qty = Number(c.quantity) || 0;
        const state = c.state;
        const prev = map.get(key) || 0;
        map.set(key, prev + (state === "IN_STOCK" ? qty : 0));
      }
    }
  } catch (err) {
    console.warn("Inventory lookup skipped due to error:", err?.message || err);
  }
  return map;
}

function readPrice(money) {
  if (!money) return null;
  const amount = Number(money.amount ?? money.amount_money?.amount);
  const currency = money.currency ?? money.amount_money?.currency ?? "USD";
  if (Number.isFinite(amount)) return { amount: amount / 100, currency };
  return null;
}

function firstImageUrl(item, imagesIndex) {
  const imgId = item?.itemData?.imageId || item?.imageId;
  if (imgId && imagesIndex.has(imgId)) {
    return imagesIndex.get(imgId)?.imageData?.url ?? null;
  }
  return null;
}

function presentAtLocation(obj) {
  const present = obj?.presentAtLocationIds ?? [];
  const absent = obj?.absentAtLocationIds ?? [];
  if (present.length && !present.includes(LOCATION_ID)) return false;
  if (absent.includes(LOCATION_ID)) return false;
  return true;
}

function asWebProduct(item, variations, imagesIndex, invMap) {
  const name = item?.itemData?.name?.trim();
  const desc = safe(item?.itemData?.descriptionHtml ?? item?.itemData?.description, "");
  const imageUrl = firstImageUrl(item, imagesIndex);
  const skus = [];
  let minPrice = null;
  for (const v of variations) {
    if (!presentAtLocation(v)) continue;
    const vd = v?.itemVariationData;
    if (!vd) continue;
    const price = readPrice(vd.priceMoney ?? vd.price_money);
    if (!price) continue;
    const sku = vd?.sku || v?.id;
    const varName = vd?.name || "";
    const variationId = v.id;
    const available = Number(invMap.get(variationId) || 0);
    if (!INCLUDE_OOS && available <= 0) {
      continue;
    }
    skus.push({ id: variationId, name: varName, sku, price, available });
    if (!minPrice || price.amount < minPrice.amount) minPrice = price;
  }
  if (!name || skus.length === 0) return null;
  return {
    id: item.id,
    name,
    description: desc,
    imageUrl,
    minPrice,
    skus
  };
}

async function main() {
  const preReqs = ["SQUARE_ENVIRONMENT", "SQUARE_ACCESS_TOKEN", "SQUARE_LOCATION_ID"];
  const missing = preReqs.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("❌ Missing env:", missing.join(", "));
    process.exit(1);
  }

  const idx = await fetchCatalogIndex();
  const items = [];
  const imagesIndex = new Map();
  for (const obj of idx.values()) {
    if (obj.type === "IMAGE") imagesIndex.set(obj.id, obj);
  }
  const allVariations = [];
  for (const obj of idx.values()) {
    if (obj.type === "ITEM_VARIATION") allVariations.push(obj);
  }

  const variationsByItem = new Map();
  for (const v of allVariations) {
    const itemId = v?.itemVariationData?.itemId;
    if (!itemId) continue;
    if (!variationsByItem.has(itemId)) variationsByItem.set(itemId, []);
    variationsByItem.get(itemId).push(v);
  }

  const variationIds = allVariations.map((v) => v.id);
  const invMap = await getInventoryCounts(variationIds);

  for (const obj of idx.values()) {
    if (obj.type !== "ITEM") continue;
    if (obj.isDeleted) continue;
    if (!presentAtLocation(obj)) continue;
    const vars = variationsByItem.get(obj.id) ?? [];
    const web = asWebProduct(obj, vars, imagesIndex, invMap);
    if (web) items.push(web);
  }

  items.sort((a, b) => a.name.localeCompare(b.name));

  const now = new Date().toISOString();
  const payload = {
    _meta: {
      source: "square",
      locationId: LOCATION_ID,
      environment: ENV,
      exportedAt: now,
      itemCount: items.length
    },
    items
  };

  if (STRICT && items.length === 0) {
    console.error("❌ Strict mode: 0 items after filtering; refusing to write output file(s).");
    process.exit(1);
  }

  for (const outputPath of OUTPUT_PATHS) {
    const outAbs = path.resolve(outputPath);
    await fs.mkdir(path.dirname(outAbs), { recursive: true });
    await fs.writeFile(outAbs, JSON.stringify(payload, null, 2), "utf8");
    console.log(`✅ Wrote ${items.length} item(s) to ${outputPath}`);
  }
}

main().catch((err) => {
  const msg = err?.data?.errors?.[0]?.detail || err?.message || String(err);
  console.error("❌ Fetch failed:", msg);
  if (err?.status === 401) {
    console.error("- 401 Unauthorized: Make sure the token matches the environment (Production vs Sandbox), and the app has 'Catalog Read' and 'Inventory Read' scopes. Recreate token if needed.");
  }
  process.exit(1);
});
