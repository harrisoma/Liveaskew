#!/usr/bin/env bash
# E2E: build production app, serve via wrangler, assert /inquiry SSR.
# Reloads .env first to simulate post-Lovable-Cloud-reload conditions.
# On failure, copies response HTML and server log into $ARTIFACT_DIR for CI upload.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-8799}"
ARTIFACT_DIR="${ARTIFACT_DIR:-$ROOT/e2e-artifacts}"
mkdir -p "$ARTIFACT_DIR"

LOG="$ARTIFACT_DIR/wrangler.log"
RESP_HTML="$ARTIFACT_DIR/inquiry.html"
RUN_LOG="$ARTIFACT_DIR/e2e-run.log"

# Tee all script output to a run log
exec > >(tee -a "$RUN_LOG") 2>&1

trap 'kill $(jobs -p) 2>/dev/null || true' EXIT

# Reload .env
if [ -f .env ]; then
  set -a; . ./.env; set +a
  echo "[e2e] .env reloaded"
fi

echo "[e2e] artifact dir: $ARTIFACT_DIR"
echo "[e2e] building production bundle…"
bun run build >"$ARTIFACT_DIR/build.log" 2>&1

echo "[e2e] starting wrangler on :$PORT…"
bunx wrangler dev --config dist/server/wrangler.json --port "$PORT" --ip 127.0.0.1 --local >"$LOG" 2>&1 &
WPID=$!

# Wait for ready
for i in $(seq 1 60); do
  curl -sf "http://127.0.0.1:$PORT/" >/dev/null 2>&1 && break
  sleep 1
done

echo "[e2e] fetching /inquiry…"
RESP="$(curl -sS -o "$RESP_HTML" -w '%{http_code}' "http://127.0.0.1:$PORT/inquiry")"
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
  "Request a private" \
  "Personal Styling" \
  "Submit inquiry" \
  "Full name"; do
  grep -q "$needle" "$RESP_HTML" || fail "missing server HTML: $needle"
done

SIZE=$(wc -c <"$RESP_HTML")
[ "$SIZE" -gt 5000 ] || fail "response suspiciously small ($SIZE bytes)"

kill $WPID 2>/dev/null || true
echo "[e2e] PASS — /inquiry SSR HTTP 200, all assertions matched ($SIZE bytes)"
