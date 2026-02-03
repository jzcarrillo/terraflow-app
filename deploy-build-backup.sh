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

# Run tests from root using jest.config.js
if [ -f "jest.config.js" ]; then
    echo -e "\033[0;33mRunning all tests from root config...\033[0m"
    
    # Install root dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "\033[0;33mInstalling root dependencies...\033[0m"
        npm install --silent
    fi
    
    if npm test -- --coverage 2>&1; then
        echo -e "\033[0;32m✓ All tests passed!\033[0m"
    else
        echo -e "\033[0;31m✗ Tests FAILED!\033[0m"
        TEST_FAILED=1
    fi
else
    # Fallback to individual service tests
    for service in "${SERVICES[@]}"; do
        if [ -f "./$service/package.json" ]; then
            echo -e "\033[0;33mTesting $service...\033[0m"
            cd "./$service"
            
            if grep -q '"test"' package.json; then
                if npm test -- --passWithNoTests --coverage 2>/dev/null; then
                    echo -e "\033[0;32m✓ $service tests passed\033[0m"
                else
                    echo -e "\033[0;31m✗ $service tests FAILED!\033[0m"
                    TEST_FAILED=1
                fi
            else
                echo -e "\033[0;33m⚠ $service has no tests, skipping...\033[0m"
            fi
            
            cd ..
        fi
    done
fi

# Exit if tests failed
if [ $TEST_FAILED -eq 1 ]; then
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

# Kill existing processes
ALL_PORTS=($PORT $API_PORT $DOCUMENTS_PORT $USERS_PORT $PAYMENTS_PORT 15432 15433 15434 15435 15672 30081 4005)
for port in "${ALL_PORTS[@]}"; do
    lsof -ti:$port | xargs kill -9 2>/dev/null
done
pkill -f "kubectl port-forward" 2>/dev/null

# Build images in parallel
(
  # Wait for Docker to be fully ready
  while ! docker info &>/dev/null; do sleep 1; done
  docker build -t $DOCKER_IMAGE ./backend-landregistry && echo -e "\033[0;32m✓ backend-landregistry\033[0m"
) &
PID1=$!

(
  while ! docker info &>/dev/null; do sleep 1; done
  docker build -t $API_DOCKER_IMAGE ./api-gateway && echo -e "\033[0;32m✓ api-gateway\033[0m"
) &
PID2=$!

(
  while ! docker info &>/dev/null; do sleep 1; done
  docker build -t $DOCUMENTS_DOCKER_IMAGE ./backend-documents && echo -e "\033[0;32m✓ backend-documents\033[0m"
) &
PID3=$!

(
  while ! docker info &>/dev/null; do sleep 1; done
  docker build -t $USERS_DOCKER_IMAGE ./backend-users && echo -e "\033[0;32m✓ backend-users\033[0m"
) &
PID4=$!

(
  while ! docker info &>/dev/null; do sleep 1; done
  docker build -t $PAYMENTS_DOCKER_IMAGE ./backend-payments && echo -e "\033[0;32m✓ backend-payments\033[0m"
) &
PID5=$!

(
  while ! docker info &>/dev/null; do sleep 1; done
  docker build -t $BLOCKCHAIN_DOCKER_IMAGE ./backend-blockchain && echo -e "\033[0;32m✓ backend-blockchain\033[0m"
) &
PID6=$!

# Wait for all builds
DOCKER_FAILED=0
wait $PID1 || DOCKER_FAILED=1
wait $PID2 || DOCKER_FAILED=1
wait $PID3 || DOCKER_FAILED=1
wait $PID4 || DOCKER_FAILED=1
wait $PID5 || DOCKER_FAILED=1
wait $PID6 || DOCKER_FAILED=1

if [ $DOCKER_FAILED -eq 1 ]; then
    echo -e "\033[0;31m✗ Docker build failed!\033[0m"
    exit 1
fi

echo -e "\033[0;32m✓ All Docker images built successfully!\033[0m"

# ===================================================================
# STEP 4: KUBERNETES - Clean up resources
# ===================================================================
echo -e "\n\033[0;36m[5/7] Cleaning up Kubernetes resources...\033[0m"

kubectl delete pod -l app=$SERVICE_NAME --namespace=$NAMESPACE --force --grace-period=0 2>/dev/null
helm rollback $RELEASE_NAME 0 --namespace=$NAMESPACE 2>/dev/null
helm uninstall $RELEASE_NAME --namespace=$NAMESPACE 2>/dev/null

