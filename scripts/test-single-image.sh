#!/bin/bash

# Test: Single Image Across Multiple Environments
# Verify that one Docker image works with different runtime configs

set -e

IMAGE_TAG="universal"
REGISTRY="localhost:5001"

echo "=========================================="
echo "🧪 Testing Single Image Across Environments"
echo "Image: ${REGISTRY}/terraflow/frontend:${IMAGE_TAG}"
echo "=========================================="
echo ""

# Step 1: Verify image exists
echo "📦 Step 1: Verifying image exists..."
if docker images ${REGISTRY}/terraflow/frontend:${IMAGE_TAG} | grep -q ${IMAGE_TAG}; then
  echo "✅ Image found: ${REGISTRY}/terraflow/frontend:${IMAGE_TAG}"
  IMAGE_ID=$(docker images ${REGISTRY}/terraflow/frontend:${IMAGE_TAG} --format "{{.ID}}")
  echo "   Image ID: ${IMAGE_ID}"
else
  echo "❌ Image not found!"
  exit 1
fi
echo ""

# Step 2: Deploy to QA
echo "📦 Step 2: Deploying to QA..."
helm upgrade terraflow-qa ./helm --install --timeout=5m \
  --namespace=terraflow-qa --create-namespace \
  --set imageTag=${IMAGE_TAG} \
  --values=./helm/values-qa.yaml

echo "⏳ Waiting for QA frontend..."
kubectl wait --for=condition=ready pod -l app=frontend --timeout=120s --namespace=terraflow-qa 2>/dev/null || true
sleep 5

QA_POD=$(kubectl get pod -n terraflow-qa -l app=frontend -o jsonpath='{.items[0].metadata.name}')
echo "✅ QA Pod: ${QA_POD}"
echo ""

# Step 3: Deploy to UAT
echo "📦 Step 3: Deploying to UAT..."
helm upgrade terraflow-uat ./helm --install --timeout=5m \
  --namespace=terraflow-uat --create-namespace \
  --set imageTag=${IMAGE_TAG} \
  --values=./helm/values-uat.yaml

echo "⏳ Waiting for UAT frontend..."
kubectl wait --for=condition=ready pod -l app=frontend --timeout=120s --namespace=terraflow-uat 2>/dev/null || true
sleep 5

UAT_POD=$(kubectl get pod -n terraflow-uat -l app=frontend -o jsonpath='{.items[0].metadata.name}')
echo "✅ UAT Pod: ${UAT_POD}"
echo ""

# Step 4: Verify same image ID
echo "🔍 Step 4: Verifying both environments use same image..."
QA_IMAGE=$(kubectl get pod -n terraflow-qa ${QA_POD} -o jsonpath='{.spec.containers[0].image}')
UAT_IMAGE=$(kubectl get pod -n terraflow-uat ${UAT_POD} -o jsonpath='{.spec.containers[0].image}')

echo "   QA Image:  ${QA_IMAGE}"
echo "   UAT Image: ${UAT_IMAGE}"

if [ "${QA_IMAGE}" = "${UAT_IMAGE}" ]; then
  echo "✅ PASS: Both environments use the same image!"
else
  echo "❌ FAIL: Different images detected!"
  exit 1
fi
echo ""

# Step 5: Verify different runtime configs
echo "🔍 Step 5: Verifying different runtime configurations..."

echo "   QA Environment Variables:"
kubectl exec -n terraflow-qa ${QA_POD} -- env | grep -E "API_URL|DASHBOARD_URL|NODE_ENV" | sed 's/^/      /'

echo ""
echo "   UAT Environment Variables:"
kubectl exec -n terraflow-uat ${UAT_POD} -- env | grep -E "API_URL|DASHBOARD_URL|NODE_ENV" | sed 's/^/      /'

QA_API_URL=$(kubectl exec -n terraflow-qa ${QA_POD} -- env | grep "^API_URL=" | cut -d= -f2)
UAT_API_URL=$(kubectl exec -n terraflow-uat ${UAT_POD} -- env | grep "^API_URL=" | cut -d= -f2)

echo ""
if [ "${QA_API_URL}" != "${UAT_API_URL}" ]; then
  echo "✅ PASS: Different runtime configs detected!"
  echo "   QA:  ${QA_API_URL}"
  echo "   UAT: ${UAT_API_URL}"
else
  echo "❌ FAIL: Same configs detected!"
  exit 1
fi
echo ""

# Step 6: Test runtime config API endpoints
echo "🔍 Step 6: Testing runtime config API endpoints..."

echo "   QA Config API (http://localhost:30082/api/config):"
QA_CONFIG=$(curl -s http://localhost:30082/api/config)
echo "      ${QA_CONFIG}" | jq '.'

echo ""
echo "   UAT Config API (http://localhost:30083/api/config):"
UAT_CONFIG=$(curl -s http://localhost:30083/api/config)
echo "      ${UAT_CONFIG}" | jq '.'

QA_API=$(echo ${QA_CONFIG} | jq -r '.apiUrl')
UAT_API=$(echo ${UAT_CONFIG} | jq -r '.apiUrl')

echo ""
if [ "${QA_API}" = "http://localhost:30092/api" ] && [ "${UAT_API}" = "http://localhost:30093/api" ]; then
  echo "✅ PASS: Runtime config API returns correct values!"
  echo "   QA API:  ${QA_API}"
  echo "   UAT API: ${UAT_API}"
else
  echo "❌ FAIL: Incorrect runtime config values!"
  echo "   Expected QA:  http://localhost:30092/api"
  echo "   Got QA:       ${QA_API}"
  echo "   Expected UAT: http://localhost:30093/api"
  echo "   Got UAT:      ${UAT_API}"
  exit 1
fi
echo ""

# Summary
echo "=========================================="
echo "✅ ALL TESTS PASSED!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✅ Same Docker image used across environments"
echo "  ✅ Different runtime configurations applied"
echo "  ✅ Runtime config API working correctly"
echo ""
echo "Image: ${REGISTRY}/terraflow/frontend:${IMAGE_TAG}"
echo "Image ID: ${IMAGE_ID}"
echo ""
echo "Environments:"
echo "  QA:  http://localhost:30082 → API: http://localhost:30092/api"
echo "  UAT: http://localhost:30083 → API: http://localhost:30093/api"
echo ""
