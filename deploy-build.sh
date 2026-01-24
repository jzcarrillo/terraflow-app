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

echo -e "\033[0;32mBuilding $SERVICE_NAME...\033[0m"

# Check Docker status and auto-start if needed
echo -e "\033[0;33mChecking Docker Desktop status...\033[0m"
if ! docker info &>/dev/null; then
    echo -e "\033[0;33mDocker is not running. Starting Docker Desktop...\033[0m"
    open -a Docker
    echo -e "\033[0;33mWaiting for Docker to start...\033[0m"
    while ! docker info &>/dev/null; do
        sleep 2
    done
    echo -e "\033[0;32mDocker Desktop is ready!\033[0m"
else
    echo -e "\033[0;32mDocker Desktop is running\033[0m"
fi

# === Kill existing port-forward / processes on ALL service ports ===
ALL_PORTS=($PORT $API_PORT $DOCUMENTS_PORT $USERS_PORT $PAYMENTS_PORT 15432 15433 15434 15435 15672 30081 4005)
echo -e "\033[0;33mKilling existing processes on all service ports...\033[0m"

for port in "${ALL_PORTS[@]}"; do
    echo -e "\033[0;90mChecking port $port...\033[0m"
    lsof -ti:$port | xargs kill -9 2>/dev/null
done

# Kill all kubectl port-forward processes
echo -e "\033[0;33mKilling all kubectl port-forward processes...\033[0m"
pkill -f "kubectl port-forward" 2>/dev/null

# === Kill existing process on port ===
kubectl delete pod -l app=$SERVICE_NAME --namespace=$NAMESPACE --force --grace-period=0 2>/dev/null

# === Build Docker images in parallel ===
echo -e "\033[0;33mBuilding all Docker images in parallel...\033[0m"

(
  docker build -t $DOCKER_IMAGE ./backend-landregistry && echo -e "\033[0;32m✓ backend-landregistry\033[0m"
) &
PID1=$!

(
  docker build -t $API_DOCKER_IMAGE ./api-gateway && echo -e "\033[0;32m✓ api-gateway\033[0m"
) &
PID2=$!

(
  docker build -t $DOCUMENTS_DOCKER_IMAGE ./backend-documents && echo -e "\033[0;32m✓ backend-documents\033[0m"
) &
PID3=$!

(
  docker build -t $USERS_DOCKER_IMAGE ./backend-users && echo -e "\033[0;32m✓ backend-users\033[0m"
) &
PID4=$!

(
  docker build -t $PAYMENTS_DOCKER_IMAGE ./backend-payments && echo -e "\033[0;32m✓ backend-payments\033[0m"
) &
PID5=$!

(
  docker build -t $BLOCKCHAIN_DOCKER_IMAGE ./backend-blockchain && echo -e "\033[0;32m✓ backend-blockchain\033[0m"
) &
PID6=$!

# Wait for all builds
FAILED=0
wait $PID1 || FAILED=1
wait $PID2 || FAILED=1
wait $PID3 || FAILED=1
wait $PID4 || FAILED=1
wait $PID5 || FAILED=1
wait $PID6 || FAILED=1

if [ $FAILED -eq 1 ]; then
    echo -e "\033[0;31mOne or more builds failed!\033[0m"
    exit 1
fi

echo -e "\033[0;32mAll builds completed successfully!\033[0m"

# === Clear any pending Helm operations ===
echo -e "\033[0;33mClearing pending Helm operations...\033[0m"
helm rollback $RELEASE_NAME 0 --namespace=$NAMESPACE 2>/dev/null
helm uninstall $RELEASE_NAME --namespace=$NAMESPACE 2>/dev/null

# === Delete existing resources with wrong ownership ===
echo -e "\033[0;33mCleaning up existing resources...\033[0m"
kubectl delete service backend-landregistry-service --namespace=$NAMESPACE 2>/dev/null
kubectl delete deployment backend-landregistry --namespace=$NAMESPACE 2>/dev/null

