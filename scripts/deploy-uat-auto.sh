#!/bin/bash

# Deploy directly to UAT (skip Dev and QA)
# Uses latest images from registry

set -e

# Get script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project root
cd "$PROJECT_ROOT"

IMAGE_TAG="latest"
REGISTRY="localhost:5001"

echo "=========================================="
echo "🚀 Deploying to UAT Environment"
echo "Image Tag: $IMAGE_TAG"
echo "=========================================="
echo ""

# Deploy to UAT
echo "📦 Deploying to UAT (terraflow-uat)..."
echo "==========================================="

echo "🗑️  Cleaning up old UAT environment..."
helm uninstall terraflow-uat -n terraflow-uat 2>/dev/null || true
kubectl delete namespace terraflow-uat --timeout=60s 2>/dev/null || true
sleep 5

echo "3️⃣  Deploying to UAT..."
helm upgrade terraflow-uat ./helm --install --timeout=10m \
  --namespace=terraflow-uat --create-namespace \
  --set imageTag=$IMAGE_TAG \
  --values=./helm/values-uat.yaml

echo "⏳ Waiting for pods..."
sleep 20
kubectl wait --for=condition=ready pod -l app=backend-users --timeout=180s --namespace=terraflow-uat 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=backend-payments --timeout=180s --namespace=terraflow-uat 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=backend-documents --timeout=180s --namespace=terraflow-uat 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=180s --namespace=terraflow-uat 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=frontend --timeout=180s --namespace=terraflow-uat 2>/dev/null || true

echo ""
echo "📊 Current pod status:"
kubectl get pods -n terraflow-uat
echo ""

# Create databases
echo "🗄️  Creating UAT databases..."
for db in users landregistry documents payments; do
  POD=$(kubectl get pod -n terraflow-uat -l app=postgres-$db -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
  if [ ! -z "$POD" ]; then
    echo "Creating terraflow_${db}_uat database..."
    kubectl exec -n terraflow-uat $POD -- psql -U postgres -c "CREATE DATABASE terraflow_${db}_uat;" 2>&1 | grep -v "already exists" || true
  fi
done

# Restart backend-landregistry
echo ""
echo "🔄 Restarting backend-landregistry..."
kubectl delete pod -n terraflow-uat -l app=backend-landregistry 2>/dev/null || true
sleep 15

echo ""
echo "📊 Final pod status:"
kubectl get pods -n terraflow-uat
echo ""

echo "=========================================="
echo "✅ UAT Deployment Complete!"
echo "=========================================="
echo ""
echo "🌐 UAT Frontend: http://localhost:30083"
echo "🌐 UAT API Gateway: http://localhost:30093/api"
echo ""
echo "To run E2E tests: npm run automate:uat"
echo ""
