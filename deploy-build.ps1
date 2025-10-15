# Define variables
$SERVICE_NAME = "backend-landregistry"
$API_SERVICE_NAME = "api-gateway"
$DOCUMENTS_SERVICE_NAME = "backend-documents"
$USERS_SERVICE_NAME = "backend-users"
$PAYMENTS_SERVICE_NAME = "backend-payments"
$RELEASE_NAME = "terraflow"
$NAMESPACE = "terraflow-app"
$PORT = 3000
$API_PORT = 8081
$DOCUMENTS_PORT = 3002
$USERS_PORT = 3001
$PAYMENTS_PORT = 3003
$DOCKER_IMAGE = "terraflow/backend-landregistry:latest"
$API_DOCKER_IMAGE = "terraflow/api-gateway:latest"
$DOCUMENTS_DOCKER_IMAGE = "terraflow/backend-documents:latest"
$USERS_DOCKER_IMAGE = "terraflow/backend-users:latest"
$PAYMENTS_DOCKER_IMAGE = "terraflow/backend-payments:latest"
$HELM_CHART = "./helm"

Write-Host "Building $SERVICE_NAME..." -ForegroundColor Green

# === Smart Docker Desktop Check and Auto-Start ===
function Test-DockerStatus {
    try {
        docker version 2>$null | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Start-DockerDesktop {
    Write-Host "Docker Desktop not running. Starting..." -ForegroundColor Yellow
    
    # Check if Docker Desktop is installed
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (-not (Test-Path $dockerPath)) {
        Write-Host "Docker Desktop not found at $dockerPath" -ForegroundColor Red
        exit 1
    }
    
    # Start Docker Desktop
    Start-Process -FilePath $dockerPath -WindowStyle Hidden
    Write-Host "Waiting for Docker Desktop to start..." -ForegroundColor Yellow
    
    # Wait for Docker to be ready (max 60 seconds)
    $timeout = 60
    $elapsed = 0
    
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds 5
        $elapsed += 5
        
        if (Test-DockerStatus) {
            Write-Host "Docker Desktop started successfully" -ForegroundColor Green
            return $true
        }
        
        Write-Host "Still waiting... ($elapsed/$timeout seconds)" -ForegroundColor Gray
    }
    
    Write-Host "Docker Desktop failed to start within $timeout seconds" -ForegroundColor Red
    return $false
}

# Check Docker status and auto-start if needed
Write-Host "Checking Docker Desktop status..." -ForegroundColor Yellow
if (-not (Test-DockerStatus)) {
    if (-not (Start-DockerDesktop)) {
        Write-Host "Cannot proceed without Docker Desktop" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Docker Desktop is running" -ForegroundColor Green
}

# === Change to backend-landregistry directory ===
Set-Location -Path "backend-landregistry"
if (-not (Test-Path "Dockerfile")) {
    Write-Host "Error: Dockerfile not found in backend-landregistry directory." -ForegroundColor Red
    exit 1
}

# === Kill existing port-forward / processes on ALL service ports ===
$ALL_PORTS = @($PORT, $API_PORT, $DOCUMENTS_PORT, $USERS_PORT, $PAYMENTS_PORT, 15432, 15433, 15434, 15435, 15672, 30081, 4005)
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

# === Clean Docker cache to prevent storage issues ===
Write-Host "Cleaning Docker cache..." -ForegroundColor Yellow
docker system prune -f
docker builder prune -f

# === Kill existing process on port ===
kubectl delete pod -l app=$SERVICE_NAME --namespace=$NAMESPACE --force --grace-period=0 2>$null

# === Build Docker image ===
Write-Host "Building Docker image..." -ForegroundColor Yellow
$buildRetries = 3
$buildAttempt = 0

while ($buildAttempt -lt $buildRetries) {
    $buildAttempt++
    Write-Host "Build attempt $buildAttempt/$buildRetries..." -ForegroundColor Gray
    
    docker build -t $DOCKER_IMAGE .
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker build successful" -ForegroundColor Green
        break
    } else {
        Write-Host "Docker build failed, attempt $buildAttempt/$buildRetries" -ForegroundColor Yellow
        if ($buildAttempt -eq $buildRetries) {
            Write-Host "Docker build failed after $buildRetries attempts!" -ForegroundColor Red
            exit 1
        }
        Start-Sleep -Seconds 10
    }
}

# === Go back to root directory ===
Set-Location -Path ".."

# === Build API Gateway ===
Write-Host "Building $API_SERVICE_NAME..." -ForegroundColor Green

# Build API Gateway Docker image
Write-Host "Building API Gateway Docker image..." -ForegroundColor Yellow
$buildRetries = 3
$buildAttempt = 0

while ($buildAttempt -lt $buildRetries) {
    $buildAttempt++
    Write-Host "API Gateway build attempt $buildAttempt/$buildRetries..." -ForegroundColor Gray
    
    docker build -t $API_DOCKER_IMAGE ./api-gateway
    if ($LASTEXITCODE -eq 0) {
        Write-Host "API Gateway Docker build successful" -ForegroundColor Green
        break
    } else {
        Write-Host "API Gateway build failed, attempt $buildAttempt/$buildRetries" -ForegroundColor Yellow
        if ($buildAttempt -eq $buildRetries) {
            Write-Host "API Gateway Docker build failed after $buildRetries attempts!" -ForegroundColor Red
            exit 1
        }
        Start-Sleep -Seconds 10
    }
}

# === Build Backend Documents ===
Write-Host "Building $DOCUMENTS_SERVICE_NAME..." -ForegroundColor Green

# Build Backend Documents Docker image
Write-Host "Building Backend Documents Docker image..." -ForegroundColor Yellow
$buildRetries = 3
$buildAttempt = 0

while ($buildAttempt -lt $buildRetries) {
    $buildAttempt++
    Write-Host "Backend Documents build attempt $buildAttempt/$buildRetries..." -ForegroundColor Gray
    
    docker build -t $DOCUMENTS_DOCKER_IMAGE ./backend-documents
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend Documents Docker build successful" -ForegroundColor Green
        break
    } else {
        Write-Host "Backend Documents build failed, attempt $buildAttempt/$buildRetries" -ForegroundColor Yellow
        if ($buildAttempt -eq $buildRetries) {
            Write-Host "Backend Documents Docker build failed after $buildRetries attempts!" -ForegroundColor Red
            exit 1
        }
        Start-Sleep -Seconds 10
    }
}

