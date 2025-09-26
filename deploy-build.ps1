# Define variables
$SERVICE_NAME = "backend-landregistry"
$API_SERVICE_NAME = "api-gateway"
$RELEASE_NAME = "terraflow"
$NAMESPACE = "terraflow-app"
$PORT = 3000
$API_PORT = 8081
$DOCKER_IMAGE = "terraflow/backend-landregistry:latest"
$API_DOCKER_IMAGE = "terraflow/api-gateway:latest"
$HELM_CHART = "./helm"

Write-Host "Building $SERVICE_NAME..." -ForegroundColor Green

# === Change to backend-landregistry directory ===
Set-Location -Path "backend-landregistry"
if (-not (Test-Path "Dockerfile")) {
    Write-Host "Error: Dockerfile not found in backend-landregistry directory." -ForegroundColor Red
    exit 1
}

# === Kill existing port-forward / processes on multiple ports ===
Write-Host "Killing existing processes on port $PORT..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue
if ($processes) {
    $processes | ForEach-Object { 
        try {
            $processId = (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).Id
            if ($processId) {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        } catch {
            # Ignore errors - process might already be gone
        }
    }
}

# === Kill existing process on port ===
kubectl delete pod -l app=$SERVICE_NAME --namespace=$NAMESPACE --force --grace-period=0 2>$null

# === Build Docker image ===
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t $DOCKER_IMAGE .
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1 
}

# === Go back to root directory ===
Set-Location -Path ".."

# === Build API Gateway ===
Write-Host "Building $API_SERVICE_NAME..." -ForegroundColor Green

# Kill existing processes on API Gateway port
Write-Host "Killing existing processes on port $API_PORT..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort $API_PORT -ErrorAction SilentlyContinue
if ($processes) {
    $processes | ForEach-Object { 
        try {
            $processId = (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).Id
            if ($processId) {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        } catch {
            # Ignore errors - process might already be gone
        }
    }
}

# Build API Gateway Docker image
Write-Host "Building API Gateway Docker image..." -ForegroundColor Yellow
docker build -t $API_DOCKER_IMAGE ./api-gateway
if ($LASTEXITCODE -ne 0) { 
    Write-Host "API Gateway Docker build failed!" -ForegroundColor Red
    exit 1 
}

# === Clear any pending Helm operations ===
Write-Host "Clearing pending Helm operations..." -ForegroundColor Yellow
helm rollback $RELEASE_NAME 0 --namespace=$NAMESPACE 2>$null
helm uninstall $RELEASE_NAME --namespace=$NAMESPACE 2>$null

# === Delete existing resources with wrong ownership ===
Write-Host "Cleaning up existing resources..." -ForegroundColor Yellow
kubectl delete service backend-landregistry-service --namespace=$NAMESPACE 2>$null
kubectl delete deployment backend-landregistry --namespace=$NAMESPACE 2>$null

# === Deploy with Helm ===
Write-Host "Deploying with Helm..." -ForegroundColor Yellow
helm upgrade $RELEASE_NAME $HELM_CHART --install --timeout=10m --namespace=$NAMESPACE --create-namespace
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Helm deployment failed!" -ForegroundColor Red
    exit 1 
}

# === Restart Deployments ===
Write-Host "Restarting deployments..." -ForegroundColor Yellow
kubectl rollout restart deployment/$SERVICE_NAME --namespace=$NAMESPACE
kubectl rollout restart deployment/$API_SERVICE_NAME --namespace=$NAMESPACE

# === Ensure proper startup order ===
Write-Host "Ensuring proper startup order..." -ForegroundColor Yellow

# Wait for Redis to be ready first
Write-Host "Waiting for Redis pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=redis --timeout=120s --namespace=$NAMESPACE

# Wait for RabbitMQ to be ready
Write-Host "Waiting for RabbitMQ pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=rabbitmq --timeout=120s --namespace=$NAMESPACE

# Wait for PostgreSQL to be ready
Write-Host "Waiting for PostgreSQL pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s --namespace=$NAMESPACE

# Then wait for backend-landregistry
Write-Host "Waiting for backend-landregistry pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=120s --namespace=$NAMESPACE

# Finally wait for API Gateway
Write-Host "Waiting for API Gateway pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=120s --namespace=$NAMESPACE

Write-Host "Build and deployment completed!" -ForegroundColor Green