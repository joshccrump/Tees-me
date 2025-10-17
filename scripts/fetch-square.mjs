// scripts/fetch-square.mjs
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

function safe(v, f=null){ return (v===undefined||v===null)?f:v; }

async function* listCatalog(types=["ITEM","ITEM_VARIATION","IMAGE"]) {
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

async function fetchCatalogIndex(){
  const byId=new Map();
  for await (const obj of listCatalog()) byId.set(obj.id, obj);
  return byId;
}

async function getInventoryCounts(variationIds){
  const map = new Map();
  try{
    for (let i=0;i<variationIds.length;i+=50){
      const ids = variationIds.slice(i,i+50);
      const res = await client.inventoryApi.retrieveInventoryCount({
        catalogObjectIds: ids,
        locationIds: [LOCATION_ID],
        states: ["IN_STOCK","RESERVED","SOLD","WASTE","UNACCOUNTED_FOR"]
      });
      for (const c of (res?.result?.counts ?? [])){
        const qty = Number(c.quantity) || 0;
        if (c.state === "IN_STOCK"){
          map.set(c.catalogObjectId, (map.get(c.catalogObjectId)||0) + qty);
        }
      }
    }
  }catch(e){ console.warn("Inventory lookup skipped:", e?.message||e); }
  return map;
}

function readPrice(money){
  if (!money) return null;
  const amount = Number(money.amount ?? money.amount_money?.amount);
  const currency = money.currency ?? money.amount_money?.currency ?? "USD";
  if (Number.isFinite(amount)) return { amount: amount/100, currency };
  return null;
}

function firstImageUrl(item, imagesIndex) {
  const imgId = item?.itemData?.imageId || item?.imageId;
  if (imgId && imagesIndex.has(imgId)) {
    return imagesIndex.get(imgId)?.imageData?.url ?? null;
  }
  return null;
}

function presentAtLocation(obj){
  const present = obj?.presentAtLocationIds ?? [];
  const absent = obj?.absentAtLocationIds ?? [];
  if (present.length && !present.includes(LOCATION_ID)) return false;
  if (absent.includes(LOCATION_ID)) return false;
  return true;
}

function asWebProduct(item, variations, imagesIndex, invMap){
  const name = item?.itemData?.name?.trim();
  const desc = safe(item?.itemData?.descriptionHtml ?? item?.itemData?.description, "");
  const imageUrl = firstImageUrl(item, imagesIndex);
  const skus = [];
  let minPrice = null;
  for (const v of variations){
    if (!presentAtLocation(v)) continue;
    const vd = v?.itemVariationData;
    if (!vd) continue;
    const price = readPrice(vd.priceMoney ?? vd.price_money);
    if (!price) continue;
    const variationId = v.id;
    const available = Number((invMap.get(variationId)) || 0);
    if (!INCLUDE_OOS && available <= 0) continue;
    skus.push({ id: variationId, name: vd?.name || "", sku: vd?.sku || v?.id, price, available });
    if (!minPrice || price.amount < minPrice.amount) minPrice = price;
  }
  if (!name || skus.length===0) return null;
  return { id:item.id, name, description:desc, imageUrl, minPrice, skus };
}

async function main(){
  const idx = await fetchCatalogIndex();
  const imagesIndex = new Map();
  const allVariations = [];
  for (const obj of idx.values()){
    if (obj.type==="IMAGE") imagesIndex.set(obj.id, obj);
    if (obj.type==="ITEM_VARIATION") allVariations.push(obj);
  }
  const variationsByItem = new Map();
  for (const v of allVariations){
    const itemId = v?.itemVariationData?.itemId;
    if (!itemId) continue;
    if (!variationsByItem.has(itemId)) variationsByItem.set(itemId, []);
    variationsByItem.get(itemId).push(v);
  }
  const invMap = await getInventoryCounts(allVariations.map(v=>v.id));
  const items = [];
  for (const obj of idx.values()){
    if (obj.type!=="ITEM" || obj.isDeleted) continue;
    if (!presentAtLocation(obj)) continue;
    const vars = variationsByItem.get(obj.id) ?? [];
    const web = asWebProduct(obj, vars, imagesIndex, invMap);
    if (web) items.push(web);
  }
  items.sort((a,b)=>a.name.localeCompare(b.name));
  const payload = {
    _meta:{ source:"square", locationId:LOCATION_ID, environment:ENV, exportedAt:new Date().toISOString(), itemCount:items.length },
    items
  };

  if (STRICT && items.length === 0) {
    console.error("❌ Strict mode: 0 items after filtering; refusing to write output file(s).");
    process.exit(1);
  }

  // Ensure folder exists
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
