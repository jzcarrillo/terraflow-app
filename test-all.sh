#!/bin/bash

echo "🧪 Running all backend tests..."
echo ""

SERVICES=(
  "api-gateway"
  "backend-payments"
  "backend-landregistry"
  "backend-users"
  "backend-documents"
  "backend-blockchain"
)

FAILED=0
PASSED=0

for service in "${SERVICES[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📦 Testing: $service"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  cd "$service" || exit 1
  
  if npm test; then
    echo "✅ $service tests passed"
    ((PASSED++))
  else
    echo "❌ $service tests failed"
    ((FAILED++))
  fi
  
  cd ..
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -gt 0 ]; then
  exit 1
fi
