# Define variables
$SERVICE_NAME = "backend-landregistry"
$API_SERVICE_NAME = "api-gateway"
$DOCUMENTS_SERVICE_NAME = "backend-documents"
$USERS_SERVICE_NAME = "backend-users"
$RELEASE_NAME = "terraflow"
$NAMESPACE = "terraflow-app"
$PORT = 3000
$API_PORT = 8081
$DOCUMENTS_PORT = 3002
$USERS_PORT = 3001
$DOCKER_IMAGE = "terraflow/backend-landregistry:latest"
$API_DOCKER_IMAGE = "terraflow/api-gateway:latest"
$DOCUMENTS_DOCKER_IMAGE = "terraflow/backend-documents:latest"
$USERS_DOCKER_IMAGE = "terraflow/backend-users:latest"
$HELM_CHART = "./helm"

Write-Host "Building $SERVICE_NAME..." -ForegroundColor Green

# === Check Docker Desktop Status ===
Write-Host "Checking Docker Desktop status..." -ForegroundColor Yellow

# Kill any stuck Docker processes first
Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "com.docker.proxy" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 3

# Start Docker Desktop
Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
Start-Process -FilePath "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue

# Wait for Docker to be ready
Write-Host "Waiting for Docker Desktop to be ready..." -ForegroundColor Yellow
$maxRetries = 12
$retryCount = 0

do {
    Start-Sleep -Seconds 10
    $retryCount++
    Write-Host "Attempt $retryCount of $maxRetries..." -ForegroundColor Gray
    
    try {
        docker version 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docker Desktop is ready!" -ForegroundColor Green
            break
        }
    } catch {
        # Continue trying
    }
    
    if ($retryCount -eq $maxRetries) {
        Write-Host "❌ Docker Desktop failed to start after 2 minutes." -ForegroundColor Red
        Write-Host "Please start Docker Desktop manually and run the script again." -ForegroundColor Yellow
        exit 1
    }
} while ($true)

# === Change to backend-landregistry directory ===
Set-Location -Path "backend-landregistry"
if (-not (Test-Path "Dockerfile")) {
    Write-Host "Error: Dockerfile not found in backend-landregistry directory." -ForegroundColor Red
    exit 1
}

# === Kill existing port-forward / processes on ALL service ports ===
$ALL_PORTS = @($PORT, $API_PORT, $DOCUMENTS_PORT, $USERS_PORT, 15432, 15433, 15434, 30081)
Write-Host "Killing existing processes on all service ports..." -ForegroundColor Yellow

foreach ($portToKill in $ALL_PORTS) {
    Write-Host "Checking port $portToKill..." -ForegroundColor Gray
    $processes = Get-NetTCPConnection -LocalPort $portToKill -ErrorAction SilentlyContinue
    if ($processes) {
        $processes | ForEach-Object { 
            try {
                $processId = (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).Id
                if ($processId) {
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    Write-Host "Killed process on port $portToKill" -ForegroundColor Yellow
                }
            } catch {
                # Ignore errors - process might already be gone
            }
        }
    }
}

# Kill all kubectl port-forward processes
Write-Host "Killing all kubectl port-forward processes..." -ForegroundColor Yellow
taskkill /f /im kubectl.exe 2>$null

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



# Build API Gateway Docker image
Write-Host "Building API Gateway Docker image..." -ForegroundColor Yellow
docker build -t $API_DOCKER_IMAGE ./api-gateway
if ($LASTEXITCODE -ne 0) { 
    Write-Host "API Gateway Docker build failed!" -ForegroundColor Red
    exit 1 
}

# === Build Backend Documents ===
Write-Host "Building $DOCUMENTS_SERVICE_NAME..." -ForegroundColor Green



# Build Backend Documents Docker image
Write-Host "Building Backend Documents Docker image..." -ForegroundColor Yellow
docker build -t $DOCUMENTS_DOCKER_IMAGE ./backend-documents
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Backend Documents Docker build failed!" -ForegroundColor Red
    exit 1 
}

# === Build Backend Users ===
Write-Host "Building $USERS_SERVICE_NAME..." -ForegroundColor Green



# Build Backend Users Docker image
Write-Host "Building Backend Users Docker image..." -ForegroundColor Yellow
docker build -t $USERS_DOCKER_IMAGE ./backend-users
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Backend Users Docker build failed!" -ForegroundColor Red
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
kubectl rollout restart deployment/$DOCUMENTS_SERVICE_NAME --namespace=$NAMESPACE
kubectl rollout restart deployment/$USERS_SERVICE_NAME --namespace=$NAMESPACE

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

# Wait for PostgreSQL Documents to be ready
Write-Host "Waiting for PostgreSQL Documents pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=postgres-documents --timeout=120s --namespace=$NAMESPACE

# Wait for PostgreSQL Users to be ready
Write-Host "Waiting for PostgreSQL Users pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=postgres-users --timeout=120s --namespace=$NAMESPACE

# Then wait for backend services
Write-Host "Waiting for backend-landregistry pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=120s --namespace=$NAMESPACE

Write-Host "Waiting for backend-documents pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=backend-documents --timeout=120s --namespace=$NAMESPACE

Write-Host "Waiting for backend-users pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=backend-users --timeout=120s --namespace=$NAMESPACE

# Finally wait for API Gateway
Write-Host "Waiting for API Gateway pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=120s --namespace=$NAMESPACE

Write-Host "Build and deployment completed!" -ForegroundColor Green

# === Automatic Database Port Forwarding ===
Write-Host "Starting database port forwarding..." -ForegroundColor Green

# Kill existing port forwards first (already done above)
Write-Host "Port forwards cleared, starting new ones..." -ForegroundColor Gray

Write-Host "Port forwarding postgres-landregistry: localhost:15432" -ForegroundColor Green
Start-Process -FilePath "kubectl" -ArgumentList "port-forward", "service/postgres-landregistry-service", "15432:5432", "--namespace=$NAMESPACE" -NoNewWindow

Write-Host "Port forwarding postgres-documents: localhost:15433" -ForegroundColor Green
Start-Process -FilePath "kubectl" -ArgumentList "port-forward", "service/postgres-documents-service", "15433:5433", "--namespace=$NAMESPACE" -NoNewWindow

Write-Host "Port forwarding postgres-users: localhost:15434" -ForegroundColor Green
Start-Process -FilePath "kubectl" -ArgumentList "port-forward", "service/postgres-users-service", "15434:5434", "--namespace=$NAMESPACE" -NoNewWindow

Write-Host "Database port forwarding active in console!" -ForegroundColor Green

