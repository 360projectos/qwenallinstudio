#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d node_modules ] || npm install --no-audit --no-fund
echo "GATE 1/4 - tsc --noEmit"; npx tsc --noEmit
echo "GATE 2/4 - vite build"; npx vite build
echo "GATE 3/4 - pruebas matematicas"; npm test
echo "GATE 4/4 - HTTP 200/401"
NODE_ENV=production PORT=8090 LAB_DEV_SECRET=devsecret node server.ts & SRV=$!
sleep 3
fail=0
for p in / /admin /api/health; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8090$p")
  echo "  GET $p -> $code"; [ "$code" = "200" ] || fail=1
done
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:8090/api/gemini/roadmap")
echo "  POST roadmap sin token -> $code (esperado 401)"; [ "$code" = "401" ] || fail=1
kill $SRV 2>/dev/null || true
[ "$fail" = "0" ] && echo "OK 4 GATES VERDES" || { echo "GATE FALLIDO"; exit 1; }