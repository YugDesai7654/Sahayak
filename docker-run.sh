#!/usr/bin/env bash
set -e

# Change to script directory (project root)
cd "$(dirname "$0")"

echo "========================================================"
echo " Starting Sahayak Platform via Docker Compose"
echo "========================================================"

if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH."
    exit 1
fi

echo "Stopping any running containers first..."
docker compose down --remove-orphans 2>/dev/null || true

# Ensure project ports (3000, 8000, 27017) are completely free
for port in 3000 8000 27017; do
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "Freeing port $port (terminating PID: $pids)..."
        kill -9 $pids 2>/dev/null || true
    fi
done

echo "Building and starting containers..."
docker compose up --build "$@"
