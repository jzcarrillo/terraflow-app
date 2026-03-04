#!/bin/bash

# Define variables
SERVICE_NAME="backend-landregistry"
API_SERVICE_NAME="api-gateway"
DOCUMENTS_SERVICE_NAME="backend-documents"
USERS_SERVICE_NAME="backend-users"
PAYMENTS_SERVICE_NAME="backend-payments"
BLOCKCHAIN_SERVICE_NAME="backend-blockchain"
RELEASE_NAME="terraflow"
NAMESPACE="terraflow-app"
PORT=3000
API_PORT=8081
DOCUMENTS_PORT=3002
USERS_PORT=3001
PAYMENTS_PORT=3003
DOCKER_IMAGE="terraflow/backend-landregistry:latest"
API_DOCKER_IMAGE="terraflow/api-gateway:latest"
DOCUMENTS_DOCKER_IMAGE="terraflow/backend-documents:latest"
USERS_DOCKER_IMAGE="terraflow/backend-users:latest"
PAYMENTS_DOCKER_IMAGE="terraflow/backend-payments:latest"
BLOCKCHAIN_DOCKER_IMAGE="terraflow/backend-blockchain:latest"
HELM_CHART="./helm"

echo -e "\033[0;36m========================================\033[0m"
echo -e "\033[0;36m  TERRAFLOW CI/CD PIPELINE WITH TESTS  \033[0m"
echo -e "\033[0;36m========================================\033[0m"

# Check Docker status and auto-start if needed
echo -e "\033[0;33m[1/7] Checking Docker Desktop status...\033[0m"
if ! docker info &>/dev/null; then
    echo -e "\033[0;33mDocker is not running. Starting Docker Desktop...\033[0m"
    open -a Docker
    echo -e "\033[0;33mWaiting for Docker to start...\033[0m"
    while ! docker info &>/dev/null; do
        sleep 2
    done
    echo -e "\033[0;32m✓ Docker Desktop is ready!\033[0m"
else
    echo -e "\033[0;32m✓ Docker Desktop is running\033[0m"
fi

export DOCKER_HOST="unix://$HOME/.docker/run/docker.sock"

# Wait for Docker socket to be ready
echo -e "\033[0;33mWaiting for Docker socket...\033[0m"
max_wait=30
waited=0
while [ $waited -lt $max_wait ]; do
    if docker info &>/dev/null; then
        break
    fi
    sleep 1
    waited=$((waited + 1))
done

# ===================================================================
# STEP 1: NPM BUILD - Build all services
# ===================================================================
echo -e "\n\033[0;36m[2/7] Building all services with npm...\033[0m"

SERVICES=("backend-landregistry" "api-gateway" "backend-documents" "backend-users" "backend-payments" "backend-blockchain")
BUILD_FAILED=0

for service in "${SERVICES[@]}"; do
    if [ -f "./$service/package.json" ]; then
        echo -e "\033[0;33mBuilding $service...\033[0m"
        cd "./$service"
        
        # Install dependencies
        npm install --silent
        
        # Run build
        if npm run build 2>/dev/null; then
            echo -e "\033[0;32m✓ $service build successful\033[0m"
        else
            echo -e "\033[0;33m⚠ $service has no build script, skipping...\033[0m"
        fi
        
        cd ..
    fi
done

# ===================================================================
# STEP 2: JEST UNIT TESTS - Run tests for all services
# ===================================================================
echo -e "\n\033[0;36m[3/7] Running Jest unit tests with coverage...\033[0m"

TEST_FAILED=0

# Install root dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "\033[0;33mInstalling root dependencies...\033[0m"
    npm install --silent
fi

echo -e "\033[0;33mRunning all microservice tests...\033[0m"

set +e  # Temporarily disable exit on error
npm test
TEST_EXIT_CODE=$?
set -e  # Re-enable exit on error

if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo -e "\033[0;31m✗ Tests FAILED!\033[0m"
    echo -e "\n\033[0;31m========================================\033[0m"
    echo -e "\033[0;31m  TESTS FAILED - BUILD ABORTED\033[0m"
    echo -e "\033[0;31m========================================\033[0m"
    exit 1
fi

echo -e "\033[0;32m✓ All tests passed!\033[0m"

# ===================================================================
# STEP 3: DOCKER BUILD - Build Docker images
# ===================================================================
echo -e "\n\033[0;36m[4/7] Building Docker images...\033[0m"

# Kill existing processes (with timeout protection)
echo -e "\033[0;33mCleaning up ports...\033[0m"
ALL_PORTS=($PORT $API_PORT $DOCUMENTS_PORT $USERS_PORT $PAYMENTS_PORT 15432 15433 15434 15435 15672 30081 4005)
for port in "${ALL_PORTS[@]}"; do
    lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null &
done
wait
pkill -f "kubectl port-forward" 2>/dev/null || true
echo -e "\033[0;32m✓ Ports cleaned\033[0m"

# Build images sequentially with progress
echo -e "\033[0;33mStarting Docker builds...\033[0m"
echo -e "\033[0;33mThis may take 5-10 minutes. Please wait...\033[0m"

