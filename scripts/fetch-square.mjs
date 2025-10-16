// scripts/fetch-square.mjs
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import squareMod from "square";

const mod = squareMod?.default ?? squareMod;
const Client =
  mod?.Client ?? mod?.SquareClient ?? squareMod?.Client ?? squareMod?.SquareClient;
const Environment =
  mod?.Environment ?? mod?.SquareEnvironment ?? squareMod?.Environment ?? squareMod?.SquareEnvironment;

if (!Client || !Environment) {
  console.error("Square SDK exports not found. Run: npm i square");
  process.exit(1);
}

const ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const LOCATION_ID  = process.env.SQUARE_LOCATION_ID;
const RAW_ENV      = (process.env.SQUARE_ENVIRONMENT || "production").toLowerCase();
const OUT_PATH     = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : "_data/square_products.json";

if (!ACCESS_TOKEN) throw new Error("Missing SQUARE_ACCESS_TOKEN");
if (!LOCATION_ID)  throw new Error("Missing SQUARE_LOCATION_ID");

const env = RAW_ENV === "sandbox" ? Environment.Sandbox : Environment.Production;
const client = new Client({ environment: env, accessToken: ACCESS_TOKEN });

async function* listCatalog(typesCsv) {
  let cursor = undefined;
  do {
    const res = await client.catalogApi.listCatalog(cursor, typesCsv);
    if (res.result?.objects) yield res.result.objects;
    cursor = res.result?.cursor;
  } while (cursor);
}

function moneyToCents(m) {
  if (!m || typeof m.amount !== "bigint") return null;
  return Number(m.amount);
}

(async () => {
  const types = ["ITEM", "ITEM_VARIATION", "IMAGE"].join(",");
  const items = new Map();
  const vars  = new Map();
  const imgs  = new Map();

  for await (const batch of listCatalog(types)) {
    for (const obj of batch) {
      if (obj.type === "ITEM" && obj.itemData) items.set(obj.id, obj);
      if (obj.type === "ITEM_VARIATION" && obj.itemVariationData) vars.set(obj.id, obj);
      if (obj.type === "IMAGE" && obj.imageData) imgs.set(obj.id, obj);
    }
  }

  const out = [];
  for (const [itemId, item] of items) {
    const data = item.itemData;
    const imageId = data?.imageIds?.[0];
    const imageUrl = imageId && imgs.get(imageId)?.imageData?.url || null;

    const variationIds = data?.variations?.map(v => v.id) || [];
    const firstVar = variationIds
      .map(id => vars.get(id))
      .find(v => v?.itemVariationData?.pricingType === "FIXED_PRICING");

    const priceCents = firstVar ? moneyToCents(firstVar.itemVariationData?.priceMoney) : null;

    out.push({
      id: itemId,
      name: data?.name || "Untitled",
      description: data?.description || "",
      category: data?.categoryId || null,
      image_url: imageUrl,
      variation_id: firstVar?.id || null,
      price_cents: priceCents,
      visible: data?.presentAtAllLocations ?? true
    });
  }

  const outAbs = path.resolve(OUT_PATH);
  await fs.mkdir(path.dirname(outAbs), { recursive: true });
  await fs.writeFile(outAbs, JSON.stringify(out, null, 2));
  console.log(`Wrote ${out.length} products to ${OUT_PATH}`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
