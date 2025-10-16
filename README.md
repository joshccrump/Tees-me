# Square → Jekyll (Gallery + Shop)

This bundle lets you sync your Square catalog into Jekyll’s `_data/square_products.json` and render both **/gallery** and **/shop** automatically.

## Quick start

1. **Copy files** into your repo (keep paths the same):
```
scripts/fetch-square.mjs
.github/workflows/square-sync.yml
_data/square_products.json
shop.html
gallery/index.html
```

2. **Install the Square SDK locally** (optional, for local testing):
```
npm i square
SQUARE_ACCESS_TOKEN=... SQUARE_LOCATION_ID=... SQUARE_ENVIRONMENT=production node scripts/fetch-square.mjs --out _data/square_products.json
```

3. **Add GitHub Action secrets** in your repo:
- `SQUARE_ACCESS_TOKEN`
- `SQUARE_LOCATION_ID`
- `SQUARE_ENVIRONMENT` = `production` (or `sandbox`)

4. **Run the workflow**: GitHub → Actions → “Sync Square → Jekyll data” → Run workflow.
   When it pushes `_data/square_products.json`, Pages will rebuild and your **Shop** and **Gallery** will populate.

## Notes
- The script maps each item’s first image and first fixed-price variation.
- If you want to hide out-of-stock items, extend the script to call the Inventory API and add `in_stock` to the JSON, then filter in Liquid.
- To wire a real checkout, store a Square Checkout link per variation as a custom attribute and include it in the JSON.
