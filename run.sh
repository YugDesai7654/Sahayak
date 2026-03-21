#!/bin/bash

# Load NVM to ensure npm is available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Ensure we're in the project root
cd "$(dirname "$0")" || exit

echo "Stopping any existing processes on ports 8000 (backend) and 3000 (frontend)..."
kill -9 $(lsof -t -i:8000) 2>/dev/null || true
kill -9 $(lsof -t -i:3000) 2>/dev/null || true

echo "Starting Backend..."
cd backend || exit
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi
source .venv/bin/activate
# pip install -r requirements.txt
# Check if uvicorn is installed, if not, wait for install (it should be in requirements.txt)
uvicorn main:app --reload &
BACKEND_PID=$!
cd ..

echo "Starting Frontend..."
cd frontend || exit
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo "========================================="
echo "Both frontend and backend are starting up."
echo "Press Ctrl+C to stop both."
echo "========================================="

# Trap Ctrl+C (SIGINT) and kill both processes
trap "echo -e '\nStopping all processes...' && kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# Wait for background processes to keep the script running
wait