# === Clean up Fabric PVCs and PVs ===
echo -e "\033[0;33mCleaning up Fabric storage resources...\033[0m"
kubectl patch pvc fabric-orderer-pvc -p '{"metadata":{"finalizers":null}}' --namespace=$NAMESPACE 2>/dev/null
kubectl patch pvc fabric-peer-pvc -p '{"metadata":{"finalizers":null}}' --namespace=$NAMESPACE 2>/dev/null
kubectl patch pvc fabric-couchdb-pvc -p '{"metadata":{"finalizers":null}}' --namespace=$NAMESPACE 2>/dev/null
kubectl delete pvc fabric-orderer-pvc fabric-peer-pvc fabric-couchdb-pvc --namespace=$NAMESPACE --force --grace-period=0 --ignore-not-found=true 2>/dev/null
kubectl delete pv fabric-orderer-pv fabric-peer-pv fabric-couchdb-pv --force --grace-period=0 --ignore-not-found=true 2>/dev/null

# Wait for PVCs to be completely deleted
echo -e "\033[0;33mWaiting for PVCs to be fully deleted...\033[0m"
maxWait=30
waited=0
while [ $waited -lt $maxWait ]; do
    sleep 2
    waited=$((waited + 2))
    remainingPVCs=$(kubectl get pvc --namespace=$NAMESPACE -o name 2>/dev/null | grep "fabric-")
    if [ -n "$remainingPVCs" ]; then
        echo -e "\033[0;33mForce deleting remaining PVCs...\033[0m"
        kubectl patch pvc fabric-orderer-pvc -p '{"metadata":{"finalizers":null}}' --namespace=$NAMESPACE 2>/dev/null
        kubectl patch pvc fabric-peer-pvc -p '{"metadata":{"finalizers":null}}' --namespace=$NAMESPACE 2>/dev/null
        kubectl patch pvc fabric-couchdb-pvc -p '{"metadata":{"finalizers":null}}' --namespace=$NAMESPACE 2>/dev/null
        kubectl delete pvc fabric-orderer-pvc fabric-peer-pvc fabric-couchdb-pvc --namespace=$NAMESPACE --force --grace-period=0 2>/dev/null
    else
        break
    fi
done

if [ -n "$remainingPVCs" ]; then
    echo -e "\033[0;33mWarning: Some PVCs still exist, continuing anyway...\033[0m"
fi

# === Deploy with Helm ===
echo -e "\033[0;33mDeploying with Helm...\033[0m"
if ! helm upgrade $RELEASE_NAME $HELM_CHART --install --timeout=10m --namespace=$NAMESPACE --create-namespace; then
    echo -e "\033[0;31mHelm deployment failed!\033[0m"
    exit 1
fi

# === Restart Deployments ===
echo -e "\033[0;33mRestarting deployments...\033[0m"
kubectl rollout restart deployment/$SERVICE_NAME --namespace=$NAMESPACE
kubectl rollout restart deployment/$API_SERVICE_NAME --namespace=$NAMESPACE
kubectl rollout restart deployment/$DOCUMENTS_SERVICE_NAME --namespace=$NAMESPACE
kubectl rollout restart deployment/$USERS_SERVICE_NAME --namespace=$NAMESPACE
kubectl rollout restart deployment/$PAYMENTS_SERVICE_NAME --namespace=$NAMESPACE
kubectl rollout restart deployment/$BLOCKCHAIN_SERVICE_NAME --namespace=$NAMESPACE

# === Ensure proper startup order ===
echo -e "\033[0;33mEnsuring proper startup order...\033[0m"

echo -e "\033[0;33mWaiting for Redis pod...\033[0m"
kubectl wait --for=condition=ready pod -l app=redis --timeout=120s --namespace=$NAMESPACE

echo -e "\033[0;33mWaiting for RabbitMQ pod...\033[0m"
kubectl wait --for=condition=ready pod -l app=rabbitmq --timeout=120s --namespace=$NAMESPACE

echo -e "\033[0;33mWaiting for PostgreSQL pod...\033[0m"
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s --namespace=$NAMESPACE

echo -e "\033[0;33mWaiting for PostgreSQL Documents pod...\033[0m"
kubectl wait --for=condition=ready pod -l app=postgres-documents --timeout=120s --namespace=$NAMESPACE