# === Build Backend Users ===
Write-Host "Building $USERS_SERVICE_NAME..." -ForegroundColor Green

# Build Backend Users Docker image
Write-Host "Building Backend Users Docker image..." -ForegroundColor Yellow
$buildRetries = 3
$buildAttempt = 0

while ($buildAttempt -lt $buildRetries) {
    $buildAttempt++
    Write-Host "Backend Users build attempt $buildAttempt/$buildRetries..." -ForegroundColor Gray
    
    docker build -t $USERS_DOCKER_IMAGE ./backend-users
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend Users Docker build successful" -ForegroundColor Green
        break
    } else {
        Write-Host "Backend Users build failed, attempt $buildAttempt/$buildRetries" -ForegroundColor Yellow
        if ($buildAttempt -eq $buildRetries) {
            Write-Host "Backend Users Docker build failed after $buildRetries attempts!" -ForegroundColor Red
            exit 1
        }
        Start-Sleep -Seconds 10
    }
}

# === Build Backend Payments ===
Write-Host "Building $PAYMENTS_SERVICE_NAME..." -ForegroundColor Green

# Build Backend Payments Docker image
Write-Host "Building Backend Payments Docker image..." -ForegroundColor Yellow
$buildRetries = 3
$buildAttempt = 0

while ($buildAttempt -lt $buildRetries) {
    $buildAttempt++
    Write-Host "Backend Payments build attempt $buildAttempt/$buildRetries..." -ForegroundColor Gray
    
    docker build -t $PAYMENTS_DOCKER_IMAGE ./backend-payments
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend Payments Docker build successful" -ForegroundColor Green
        break
    } else {
        Write-Host "Backend Payments build failed, attempt $buildAttempt/$buildRetries" -ForegroundColor Yellow
        if ($buildAttempt -eq $buildRetries) {
            Write-Host "Backend Payments Docker build failed after $buildRetries attempts!" -ForegroundColor Red
            exit 1
        }
        Start-Sleep -Seconds 10
    }
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
kubectl rollout restart deployment/$PAYMENTS_SERVICE_NAME --namespace=$NAMESPACE

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

# Wait for PostgreSQL Payments to be ready
Write-Host "Waiting for PostgreSQL Payments pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=postgres-payments --timeout=120s --namespace=$NAMESPACE

# Then wait for backend services
Write-Host "Waiting for backend-landregistry pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=backend-landregistry --timeout=120s --namespace=$NAMESPACE

Write-Host "Waiting for backend-documents pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=backend-documents --timeout=120s --namespace=$NAMESPACE

Write-Host "Waiting for backend-users pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=backend-users --timeout=120s --namespace=$NAMESPACE

Write-Host "Waiting for backend-payments pod..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=backend-payments --timeout=120s --namespace=$NAMESPACE

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

Write-Host "Port forwarding postgres-payments: localhost:15435" -ForegroundColor Green
Start-Process -FilePath "kubectl" -ArgumentList "port-forward", "service/postgres-payments-service", "15435:5435", "--namespace=$NAMESPACE" -NoNewWindow

Write-Host "Port forwarding rabbitmq-management: localhost:15672" -ForegroundColor Green
Start-Process -FilePath "kubectl" -ArgumentList "port-forward", "service/rabbitmq-management", "15672:15672", "--namespace=$NAMESPACE" -NoNewWindow

Write-Host "Port forwarding api-gateway: localhost:30081" -ForegroundColor Green
Start-Process -FilePath "kubectl" -ArgumentList "port-forward", "service/terraflow-api-gateway-service", "30081:8081", "--namespace=$NAMESPACE" -NoNewWindow

Write-Host "Database, RabbitMQ and API Gateway port forwarding active in console!" -ForegroundColor Green
Write-Host "RabbitMQ Management UI: http://localhost:15672 (admin/password)" -ForegroundColor Cyan
Write-Host "API Gateway URL: http://localhost:30081" -ForegroundColor Cyan

# === Start Frontend Application ===
Write-Host "Starting Frontend Application..." -ForegroundColor Green

# Change to frontend directory and start the application
Set-Location -Path "frontend"
if (Test-Path "package.json") {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "Starting frontend on port 4005..." -ForegroundColor Green
    Start-Process -FilePath "cmd" -ArgumentList "/c", "npm", "run", "dev" -NoNewWindow
    
    Write-Host "Frontend started successfully!" -ForegroundColor Green
    Write-Host "Frontend URL: http://localhost:4005" -ForegroundColor Cyan
} else {
    Write-Host "Warning: Frontend package.json not found" -ForegroundColor Yellow
}

# Go back to root directory
Set-Location -Path ".."