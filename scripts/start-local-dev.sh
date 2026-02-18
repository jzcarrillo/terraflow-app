#!/bin/bash

echo "🚀 Starting Local Dev Environment..."
echo ""

# Kill existing frontend
echo "🛑 Stopping existing frontend..."
lsof -ti:4005 | xargs kill -9 2>/dev/null
sleep 2

# Start frontend with local dev API
echo "🌐 Starting frontend on localhost:4005..."
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:30081/api NEXT_PUBLIC_DASHBOARD_URL=http://localhost:4005/ npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Local Dev Environment Ready!"
echo ""
echo "📍 Frontend: http://localhost:4005"
echo "📍 API Gateway: http://localhost:30081/api"
echo "📍 Database: terraflow_users (local dev)"
echo ""
echo "Press Ctrl+C to stop"

# Keep script running
wait $FRONTEND_PID
