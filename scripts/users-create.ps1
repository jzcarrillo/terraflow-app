# Test User Service - Validation and Creation Flow
$API_GATEWAY_URL = "http://localhost:30081"

Write-Host "=== Testing User Service - Creating 10 New Users ===" -ForegroundColor Cyan

# Sample names for test users
$firstNames = @("John", "Jane", "Mike", "Sarah", "David", "Lisa", "Mark", "Anna", "Paul", "Emma")
$lastNames = @("Doe", "Smith", "Johnson", "Brown", "Davis", "Wilson", "Garcia", "Miller", "Taylor", "Anderson")
$locations = @("Manila", "Cebu", "Davao", "Quezon City", "Makati", "Taguig", "Pasig", "Caloocan", "Las Pinas", "Antipolo")

# Generate JWT token for authentication
Write-Host "`n0. Generating JWT token for authentication..." -ForegroundColor Yellow

try {
    # Generate token with 10-year expiry using Node.js script
    $token = node "$PSScriptRoot\generate-long-token.js"
    $token = $token.Trim() # Remove any whitespace
    $headers = @{ "Authorization" = "Bearer $token" }
    Write-Host "✅ Long-lived JWT token generated successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Token generation failed, using fallback token" -ForegroundColor Yellow
    $validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWQiOjEsImV4cCI6MTc1ODk4Nzk0OCwiaWF0IjoxNzU4OTAxNTQ4fQ.2hz3shbc0LVOvFhfWYTz22yVaUFAoMjcEOR4k6BcQHU"
    $headers = @{ "Authorization" = "Bearer $validToken" }
}

# Create 10 users
for ($i = 1; $i -le 10; $i++) {
    Write-Host "`n=== Creating User $i/10 ===" -ForegroundColor Yellow
    
    # Generate random user data
    $randomId = Get-Random -Maximum 99999
    $testUser = @{
        email_address = "user$randomId@example.com"
        username = "user$randomId"
        password = "password123"
        confirm_password = "password123"
        first_name = $firstNames[(Get-Random -Maximum $firstNames.Length)]
        last_name = $lastNames[(Get-Random -Maximum $lastNames.Length)]
        location = $locations[(Get-Random -Maximum $locations.Length)] + ", Philippines"
    } | ConvertTo-Json
    
    Write-Host "User Data: $testUser" -ForegroundColor White
    
    # Step 1: Validate user data
    Write-Host "Step 1: Validating user data..." -ForegroundColor Gray
    $userObj = $testUser | ConvertFrom-Json
    $validateUrl = "$API_GATEWAY_URL/api/users/validate?username=$($userObj.username)&email_address=$($userObj.email_address)"
    
    try {
        $validateResponse = Invoke-RestMethod -Uri $validateUrl -Method GET -ContentType "application/json"
        Write-Host "Validation Passed: $($validateResponse.message)" -ForegroundColor Green
    } catch {
        Write-Host "Validation Failed: $($_.Exception.Message)" -ForegroundColor Red
        continue
    }
    
    # Step 2: Create user
    Write-Host "Step 2: Creating user..." -ForegroundColor Gray
    try {
        $createResponse = Invoke-RestMethod -Uri "$API_GATEWAY_URL/api/users" -Method POST -Body $testUser -ContentType "application/json" -Headers $headers
        Write-Host "User Creation Initiated: $($createResponse.message)" -ForegroundColor Green
        Write-Host "Transaction ID: $($createResponse.transaction_id)" -ForegroundColor White
    } catch {
        Write-Host "User Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Wait between user creations
    Start-Sleep -Seconds 2
}

Write-Host "`n=== All 10 Users Created! ===" -ForegroundColor Cyan