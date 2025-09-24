# Define variables
$SERVICE_NAME = "backend-landregistry"
$RELEASE_NAME = "terraflow"
$NAMESPACE = "terraflow-app"
$PORT = 3000
$DOCKER_IMAGE = "terraflow/backend-landregistry:latest"
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
    $processes | ForEach-Object { Stop-Process -Id (Get-Process -Id $_.OwningProcess).Id -Force -ErrorAction SilentlyContinue }
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

# === Go back to root directory for Helm ===
Set-Location -Path ".."

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

# === Restart Deployment ===
Write-Host "Restarting deployment..." -ForegroundColor Yellow
kubectl rollout restart deployment/$SERVICE_NAME --namespace=$NAMESPACE

# === Wait for backend-landregistry pod to be ready ===
Write-Host "Waiting for pod to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=$SERVICE_NAME --timeout=60s --namespace=$NAMESPACE

# === Port-forward backend-landregistry ===
Write-Host "Setting up port-forward on port $PORT..." -ForegroundColor Yellow
Start-Process -NoNewWindow kubectl -ArgumentList "port-forward", "service/$SERVICE_NAME-service", "${PORT}:${PORT}", "--namespace=$NAMESPACE"

Write-Host "$SERVICE_NAME build and deployment completed!" -ForegroundColor Green
Write-Host "Service available at: http://localhost:$PORT" -ForegroundColor Cyan