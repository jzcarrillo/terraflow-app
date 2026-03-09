#!/bin/bash

set -e

# Get script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project root
cd "$PROJECT_ROOT"

echo "=========================================="
echo "🚀 Pushing Dev Images to UAT Environment"
echo "=========================================="
echo ""

REGISTRY="localhost:5001"

# Step 1: Tag and push all dev images to registry
echo "📦 Step 1: Tagging and pushing dev images to registry..."
for service in backend-landregistry api-gateway backend-documents backend-users backend-payments backend-blockchain frontend; do
  echo "  Pushing ${service}..."
  docker tag terraflow/${service}:latest ${REGISTRY}/terraflow/${service}:latest
  docker push ${REGISTRY}/terraflow/${service}:latest
done
echo "✅ All dev images pushed to registry"
echo ""

# Step 2: Delete existing UAT namespace
echo "🗑️  Step 2: Deleting existing UAT namespace..."
kubectl delete namespace terraflow-uat --timeout=60s 2>/dev/null || true
sleep 5

# Step 3: Deploy to UAT with Helm
echo "📦 Step 3: Deploying to UAT with Helm..."
helm upgrade terraflow-uat ./helm --install -f ./helm/values-uat.yaml -n terraflow-uat --create-namespace

echo "⏳ Waiting for pods to be ready..."
sleep 20
kubectl wait --for=condition=ready pod -l app=postgres-users --timeout=180s --namespace=terraflow-uat 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=postgres-landregistry --timeout=180s --namespace=terraflow-uat 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=postgres-documents --timeout=180s --namespace=terraflow-uat 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=postgres-payments --timeout=180s --namespace=terraflow-uat 2>/dev/null || true

# Step 4: Create UAT databases
echo "🗄️  Step 4: Creating UAT databases..."
for db in users landregistry documents payments; do
  POD=$(kubectl get pod -n terraflow-uat -l app=postgres-$db -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
  if [ ! -z "$POD" ]; then
    echo "  Creating terraflow_${db}_uat database..."
    kubectl exec -n terraflow-uat $POD -- psql -U postgres -c "CREATE DATABASE terraflow_${db}_uat;" 2>&1 | grep -v "already exists" || true
  fi
done

echo ""
echo "✅ UAT Deployment Complete!"
echo ""
echo "🌐 UAT Frontend: http://localhost:30083"
echo "🌐 UAT API Gateway: http://localhost:30093/api"
echo ""
echo "To run E2E tests: npm run automate:uat"
echo ""
