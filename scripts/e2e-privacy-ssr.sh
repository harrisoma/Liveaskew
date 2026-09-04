#!/usr/bin/env bash
# E2E: build production app, serve via Nitro, assert /privacy SSR (Play Console URL).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-8799}"
ARTIFACT_DIR="${ARTIFACT_DIR:-$ROOT/e2e-artifacts}"
mkdir -p "$ARTIFACT_DIR"

LOG="$ARTIFACT_DIR/server.log"
RESP_HTML="$ARTIFACT_DIR/privacy.html"
RUN_LOG="$ARTIFACT_DIR/e2e-run.log"

exec > >(tee -a "$RUN_LOG") 2>&1

trap 'kill $(jobs -p) 2>/dev/null || true' EXIT

if [ -f .env ]; then
  set -a; . ./.env; set +a
  echo "[e2e] .env reloaded"
fi

echo "[e2e] artifact dir: $ARTIFACT_DIR"
echo "[e2e] building standalone Nitro SSR bundle…"
NITRO_PRESET=node_server bun run build >"$ARTIFACT_DIR/build.log" 2>&1

echo "[e2e] starting Nitro production preview on :$PORT…"
HOST=127.0.0.1 PORT="$PORT" node .output/server/index.mjs >"$LOG" 2>&1 &
WPID=$!

for i in $(seq 1 60); do
  curl -sf "http://127.0.0.1:$PORT/" >/dev/null 2>&1 && break
  sleep 1
done

echo "[e2e] fetching /privacy…"
RESP="$(curl -sS -o "$RESP_HTML" -w '%{http_code}' "http://127.0.0.1:$PORT/privacy")"
echo "[e2e] HTTP status: $RESP"

fail() {
  echo "[e2e] FAIL: $1"
  echo "--- server log (tail) ---"
  tail -50 "$LOG" || true
  echo "[e2e] artifacts preserved in $ARTIFACT_DIR"
  exit 1
}

[ "$RESP" = "200" ] || fail "expected HTTP 200, got $RESP"

for needle in \
  "Privacy policy" \
  "Bee stores fit answers" \
  "never used to alter body proportions" \
  "Play Console"; do
  grep -q "$needle" "$RESP_HTML" || fail "missing server HTML: $needle"
done

SIZE=$(wc -c <"$RESP_HTML")
[ "$SIZE" -gt 2000 ] || fail "response suspiciously small ($SIZE bytes)"

kill $WPID 2>/dev/null || true
echo "[e2e] PASS — /privacy SSR HTTP 200, all assertions matched ($SIZE bytes)"
