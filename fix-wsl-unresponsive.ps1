# Fix WSL Unresponsive Issue - Nuclear Option

Write-Host "=== FIXING WSL UNRESPONSIVE ISSUE ===" -ForegroundColor Red

Write-Host "Step 1: Force killing ALL Docker and WSL processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*docker*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process | Where-Object {$_.ProcessName -like "*wsl*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process | Where-Object {$_.ProcessName -like "*vmcompute*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 5

Write-Host "Step 2: Stopping WSL and Hyper-V services..." -ForegroundColor Yellow
try {
    Stop-Service LxssManager -Force -ErrorAction SilentlyContinue
    Stop-Service vmcompute -Force -ErrorAction SilentlyContinue
    Stop-Service HvHost -Force -ErrorAction SilentlyContinue
    Write-Host "Services stopped" -ForegroundColor Green
} catch {
    Write-Host "Some services could not be stopped - continuing..." -ForegroundColor Yellow
}

Start-Sleep -Seconds 5

Write-Host "Step 3: Starting services back up..." -ForegroundColor Yellow
try {
    Start-Service vmcompute -ErrorAction SilentlyContinue
    Start-Service LxssManager -ErrorAction SilentlyContinue
    Write-Host "Services started" -ForegroundColor Green
} catch {
    Write-Host "Error starting services - may need reboot" -ForegroundColor Red
}

Start-Sleep -Seconds 10

Write-Host "Step 4: Testing WSL..." -ForegroundColor Yellow
try {
    $wslTest = wsl --status 2>&1
    Write-Host "WSL Status: $wslTest" -ForegroundColor Cyan
} catch {
    Write-Host "WSL still unresponsive" -ForegroundColor Red
}

Write-Host "Step 5: Attempting to start Docker Desktop..." -ForegroundColor Yellow
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

Write-Host "=== RESULTS ===" -ForegroundColor Cyan
Write-Host "If Docker Desktop still shows WSL errors:" -ForegroundColor Yellow
Write-Host "1. Close Docker Desktop" -ForegroundColor White
Write-Host "2. RESTART YOUR COMPUTER" -ForegroundColor Red
Write-Host "3. Start Docker Desktop after reboot" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "WSL timeout issues often require a full system restart" -ForegroundColor Yellow