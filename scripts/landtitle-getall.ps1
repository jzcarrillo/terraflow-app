# Test script for GET All Land Titles

# Generate fresh token first
Write-Host "Generating fresh JWT token..." -ForegroundColor Yellow
& .\generate-test-token.ps1

# Get the token from create-landtitle.ps1 (updated by token generator)
$content = Get-Content ".\create-landtitle.ps1" -Raw
$tokenMatch = $content -match '"Authorization" = "Bearer ([^"]*)"'
if ($tokenMatch) {
    $token = $matches[1]
    Write-Host "Using token: $($token.Substring(0,20))..." -ForegroundColor Green
} else {
    Write-Host "Failed to extract token!" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Write-Host "`n=== GET ALL LAND TITLES TEST ===" -ForegroundColor Cyan

# Test: Get All Land Titles
Write-Host "`nTesting GET All Land Titles..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:30081/api/land-titles" -Method GET -Headers $headers
    Write-Host "SUCCESS: GET All Land Titles" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor White
    Write-Host "Source: $($response.source)" -ForegroundColor White
    Write-Host "Count: $($response.data.Count)" -ForegroundColor White
    
    if ($response.data.Count -gt 0) {
        Write-Host "`nAll records:" -ForegroundColor Yellow
        for ($i = 0; $i -lt [Math]::Min(50, $response.data.Count); $i++) {
            $record = $response.data[$i]
            Write-Host "  ID: $($record.id) | Title: $($record.title_number) | Owner: $($record.owner_name)" -ForegroundColor White
        }
    } else {
        Write-Host "No land titles found in database." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "FAILED: GET All Land Titles" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test caching (call again to see if cached)
Write-Host "`nTesting Redis Caching (calling again)..." -ForegroundColor Yellow
try {
    $cachedResponse = Invoke-RestMethod -Uri "http://localhost:30081/api/land-titles" -Method GET -Headers $headers
    Write-Host "SUCCESS: GET All Land Titles (Second Call)" -ForegroundColor Green
    Write-Host "Message: $($cachedResponse.message)" -ForegroundColor White
    Write-Host "Source: $($cachedResponse.source)" -ForegroundColor White
    
    if ($cachedResponse.source -eq "redis") {
        Write-Host "CACHE HIT! Data served from Redis" -ForegroundColor Magenta
    } else {
        Write-Host "CACHE MISS! Data served from Database" -ForegroundColor Blue
    }
} catch {
    Write-Host "FAILED: GET All Land Titles (Cached)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TEST COMPLETED ===" -ForegroundColor Cyan