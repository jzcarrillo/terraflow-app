# Fix Docker Desktop Engine Stop Issue

Write-Host "=== FIXING DOCKER ENGINE STOP ISSUE ===" -ForegroundColor Cyan

Write-Host "Step 1: Force closing Docker Desktop..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*docker*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host "Step 2: Shutting down WSL completely..." -ForegroundColor Yellow
wsl --shutdown
Start-Sleep -Seconds 5

Write-Host "Step 3: Killing any remaining WSL processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*wsl*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host "Step 4: Restarting WSL service..." -ForegroundColor Yellow
try {
    Restart-Service LxssManager -Force
    Write-Host "WSL service restarted" -ForegroundColor Green
} catch {
    Write-Host "Could not restart WSL service - may need admin rights" -ForegroundColor Red
}

Start-Sleep -Seconds 5

Write-Host "Step 5: Testing WSL..." -ForegroundColor Yellow
wsl --status

Write-Host "Step 6: Starting Docker Desktop..." -ForegroundColor Yellow
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

Write-Host "=== WAITING FOR DOCKER TO START ===" -ForegroundColor Green
Write-Host "Please wait 60-90 seconds for Docker Desktop to fully initialize..." -ForegroundColor Yellow
Write-Host "Watch the Docker Desktop window - it should show 'Engine running' when ready" -ForegroundColor Yellow

# Wait and check Docker status
for ($i = 1; $i -le 12; $i++) {
    Start-Sleep -Seconds 10
    Write-Host "Checking Docker status... ($i/12)" -ForegroundColor Cyan
    
    try {
        $dockerStatus = docker version --format "{{.Server.Version}}" 2>$null
        if ($dockerStatus) {
            Write-Host "✅ Docker Engine is running! Version: $dockerStatus" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "⏳ Docker still starting..." -ForegroundColor Yellow
    }
}

Write-Host "=== DOCKER FIX COMPLETED ===" -ForegroundColor Green