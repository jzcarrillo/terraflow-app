# Test script for GET Land Title by ID

param(
    [Parameter(Mandatory=$false)]
    [int]$Id = 100
)

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

Write-Host "`n=== GET LAND TITLE BY ID TEST ===" -ForegroundColor Cyan
Write-Host "Testing with ID: $Id" -ForegroundColor Yellow

# Test: Get Land Title by ID
Write-Host "`nTesting GET Land Title by ID ($Id)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:30081/api/land-titles/$Id" -Method GET -Headers $headers
    Write-Host "SUCCESS: GET Land Title by ID" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor White
    Write-Host "Source: $($response.source)" -ForegroundColor White
    
    if ($response.data) {
        Write-Host "`nLand Title Details:" -ForegroundColor Yellow
        Write-Host "  ID: $($response.data.id)" -ForegroundColor White
        Write-Host "  Title Number: $($response.data.title_number)" -ForegroundColor White
        Write-Host "  Owner: $($response.data.owner_name)" -ForegroundColor White
        Write-Host "  Contact: $($response.data.contact_no)" -ForegroundColor White
        Write-Host "  Address: $($response.data.address)" -ForegroundColor White
        Write-Host "  Property Location: $($response.data.property_location)" -ForegroundColor White
        Write-Host "  Area Size: $($response.data.area_size)" -ForegroundColor White
        Write-Host "  Classification: $($response.data.classification)" -ForegroundColor White
        Write-Host "  Status: $($response.data.status)" -ForegroundColor White
        Write-Host "  Created: $($response.data.created_at)" -ForegroundColor White
    }
    
} catch {
    Write-Host "FAILED: GET Land Title by ID" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*404*") {
        Write-Host "Land title with ID $Id not found." -ForegroundColor Yellow
    }
}

# Test caching (call again to see if cached)
Write-Host "`nTesting Redis Caching (calling same ID again)..." -ForegroundColor Yellow
try {
    $cachedResponse = Invoke-RestMethod -Uri "http://localhost:30081/api/land-titles/$Id" -Method GET -Headers $headers
    Write-Host "SUCCESS: GET Land Title by ID (Second Call)" -ForegroundColor Green
    Write-Host "Message: $($cachedResponse.message)" -ForegroundColor White
    Write-Host "Source: $($cachedResponse.source)" -ForegroundColor White
    
    if ($cachedResponse.source -eq "redis") {
        Write-Host "CACHE HIT! Data served from Redis" -ForegroundColor Magenta
    } else {
        Write-Host "CACHE MISS! Data served from Database" -ForegroundColor Blue
    }
} catch {
    Write-Host "FAILED: GET Land Title by ID (Cached)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TEST COMPLETED ===" -ForegroundColor Cyan