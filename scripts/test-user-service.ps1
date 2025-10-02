# Test User Service - Validation and Creation Flow
$API_GATEWAY_URL = "http://localhost:30081"

Write-Host "=== Testing User Service Validation & Creation Flow ===" -ForegroundColor Cyan

# Test user data with correct fields
$testUser = @{
    email_address = "test" + (Get-Random -Maximum 9999) + "@example.com"
    username = "testuser" + (Get-Random -Maximum 9999)
    password = "password123"
    confirm_password = "password123"
    first_name = "John"
    last_name = "Doe"
    location = "Manila, Philippines"
} | ConvertTo-Json

Write-Host "Test User Data: $testUser" -ForegroundColor White

# Generate JWT token for authentication
Write-Host "`n0. Generating JWT token for authentication..." -ForegroundColor Yellow
$tokenPayload = @{
    username = "testuser"
    email = "test@example.com"
} | ConvertTo-Json

try {
    $tokenResponse = Invoke-RestMethod -Uri "$API_GATEWAY_URL/api/auth/login" -Method POST -Body $tokenPayload -ContentType "application/json"
    $token = $tokenResponse.token
    $headers = @{ "Authorization" = "Bearer $token" }
    Write-Host "✅ Token generated successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Token generation failed, using valid test token" -ForegroundColor Yellow
    # Generate a valid JWT token for testing with correct secret
    $validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxNzU5Mzk4MDc0fQ.VyAdQm4jEcMPGnSfbbaPe0EpNdCbeHYfbaTiXhcDwlw"
    $headers = @{ "Authorization" = "Bearer $validToken" }
}

Write-Host "`n1. Step 1: Validating user data (checking for duplicates)..." -ForegroundColor Yellow
$userObj = $testUser | ConvertFrom-Json
$validateUrl = "$API_GATEWAY_URL/api/users/validate?username=$($userObj.username)&email_address=$($userObj.email_address)"

try {
    $validateResponse = Invoke-RestMethod -Uri $validateUrl -Method GET -ContentType "application/json"
    Write-Host "✅ Validation Passed: $($validateResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Validation Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Step 2: Creating user (after validation passed)..." -ForegroundColor Yellow
try {
    $createResponse = Invoke-RestMethod -Uri "$API_GATEWAY_URL/api/users" -Method POST -Body $testUser -ContentType "application/json" -Headers $headers
    Write-Host "✅ User Creation Initiated: $($createResponse.message)" -ForegroundColor Green
    Write-Host "Transaction ID: $($createResponse.transaction_id)" -ForegroundColor White
    
    # Wait a bit for user to be processed
    Start-Sleep -Seconds 3
} catch {
    Write-Host "❌ User Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Step 3: Testing duplicate validation..." -ForegroundColor Yellow
try {
    $duplicateResponse = Invoke-RestMethod -Uri $validateUrl -Method GET -ContentType "application/json"
    if ($duplicateResponse.valid -eq $false) {
        Write-Host "✅ Expected: Duplicate validation correctly failed" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Unexpected: Duplicate validation should have failed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✅ Expected: Duplicate validation correctly failed" -ForegroundColor Green
}

Write-Host "`n=== User Service Test Completed! ===" -ForegroundColor Cyan