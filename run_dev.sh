#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "🌾 Starting Bhumi Drishti (ভূমি দৃষ্টি) Services"
echo "=========================================================="

# Detect Python binary (.venv, Windows Git Bash, or active environment)
if [ -f "$DIR/.venv/bin/python3" ]; then
    PY_BIN="$DIR/.venv/bin/python3"
elif [ -f "$DIR/.venv/Scripts/python.exe" ]; then
    PY_BIN="$DIR/.venv/Scripts/python.exe"
elif command -v python3 >/dev/null 2>&1; then
    PY_BIN="python3"
else
    PY_BIN="python"
fi

# 1. Start FastAPI Backend on port 8000
echo "--> Launching FastAPI Backend on http://localhost:8000..."
"$PY_BIN" -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# 2. Start TanStack Start Frontend on port 3000
echo "--> Launching TanStack Start Frontend on http://localhost:3000..."
(cd "$DIR/frontend" && npm run dev -- --host 0.0.0.0 --port 3000) &
FRONTEND_PID=$!

trap "kill -9 $BACKEND_PID $FRONTEND_PID 2>/dev/null || true" EXIT INT TERM

echo ""
echo "✅ Both services running:"
echo "   - Backend API: http://localhost:8000"
echo "   - Frontend UI: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services."
wait
