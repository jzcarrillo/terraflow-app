# Fix Docker Desktop WSL Issue Script

Write-Host "=== FIXING DOCKER DESKTOP WSL ISSUE ===" -ForegroundColor Cyan

Write-Host "Step 1: Stopping Docker Desktop..." -ForegroundColor Yellow
try {
    Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
    Write-Host "Docker Desktop stopped" -ForegroundColor Green
} catch {
    Write-Host "Docker Desktop was not running" -ForegroundColor Green
}

Write-Host "Step 2: Restarting WSL..." -ForegroundColor Yellow
wsl --shutdown
Start-Sleep -Seconds 5

Write-Host "Step 3: Starting WSL..." -ForegroundColor Yellow
wsl --status

Write-Host "Step 4: Updating WSL..." -ForegroundColor Yellow
wsl --update

Write-Host "Step 5: Setting WSL version to 2..." -ForegroundColor Yellow
wsl --set-default-version 2

Write-Host "Step 6: Listing WSL distributions..." -ForegroundColor Yellow
wsl --list --verbose

Write-Host "Step 7: Starting Docker Desktop..." -ForegroundColor Yellow
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

Write-Host "=== DOCKER FIX COMPLETED ===" -ForegroundColor Green
Write-Host "Wait 30-60 seconds for Docker Desktop to fully start" -ForegroundColor Yellow
Write-Host "Then check if Docker Desktop is running properly" -ForegroundColor Yellow