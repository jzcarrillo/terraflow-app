#!/bin/bash

# Test Pipeline Flow Locally
# Simulates: Dev → QA → UAT → PROD with cleanup between stages

set -e

# Get script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project root
cd "$PROJECT_ROOT"

IMAGE_TAG="test-$(date +%s)"
REGISTRY="localhost:5001"

echo "=========================================="
echo "🧪 Testing Pipeline Flow Locally"
echo "Image Tag: $IMAGE_TAG"
echo "=========================================="
echo ""

# Stage 1: Build & Test on Local Dev
echo "📦 STAGE 1: Build & Test (Local Dev)"
echo "=========================================="

echo "1️⃣  Deploying to Local Dev (terraflow-app)..."
helm upgrade terraflow ./helm --install --timeout=5m \
  --namespace=terraflow-app --create-namespace

echo "⏳ Waiting for pods..."
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=120s --namespace=terraflow-app || true
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=120s --namespace=terraflow-app || true

echo "✅ Local Dev deployed"
kubectl get pods -n terraflow-app
echo ""

read -p "Press Enter to cleanup Local Dev and continue to QA..."

echo "🗑️  Cleaning up Local Dev..."
helm uninstall terraflow -n terraflow-app || true
kubectl delete namespace terraflow-app --timeout=60s || true
echo "✅ Local Dev cleaned up"
echo ""

# Stage 2: Deploy to QA
echo "📦 STAGE 2: Deploy to QA"
echo "=========================================="

echo "🗑️  Cleaning up old QA environment..."
helm uninstall terraflow-qa -n terraflow-qa || true
kubectl delete namespace terraflow-qa --timeout=60s || true
sleep 3

echo "2️⃣  Deploying to QA (terraflow-qa)..."
helm upgrade terraflow-qa ./helm --install --timeout=5m \
  --namespace=terraflow-qa --create-namespace \
  --set image.tag=$IMAGE_TAG \
  --set image.repository=$REGISTRY/terraflow \
  --values=./helm/values-qa.yaml

echo "⏳ Waiting for pods..."
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=120s --namespace=terraflow-qa || true
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=120s --namespace=terraflow-qa || true

echo "✅ QA deployed"
kubectl get pods -n terraflow-qa
echo ""

read -p "Press Enter to cleanup QA and continue to UAT..."

echo "🗑️  Cleaning up QA..."
helm uninstall terraflow-qa -n terraflow-qa || true
kubectl delete namespace terraflow-qa --timeout=60s || true
echo "✅ QA cleaned up"
echo ""

# Stage 3: Deploy to UAT
echo "📦 STAGE 3: Deploy to UAT"
echo "=========================================="

echo "🗑️  Cleaning up old UAT environment..."
helm uninstall terraflow-uat -n terraflow-uat || true
kubectl delete namespace terraflow-uat --timeout=60s || true
sleep 3

echo "3️⃣  Deploying to UAT (terraflow-uat)..."
helm upgrade terraflow-uat ./helm --install --timeout=5m \
  --namespace=terraflow-uat --create-namespace \
  --set image.tag=$IMAGE_TAG \
  --set image.repository=$REGISTRY/terraflow \
  --values=./helm/values-uat.yaml

echo "⏳ Waiting for pods..."
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=120s --namespace=terraflow-uat || true
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=120s --namespace=terraflow-uat || true

echo "✅ UAT deployed"
kubectl get pods -n terraflow-uat
echo ""

read -p "Press Enter to cleanup UAT and continue to PROD..."

echo "🗑️  Cleaning up UAT..."
helm uninstall terraflow-uat -n terraflow-uat || true
kubectl delete namespace terraflow-uat --timeout=60s || true
echo "✅ UAT cleaned up"
echo ""

# Stage 4: Deploy to PROD
echo "📦 STAGE 4: Deploy to PROD"
echo "=========================================="

echo "🗑️  Cleaning up old PROD environment..."
helm uninstall terraflow-prod -n terraflow-prod || true
kubectl delete namespace terraflow-prod --timeout=60s || true
sleep 3

echo "4️⃣  Deploying to PROD (terraflow-prod)..."
helm upgrade terraflow-prod ./helm --install --timeout=5m \
  --namespace=terraflow-prod --create-namespace \
  --set image.tag=$IMAGE_TAG \
  --set image.repository=$REGISTRY/terraflow \
  --values=./helm/values-prod.yaml

echo "⏳ Waiting for pods..."
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=120s --namespace=terraflow-prod || true
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=120s --namespace=terraflow-prod || true

echo "✅ PROD deployed"
kubectl get pods -n terraflow-prod
echo ""

echo "=========================================="
echo "🎉 Pipeline Flow Test Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✅ Local Dev → Deployed & Cleaned"
echo "  ✅ QA → Deployed & Cleaned"
echo "  ✅ UAT → Deployed & Cleaned"
echo "  ✅ PROD → Deployed (Still Running)"
echo ""
echo "Current environment: PROD (terraflow-prod)"
echo "Frontend: http://localhost:30081"
echo ""

read -p "Press Enter to cleanup PROD and finish..."

echo "🗑️  Cleaning up PROD..."
helm uninstall terraflow-prod -n terraflow-prod || true
kubectl delete namespace terraflow-prod --timeout=60s || true
echo "✅ All environments cleaned up"
echo ""
echo "✅ Test complete!"
