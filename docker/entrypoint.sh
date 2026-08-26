#!/bin/sh
# Rebuild the schema, load the catalogue, then serve. Seeding on start keeps the
# demo database deterministic; there is no user-owned data to lose.
set -e

echo "[kernbau] seeding database"
npx tsx db/seed.ts

echo "[kernbau] starting server on port ${PORT:-3000}"
exec npx next start --port "${PORT:-3000}"
