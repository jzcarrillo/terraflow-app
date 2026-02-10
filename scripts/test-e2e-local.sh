#!/bin/bash

echo "🧪 Testing E2E on Local Dev Environment"
echo ""

# Step 1: Deploy to local dev
echo "📦 [1/4] Deploying to local dev..."
helm upgrade terraflow ./helm --install --timeout=10m \
  --namespace=terraflow-app --create-namespace

# Wait for pods
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=120s --namespace=terraflow-app
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=120s --namespace=terraflow-app

# Step 2: Setup port forwarding
echo "🔌 [2/4] Setting up port forwarding..."
pkill -f "kubectl port-forward.*terraflow-app.*api-gateway" 2>/dev/null
kubectl port-forward -n terraflow-app svc/terraflow-api-gateway-service 30081:8081 &
sleep 3

# Step 3: Start frontend
echo "🌐 [3/4] Starting frontend on localhost:4005..."
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend
echo "⏳ Waiting for frontend to start..."
sleep 10

# Step 4: Run E2E tests
echo "🎭 [4/4] Running Playwright E2E tests..."
cd playwright
npm install --silent
npm run automate

echo ""
echo "✅ E2E Testing Complete!"
echo "🌐 Frontend: http://localhost:4005"
echo "🌐 API Gateway: http://localhost:30081"
