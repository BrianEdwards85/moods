#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Building web assets..."
(cd web && npm run css:build && npm run cljs:release)

echo "==> Starting backend (serving API + web app on :8000)..."
exec uv run uvicorn moods.app:app --host 0.0.0.0 --port 8000 --reload