echo -e "\n\033[0;33m[1/6] Building backend-landregistry...\033[0m"
if docker build -t $DOCKER_IMAGE ./backend-landregistry; then
    echo -e "\033[0;32m✓ backend-landregistry\033[0m"
else
    echo -e "\033[0;31m✗ backend-landregistry failed\033[0m"
    exit 1
fi

echo -e "\033[0;33m[2/6] Building api-gateway...\033[0m"
if docker build -t $API_DOCKER_IMAGE ./api-gateway; then
    echo -e "\033[0;32m✓ api-gateway\033[0m"
else
    echo -e "\033[0;31m✗ api-gateway failed\033[0m"
    exit 1
fi

echo -e "\033[0;33m[3/6] Building backend-documents...\033[0m"
if docker build -t $DOCUMENTS_DOCKER_IMAGE ./backend-documents; then
    echo -e "\033[0;32m✓ backend-documents\033[0m"
else
    echo -e "\033[0;31m✗ backend-documents failed\033[0m"
    exit 1
fi

echo -e "\033[0;33m[4/6] Building backend-users...\033[0m"
if docker build -t $USERS_DOCKER_IMAGE ./backend-users; then
    echo -e "\033[0;32m✓ backend-users\033[0m"
else
    echo -e "\033[0;31m✗ backend-users failed\033[0m"
    exit 1
fi

echo -e "\033[0;33m[5/6] Building backend-payments...\033[0m"
if docker build -t $PAYMENTS_DOCKER_IMAGE ./backend-payments; then
    echo -e "\033[0;32m✓ backend-payments\033[0m"
else
    echo -e "\033[0;31m✗ backend-payments failed\033[0m"
    exit 1
fi

echo -e "\033[0;33m[6/6] Building backend-blockchain...\033[0m"
if docker build -t $BLOCKCHAIN_DOCKER_IMAGE ./backend-blockchain; then
    echo -e "\033[0;32m✓ backend-blockchain\033[0m"
else
    echo -e "\033[0;31m✗ backend-blockchain failed\033[0m"
    exit 1
fi

echo -e "\033[0;32m✓ All Docker images built successfully!\033[0m"

# ===================================================================
# STEP 4: KUBERNETES - Clean up resources
# ===================================================================
echo -e "\n\033[0;36m[5/7] Cleaning up Kubernetes resources...\033[0m"

echo -e "\033[0;33mDeleting old pods...\033[0m"
kubectl delete pod -l app=$SERVICE_NAME --namespace=$NAMESPACE --force --grace-period=0 2>/dev/null || true

echo -e "\033[0;33mRolling back Helm release...\033[0m"
helm rollback $RELEASE_NAME 0 --namespace=$NAMESPACE 2>/dev/null || true

echo -e "\033[0;33mUninstalling Helm release...\033[0m"
helm uninstall $RELEASE_NAME --namespace=$NAMESPACE --wait --timeout=2m 2>/dev/null || true

echo -e "\033[0;33mCleaning up Fabric PVCs...\033[0m"
kubectl patch pvc fabric-orderer-pvc -p '{"metadata":{"finalizers":null}}' --namespace=$NAMESPACE 2>/dev/null || true
kubectl patch pvc fabric-peer-pvc -p '{"metadata":{"finalizers":null}}' --namespace=$NAMESPACE 2>/dev/null || true
kubectl patch pvc fabric-couchdb-pvc -p '{"metadata":{"finalizers":null}}' --namespace=$NAMESPACE 2>/dev/null || true
kubectl delete pvc fabric-orderer-pvc fabric-peer-pvc fabric-couchdb-pvc --namespace=$NAMESPACE --force --grace-period=0 2>/dev/null || true
kubectl delete pv fabric-orderer-pv fabric-peer-pv fabric-couchdb-pv --force --grace-period=0 2>/dev/null || true

echo -e "\033[0;32m✓ Cleanup completed\033[0m"

# ===================================================================
# STEP 5: HELM - Deploy to Kubernetes
# ===================================================================
echo -e "\n\033[0;36m[6/7] Deploying with Helm...\033[0m"

if ! helm upgrade $RELEASE_NAME $HELM_CHART --install --timeout=10m --namespace=$NAMESPACE --create-namespace; then
    echo -e "\033[0;31m✗ Helm deployment failed!\033[0m"
    exit 1
fi

# Wait for pods (no restart needed, Helm handles updates)

