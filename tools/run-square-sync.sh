#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SQUARE_ACCESS_TOKEN:-}" || -z "${SQUARE_LOCATION_ID:-}" ]]; then
  echo "Please export SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID (and optionally SQUARE_ENVIRONMENT=production|sandbox)"
  exit 1
fi

export SQUARE_ENVIRONMENT="${SQUARE_ENVIRONMENT:-production}"
node scripts/fetch-square.mjs --out data/products.json --out _data/square_products.json
echo "Wrote data/products.json and _data/square_products.json"
