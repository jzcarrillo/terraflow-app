# Manual User Creation Script
$API_GATEWAY_URL = "http://localhost:30081"

Write-Host "=== Manual User Creation ===" -ForegroundColor Cyan

# Manual user data - EDIT THESE VALUES
$userData = @{
    email_address = "jzcarrillo@gmail.com"
    username = "jzcarrillo"
    password = "carri600"
    confirm_password = "carri600"
    first_name = "John Christopher"
    last_name = "Carrillo"
    location = "Manila, Philippines"
    role = "ADMIN"
} | ConvertTo-Json

Write-Host "User Data to Create:" -ForegroundColor White
Write-Host $userData -ForegroundColor Gray

# Generate JWT token for authentication
Write-Host "`nStep 1: Generating JWT token..." -ForegroundColor Yellow
try {
    # Generate token with 10-year expiry using Node.js script
    $token = node "$PSScriptRoot\generate-long-token.js"
    $token = $token.Trim() # Remove any whitespace
    $headers = @{ "Authorization" = "Bearer $token" }
    Write-Host "Long-lived JWT token generated successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to generate token, using fallback..." -ForegroundColor Red
    $validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWQiOjEsImV4cCI6MTc1ODk4Nzk0OCwiaWF0IjoxNzU4OTAxNTQ4fQ.2hz3shbc0LVOvFhfWYTz22yVaUFAoMjcEOR4k6BcQHU"
    $headers = @{ "Authorization" = "Bearer $validToken" }
}

# Step 2: Validate user data
Write-Host "`nStep 2: Validating user data..." -ForegroundColor Yellow
$userObj = $userData | ConvertFrom-Json
$validateUrl = "$API_GATEWAY_URL/api/users/validate?username=$($userObj.username)&email_address=$($userObj.email_address)"

try {
    $validateResponse = Invoke-RestMethod -Uri $validateUrl -Method GET -ContentType "application/json"
    Write-Host "Validation Passed: $($validateResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "Validation Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "User may already exist or validation service is unavailable" -ForegroundColor Yellow
    exit 1
}

# Step 3: Create user
Write-Host "`nStep 3: Creating user..." -ForegroundColor Yellow
try {
    $createResponse = Invoke-RestMethod -Uri "$API_GATEWAY_URL/api/users" -Method POST -Body $userData -ContentType "application/json" -Headers $headers
    
    Write-Host "User Creation Successful!" -ForegroundColor Green
    Write-Host "Message: $($createResponse.message)" -ForegroundColor White
    Write-Host "Transaction ID: $($createResponse.transaction_id)" -ForegroundColor Gray
    Write-Host "Status: $($createResponse.status)" -ForegroundColor Gray
    
    Write-Host "`nWaiting 3 seconds for user processing..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    Write-Host "User should now be available in the system!" -ForegroundColor Cyan
    
} catch {
    Write-Host "User Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error Details: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "Could not read error details" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Manual User Creation Completed! ===" -ForegroundColor Cyan