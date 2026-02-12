#!/bin/bash

set -e

echo "=========================================="
echo "🧪 Local Dev E2E Test"
echo "=========================================="
echo ""

cd /Users/johnchristophermcarrillo/Projects/terraflow-app

# Step 1: Kill existing frontend
echo "🛑 Stopping existing frontend..."
lsof -ti:4005 | xargs kill -9 2>/dev/null || true
sleep 2

# Step 2: Start frontend
echo "🌐 Starting frontend on localhost:4005..."
cd frontend

# Create .env.local for local dev
cat > .env.local << EOF
API_URL=http://localhost:30081/api
DASHBOARD_URL=http://localhost:4005/
NODE_ENV=development
EOF

npm run dev > /tmp/frontend-dev.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 15

# Check if frontend is running
if curl -s http://localhost:4005 > /dev/null; then
  echo "✅ Frontend is ready"
else
  echo "❌ Frontend failed to start"
  cat /tmp/frontend-dev.log
  exit 1
fi

cd ..

# Step 3: Run E2E test
echo ""
echo "🎭 Running E2E test..."
npm run automate:dev

# Step 4: Cleanup
echo ""
echo "🧹 Cleaning up..."
kill $FRONTEND_PID 2>/dev/null || true

echo ""
echo "✅ Test complete!"
