# Actions Fix Pack

This pack gives you two manual-run workflows so the **Run workflow** button appears, plus a local fallback if Actions are restricted.

## Files to add (keep paths the same)
- `.github/workflows/square-sync.yml` (primary)
- `.github/workflows/manual-square-sync.yml` (fallback)
- `scripts/fetch-square.mjs`
- `package.json`
- `.nvmrc`
- `tools/run-square-sync.sh` (local helper)

## If you still don't see the *Run workflow* button
1) Ensure you’re viewing the **default branch** (e.g., `main`) where these files are committed.
2) Go to **Settings → Actions → General** and set **Actions permissions** to “Allow all actions and reusable workflows.”
3) If it’s a fork, you may need to enable Actions on the fork.
4) Organization policies can disable Actions; you’ll need to allow it or run locally.

## Local fallback (no Actions needed)
```bash
npm i
export SQUARE_ACCESS_TOKEN=...    # from Square dashboard
export SQUARE_LOCATION_ID=...
export SQUARE_ENVIRONMENT=production
npm run sync:square
# or
./tools/run-square-sync.sh
```

This will write both `data/products.json` and `_data/square_products.json`. Commit and push to trigger Pages to rebuild.
