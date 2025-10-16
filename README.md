# Tees‑me Clean Square Sync

1) Add your secrets in GitHub → Settings → Secrets → Actions:
- SQUARE_ENVIRONMENT (production or sandbox)
- SQUARE_ACCESS_TOKEN (EAAA… for the matching environment)
- SQUARE_LOCATION_ID (your Square location id)

2) Run the Action "Square → products.json" or locally:
```bash
npm ci
export $(cat .env | xargs)  # after copying .env.example to .env
npm run preflight
npm run sync:square
```
This writes `data/products.json`. Commit & push.