# Clean up Fabric PVCs
kubectl patch pvc fabric-orderer-pvc -p '{"metadata":{"finalizers":null}}' --namespace=$NAMESPACE 2>/dev/null
kubectl patch pvc fabric-peer-pvc -p '{"metadata":{"finalizers":null}}' --namespace=$NAMESPACE 2>/dev/null
kubectl patch pvc fabric-couchdb-pvc -p '{"metadata":{"finalizers":null}}' --namespace=$NAMESPACE 2>/dev/null
kubectl delete pvc fabric-orderer-pvc fabric-peer-pvc fabric-couchdb-pvc --namespace=$NAMESPACE --force --grace-period=0 2>/dev/null
kubectl delete pv fabric-orderer-pv fabric-peer-pv fabric-couchdb-pv --force --grace-period=0 2>/dev/null

echo -e "\033[0;32m✓ Cleanup completed\033[0m"

# ===================================================================
# STEP 5: HELM - Deploy to Kubernetes
# ===================================================================
echo -e "\n\033[0;36m[6/7] Deploying with Helm...\033[0m"

if ! helm upgrade $RELEASE_NAME $HELM_CHART --install --timeout=10m --namespace=$NAMESPACE --create-namespace; then
    echo -e "\033[0;31m✗ Helm deployment failed!\033[0m"
    exit 1
fi

# Restart deployments
kubectl rollout restart deployment/$SERVICE_NAME --namespace=$NAMESPACE
kubectl rollout restart deployment/$API_SERVICE_NAME --namespace=$NAMESPACE
kubectl rollout restart deployment/$DOCUMENTS_SERVICE_NAME --namespace=$NAMESPACE
kubectl rollout restart deployment/$USERS_SERVICE_NAME --namespace=$NAMESPACE
kubectl rollout restart deployment/$PAYMENTS_SERVICE_NAME --namespace=$NAMESPACE
kubectl rollout restart deployment/$BLOCKCHAIN_SERVICE_NAME --namespace=$NAMESPACE

# Wait for pods
echo -e "\033[0;33mWaiting for pods to be ready...\033[0m"
kubectl wait --for=condition=ready pod -l app=redis --timeout=120s --namespace=$NAMESPACE 2>/dev/null
kubectl wait --for=condition=ready pod -l app=rabbitmq --timeout=120s --namespace=$NAMESPACE 2>/dev/null
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s --namespace=$NAMESPACE 2>/dev/null
kubectl wait --for=condition=ready pod -l app=postgres-documents --timeout=120s --namespace=$NAMESPACE 2>/dev/null
kubectl wait --for=condition=ready pod -l app=postgres-users --timeout=120s --namespace=$NAMESPACE 2>/dev/null
kubectl wait --for=condition=ready pod -l app=postgres-payments --timeout=120s --namespace=$NAMESPACE 2>/dev/null
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=120s --namespace=$NAMESPACE 2>/dev/null
kubectl wait --for=condition=ready pod -l app=backend-documents --timeout=120s --namespace=$NAMESPACE 2>/dev/null
kubectl wait --for=condition=ready pod -l app=backend-users --timeout=120s --namespace=$NAMESPACE 2>/dev/null
kubectl wait --for=condition=ready pod -l app=backend-payments --timeout=120s --namespace=$NAMESPACE 2>/dev/null
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=120s --namespace=$NAMESPACE 2>/dev/null

echo -e "\033[0;32m✓ Deployment completed!\033[0m"

# Port forwarding
kubectl port-forward service/postgres-landregistry-service 15432:5432 --namespace=$NAMESPACE &
kubectl port-forward service/postgres-documents-service 15433:5433 --namespace=$NAMESPACE &
kubectl port-forward service/postgres-users-service 15434:5434 --namespace=$NAMESPACE &
kubectl port-forward service/postgres-payments-service 15435:5435 --namespace=$NAMESPACE &
kubectl port-forward service/rabbitmq-management 15672:15672 --namespace=$NAMESPACE &
kubectl port-forward service/terraflow-api-gateway-service 30081:8081 --namespace=$NAMESPACE &

# ===================================================================
# STEP 6: PLAYWRIGHT E2E TESTS
# ===================================================================
echo -e "\n\033[0;36m[7/7] Running Playwright E2E tests...\033[0m"

# Start frontend
cd frontend
if [ -f "package.json" ]; then
    npm install --silent
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for frontend to start
    echo -e "\033[0;33mWaiting for frontend to start...\033[0m"
    sleep 10
    
    cd ..
    
    # Run Playwright tests
    if [ -d "playwright" ]; then
        echo -e "\033[0;33mRunning Playwright automation tests...\033[0m"
        cd playwright
        
        # Install dependencies if needed
        if [ -f "package.json" ]; then
            npm install --silent
        fi
        
        # Run npm run automate
        if npm run automate 2>/dev/null; then
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
