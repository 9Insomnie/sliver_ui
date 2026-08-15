#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
GO_TMP="$ROOT/.gotmp"
mkdir -p "$GO_TMP"

export GOTMPDIR="$GO_TMP"
export GOTOOLCHAIN=auto
if [ "${GOSUMDB:-}" = "off" ]; then
  export GOSUMDB=sum.golang.org
fi

cd "$ROOT/backend"
go run . --addr 127.0.0.1:8080 &
BACKEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd "$ROOT/frontend"
npm run dev -- --host 127.0.0.1 --port 5173