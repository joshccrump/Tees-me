# Tees‑me Clean Square Sync

Drop these files into your repo (or start a new one) to fetch your Square Catalog into `data/products.json`, then render it on simple gallery/shop pages.

## 1) Local quick start
```bash
npm ci
# copy .env.example to .env and fill values
export $(cat .env | xargs)   # or use a shell that loads .env
npm run preflight
npm run sync:square
npx http-server -c-1 .
# open http://localhost:8080/src/gallery.html
```

**Required env vars**
- `SQUARE_ENVIRONMENT`: `production` or `sandbox`
- `SQUARE_ACCESS_TOKEN`: token beginning `EAAA…` created in the matching environment
- `SQUARE_LOCATION_ID`: your location ID (must match the items' presentAtLocationIds)
- `OUTPUT_PATH`: where to write the JSON (default `data/products.json`)

If you kept seeing exactly *47 empty items* before, it was likely due to writing out all items regardless of missing prices/variations or mismatched location filters. This exporter only writes items that have at least one valid variation with a price, and it respects location presence. Result: no more "empty" products.

## 2) GitHub Actions (automatic)
- Add **Repository secrets**:
  - `SQUARE_ENVIRONMENT`
  - `SQUARE_ACCESS_TOKEN`
  - `SQUARE_LOCATION_ID`
- Push this repo with the workflow in `.github/workflows/square-sync.yml`.
- Run it manually (Actions → "Square → products.json" → Run) or let it run on the daily schedule.

## 3) Hook up your existing Pages
- Commit `data/products.json` to your Pages branch (usually `main`).
- Link to `src/gallery.html` and/or `src/shop.html` (or merge their JS into your theme).
- The JS fetches `../data/products.json` (adjust path if you move files).

## 4) Troubleshooting
- **401 Unauthorized**: Token wrong environment or missing scopes (needs Catalog Read, Inventory Read).
- **0 items written (strict mode refused)**: Your filters removed everything. Temporarily set `STRICT=false` to inspect output.
- **Missing images**: Some items may not have imageId set; add images in Square Dashboard.
- **Location filtering**: Items must be present at `SQUARE_LOCATION_ID` (not absent). Update item availability in Square if needed.

## 5) Customize
- Set `INCLUDE_OUT_OF_STOCK=true` to show OOS items (they’ll include `available: 0`).
- Expand the HTML templates to include add‑to‑cart links to your Square Online item URLs if desired.
