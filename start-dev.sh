#!/bin/bash
# MedStats UI Development Server Startup Script

set -e

echo "🚀 Starting MedStats UI Development Server..."

# Navigate to UI directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Kill any existing process on port 3000
echo "🔍 Checking for existing process on port 3000..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is in use. Killing existing process..."
    kill -9 $(lsof -ti:3000) || true
    sleep 2
fi

# Start the dev server
echo "✨ Starting Vite dev server on http://localhost:3000"
npm run dev