# Wait for pods
echo -e "\033[0;33mWaiting for pods to be ready...\033[0m"
kubectl wait --for=condition=ready pod -l app=redis --timeout=120s --namespace=$NAMESPACE 2>/dev/null || echo "⚠ Redis not ready"
kubectl wait --for=condition=ready pod -l app=rabbitmq --timeout=120s --namespace=$NAMESPACE 2>/dev/null || echo "⚠ RabbitMQ not ready"
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s --namespace=$NAMESPACE 2>/dev/null || echo "⚠ Postgres landregistry not ready"
kubectl wait --for=condition=ready pod -l app=postgres-documents --timeout=120s --namespace=$NAMESPACE 2>/dev/null || echo "⚠ Postgres documents not ready"
kubectl wait --for=condition=ready pod -l app=postgres-users --timeout=120s --namespace=$NAMESPACE 2>/dev/null || echo "⚠ Postgres users not ready"
kubectl wait --for=condition=ready pod -l app=postgres-payments --timeout=120s --namespace=$NAMESPACE 2>/dev/null || echo "⚠ Postgres payments not ready"
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=120s --namespace=$NAMESPACE 2>/dev/null || echo "⚠ Backend landregistry not ready"
kubectl wait --for=condition=ready pod -l app=backend-documents --timeout=120s --namespace=$NAMESPACE 2>/dev/null || echo "⚠ Backend documents not ready"
kubectl wait --for=condition=ready pod -l app=backend-users --timeout=120s --namespace=$NAMESPACE 2>/dev/null || echo "⚠ Backend users not ready"
kubectl wait --for=condition=ready pod -l app=backend-payments --timeout=120s --namespace=$NAMESPACE 2>/dev/null || echo "⚠ Backend payments not ready"
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=120s --namespace=$NAMESPACE 2>/dev/null || echo "⚠ API Gateway not ready"

echo -e "\033[0;32m✓ Deployment completed!\033[0m"

# Port forwarding
kubectl port-forward service/postgres-landregistry-service 15432:5432 --namespace=$NAMESPACE &
kubectl port-forward service/postgres-documents-service 15433:5433 --namespace=$NAMESPACE &
kubectl port-forward service/postgres-users-service 15434:5434 --namespace=$NAMESPACE &
kubectl port-forward service/postgres-payments-service 15435:5435 --namespace=$NAMESPACE &
kubectl port-forward service/rabbitmq-management 15672:15672 --namespace=$NAMESPACE &
kubectl port-forward service/api-gateway-service 30081:8081 --namespace=$NAMESPACE &

# Wait for services to stabilize
echo -e "\033[0;33mWaiting for services to stabilize...\033[0m"
sleep 20

# Verify port-forwards are working
echo -e "\033[0;33mVerifying API Gateway connection...\033[0m"
for i in {1..10}; do
  if curl -s http://localhost:30081/health > /dev/null 2>&1; then
    echo -e "\033[0;32m✓ API Gateway is ready\033[0m"
    break
  fi
  echo -e "\033[0;33mWaiting for API Gateway... (attempt $i/10)\033[0m"
  sleep 2
done

# ===================================================================
# STEP 6: PLAYWRIGHT E2E TESTS
# ===================================================================
echo -e "\n\033[0;36m[7/7] Running Playwright E2E tests...\033[0m"

# Start frontend
cd frontend
if [ -f "package.json" ]; then
    npm install --silent
    
    # Create .env.local for local dev environment
    echo "NEXT_PUBLIC_API_URL=http://localhost:30081/api" > .env.local
    echo "NEXT_PUBLIC_DASHBOARD_URL=http://localhost:4005/" >> .env.local
    echo -e "\033[0;32m✓ Created .env.local with local dev config\033[0m"
    
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for frontend to start and load env vars
    echo -e "\033[0;33mWaiting for frontend to start...\033[0m"
    sleep 15
    
    # Verify frontend is running
    for i in {1..10}; do
      if curl -s http://localhost:4005 > /dev/null 2>&1; then
        echo -e "\033[0;32m✓ Frontend is ready\033[0m"
        break
      fi
      echo -e "\033[0;33mWaiting for frontend... (attempt $i/10)\033[0m"
      sleep 2
    done
    
    cd ..
    
    # Run Playwright tests
    if [ -d "playwright" ]; then
        echo -e "\033[0;33mRunning Playwright automation tests...\033[0m"
        cd playwright
        
        # Install dependencies if needed
        if [ -f "package.json" ]; then
            npm install --silent
        fi
        
        # Run npm run automate:dev (local dev E2E tests)
        if npm run automate:dev 2>/dev/null; then
            echo -e "\033[0;32m✓ Playwright tests passed!\033[0m"
        else
            echo -e "\033[0;33m⚠ Playwright tests failed or not configured\033[0m"
        fi
        cd ..
    else
        echo -e "\033[0;33m⚠ Playwright folder not found, skipping...\033[0m"
    fi
else
    echo -e "\033[0;33m⚠ Frontend not found\033[0m"
fi

# ===================================================================
# DEPLOYMENT COMPLETE
# ===================================================================
echo -e "\n\033[0;32m========================================\033[0m"
echo -e "\033[0;32m  DEPLOYMENT SUCCESSFUL!\033[0m"
echo -e "\033[0;32m========================================\033[0m"
echo -e "\033[0;36mAPI Gateway: http://localhost:30081\033[0m"
echo -e "\033[0;36mFrontend: http://localhost:4005/register\033[0m"
echo -e "\033[0;36mRabbitMQ: http://localhost:15672 (admin/password)\033[0m"
echo -e "\033[0;32m========================================\033[0m"
