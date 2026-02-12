#!/bin/bash

set -e

echo "=========================================="
echo "🚀 Building and Deploying All Environments"
echo "=========================================="
echo ""

IMAGE_TAG="test-$(date +%s)"
REGISTRY="localhost:5001"

# Step 1: Build Docker images
echo "📦 Step 1: Building Docker images..."
echo "Image tag: ${IMAGE_TAG}"
echo ""

cd /Users/johnchristophermcarrillo/Projects/terraflow-app

# Build all backend services
for service in backend-landregistry api-gateway backend-documents backend-users backend-payments backend-blockchain; do
  echo "Building ${service}..."
  docker build -t ${REGISTRY}/terraflow/${service}:${IMAGE_TAG} ./${service}
  docker push ${REGISTRY}/terraflow/${service}:${IMAGE_TAG}
done

# Build frontend (universal image)
echo "Building frontend (universal)..."
docker build -t ${REGISTRY}/terraflow/frontend:${IMAGE_TAG} ./frontend
docker push ${REGISTRY}/terraflow/frontend:${IMAGE_TAG}

echo "✅ All images built and pushed"
echo ""

# Step 2: Deploy Local Dev (terraflow-app namespace)
echo "📦 Step 2: Deploying Local Dev (terraflow-app)..."
helm upgrade terraflow ./helm --install --timeout=10m \
  --namespace=terraflow-app --create-namespace \
  --set imageTag=${IMAGE_TAG}

echo "⏳ Waiting for Local Dev pods..."
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=180s --namespace=terraflow-app 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=180s --namespace=terraflow-app 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=frontend --timeout=180s --namespace=terraflow-app 2>/dev/null || true

# Setup port forwarding for Local Dev
echo "🔌 Setting up port forwarding for Local Dev..."
pkill -f "port-forward.*terraflow-app" 2>/dev/null || true
kubectl port-forward -n terraflow-app svc/api-gateway-service 30081:8081 > /dev/null 2>&1 &
sleep 3

echo "✅ Local Dev deployed"
echo "   Frontend: http://localhost:4005 (run 'npm run dev' in frontend folder)"
echo "   API Gateway: http://localhost:30081/api"
echo ""

# Step 3: Deploy QA
echo "📦 Step 3: Deploying QA (terraflow-qa)..."
helm upgrade terraflow-qa ./helm --install --timeout=10m \
  --namespace=terraflow-qa --create-namespace \
  --set imageTag=${IMAGE_TAG} \
  --values=./helm/values-qa.yaml

echo "⏳ Waiting for QA pods..."
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=180s --namespace=terraflow-qa 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=180s --namespace=terraflow-qa 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=frontend --timeout=180s --namespace=terraflow-qa 2>/dev/null || true

# Create QA databases
echo "🗄️  Creating QA databases..."
for db in users landregistry documents payments; do
  POD=$(kubectl get pod -n terraflow-qa -l app=postgres-$db -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
  if [ ! -z "$POD" ]; then
    kubectl exec -n terraflow-qa $POD -- psql -U postgres -c "CREATE DATABASE terraflow_${db}_qa;" 2>&1 | grep -v "already exists" || true
  fi
done

# Restart backend-landregistry
kubectl delete pod -n terraflow-qa -l app=backend-landregistry 2>/dev/null || true
sleep 10

echo "✅ QA deployed"
echo "   Frontend: http://localhost:30082"
echo "   API Gateway: http://localhost:30092/api"
echo ""

# Step 4: Deploy UAT
echo "📦 Step 4: Deploying UAT (terraflow-uat)..."
helm upgrade terraflow-uat ./helm --install --timeout=10m \
  --namespace=terraflow-uat --create-namespace \
  --set imageTag=${IMAGE_TAG} \
  --values=./helm/values-uat.yaml

echo "⏳ Waiting for UAT pods..."
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=180s --namespace=terraflow-uat 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=180s --namespace=terraflow-uat 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=frontend --timeout=180s --namespace=terraflow-uat 2>/dev/null || true

# Create UAT databases
echo "🗄️  Creating UAT databases..."
for db in users landregistry documents payments; do
  POD=$(kubectl get pod -n terraflow-uat -l app=postgres-$db -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
  if [ ! -z "$POD" ]; then
    kubectl exec -n terraflow-uat $POD -- psql -U postgres -c "CREATE DATABASE terraflow_${db}_uat;" 2>&1 | grep -v "already exists" || true
  fi
done

# Restart backend-landregistry
kubectl delete pod -n terraflow-uat -l app=backend-landregistry 2>/dev/null || true
sleep 10

echo "✅ UAT deployed"
echo "   Frontend: http://localhost:30083"
echo "   API Gateway: http://localhost:30093/api"
echo ""

# Step 5: Deploy PROD
echo "📦 Step 5: Deploying PROD (terraflow-prod)..."
helm upgrade terraflow-prod ./helm --install --timeout=10m \
  --namespace=terraflow-prod --create-namespace \
  --set imageTag=${IMAGE_TAG} \
  --values=./helm/values-prod.yaml

echo "⏳ Waiting for PROD pods..."
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=180s --namespace=terraflow-prod 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=180s --namespace=terraflow-prod 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=frontend --timeout=180s --namespace=terraflow-prod 2>/dev/null || true

# Create PROD databases
echo "🗄️  Creating PROD databases..."
for db in users landregistry documents payments; do
  POD=$(kubectl get pod -n terraflow-prod -l app=postgres-$db -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
  if [ ! -z "$POD" ]; then
    kubectl exec -n terraflow-prod $POD -- psql -U postgres -c "CREATE DATABASE terraflow_${db}_prod;" 2>&1 | grep -v "already exists" || true
  fi
done

# Restart backend-landregistry
kubectl delete pod -n terraflow-prod -l app=backend-landregistry 2>/dev/null || true
sleep 10

echo "✅ PROD deployed"
echo "   Frontend: http://localhost:30081"
echo "   API Gateway: http://localhost:30091/api"
echo ""

# Summary
echo "=========================================="
echo "✅ ALL ENVIRONMENTS DEPLOYED!"
echo "=========================================="
echo ""
echo "Image Tag: ${IMAGE_TAG}"
echo ""
echo "Environments:"
echo "  📍 Local Dev (terraflow-app):"
echo "     - Frontend: http://localhost:4005 (manual: cd frontend && npm run dev)"
echo "     - API: http://localhost:30081/api"
echo "     - Test: npm run automate:dev"
echo ""
echo "  📍 QA (terraflow-qa):"
echo "     - Frontend: http://localhost:30082"
echo "     - API: http://localhost:30092/api"
echo "     - Test: npm run automate:qa"
echo ""
echo "  📍 UAT (terraflow-uat):"
echo "     - Frontend: http://localhost:30083"
echo "     - API: http://localhost:30093/api"
echo "     - Test: npm run automate:uat"
echo ""
echo "  📍 PROD (terraflow-prod):"
echo "     - Frontend: http://localhost:30081"
echo "     - API: http://localhost:30091/api"
echo "     - Test: npm run automate:prod"
echo ""
echo "Pod Status:"
kubectl get pods -n terraflow-app | grep -E "NAME|frontend|api-gateway|backend-landregistry"
echo ""
kubectl get pods -n terraflow-qa | grep -E "NAME|frontend|api-gateway|backend-landregistry"
echo ""
kubectl get pods -n terraflow-uat | grep -E "NAME|frontend|api-gateway|backend-landregistry"
echo ""
kubectl get pods -n terraflow-prod | grep -E "NAME|frontend|api-gateway|backend-landregistry"
echo ""