echo -e "\033[0;33mWaiting for PostgreSQL Users pod...\033[0m"
kubectl wait --for=condition=ready pod -l app=postgres-users --timeout=120s --namespace=$NAMESPACE

echo -e "\033[0;33mWaiting for PostgreSQL Payments pod...\033[0m"
kubectl wait --for=condition=ready pod -l app=postgres-payments --timeout=120s --namespace=$NAMESPACE

echo -e "\033[0;33mWaiting for backend-landregistry pod...\033[0m"
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=120s --namespace=$NAMESPACE

echo -e "\033[0;33mWaiting for backend-documents pod...\033[0m"
kubectl wait --for=condition=ready pod -l app=backend-documents --timeout=120s --namespace=$NAMESPACE

echo -e "\033[0;33mWaiting for backend-users pod...\033[0m"
kubectl wait --for=condition=ready pod -l app=backend-users --timeout=120s --namespace=$NAMESPACE

echo -e "\033[0;33mWaiting for backend-payments pod...\033[0m"
kubectl wait --for=condition=ready pod -l app=backend-payments --timeout=120s --namespace=$NAMESPACE

echo -e "\033[0;33mWaiting for API Gateway pod...\033[0m"
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=120s --namespace=$NAMESPACE

echo -e "\033[0;32mBuild and deployment completed!\033[0m"

# === Automatic Database Port Forwarding ===
echo -e "\033[0;32mStarting database port forwarding...\033[0m"
echo -e "\033[0;90mPort forwards cleared, starting new ones...\033[0m"

echo -e "\033[0;32mPort forwarding postgres-landregistry: localhost:15432\033[0m"
kubectl port-forward service/postgres-landregistry-service 15432:5432 --namespace=$NAMESPACE &

echo -e "\033[0;32mPort forwarding postgres-documents: localhost:15433\033[0m"
kubectl port-forward service/postgres-documents-service 15433:5433 --namespace=$NAMESPACE &

echo -e "\033[0;32mPort forwarding postgres-users: localhost:15434\033[0m"
kubectl port-forward service/postgres-users-service 15434:5434 --namespace=$NAMESPACE &

echo -e "\033[0;32mPort forwarding postgres-payments: localhost:15435\033[0m"
kubectl port-forward service/postgres-payments-service 15435:5435 --namespace=$NAMESPACE &

echo -e "\033[0;32mPort forwarding rabbitmq-management: localhost:15672\033[0m"
kubectl port-forward service/rabbitmq-management 15672:15672 --namespace=$NAMESPACE &

echo -e "\033[0;32mPort forwarding api-gateway: localhost:30081\033[0m"
kubectl port-forward service/terraflow-api-gateway-service 30081:8081 --namespace=$NAMESPACE &

echo -e "\033[0;32mDatabase, RabbitMQ and API Gateway port forwarding active in console!\033[0m"
echo -e "\033[0;36mRabbitMQ Management UI: http://localhost:15672 (admin/password)\033[0m"
echo -e "\033[0;36mAPI Gateway URL: http://localhost:30081\033[0m"

# === Run Database Migrations ===
echo -e "\033[0;33mRunning database migrations...\033[0m"
echo -e "\033[0;90mAdding transfer_id column to payments table...\033[0m"
kubectl exec -n terraflow-app deployment/postgres-payments -- psql -U postgres -d terraflow_payments -c "ALTER TABLE payments ADD COLUMN IF NOT EXISTS transfer_id VARCHAR(255);" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "\033[0;32m✓ Database migration completed\033[0m"
else
    echo -e "\033[0;33m⚠ Migration skipped (column may already exist)\033[0m"
fi

# === Start Frontend Application ===
echo -e "\033[0;32mStarting Frontend Application...\033[0m"

cd frontend
if [ -f "package.json" ]; then
    echo -e "\033[0;33mInstalling frontend dependencies...\033[0m"
    npm install
    
    echo -e "\033[0;32mStarting frontend on port 4005...\033[0m"
    npm run dev &
    
    echo -e "\033[0;32mFrontend started successfully!\033[0m"
    echo -e "\033[0;36mFrontend URL: http://localhost:4005/register\033[0m"
else
    echo -e "\033[0;33mWarning: Frontend package.json not found\033[0m"
fi

cd ..
