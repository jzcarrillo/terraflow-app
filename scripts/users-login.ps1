# User Login Script - EDIT CREDENTIALS BELOW
$API_GATEWAY_URL = "http://localhost:30081"

Write-Host "=== User Login & Token Generation ===" -ForegroundColor Cyan

# LOGIN CREDENTIALS - EDIT THESE VALUES
$loginData = @{
    username = "zaldyco"     # Change to existing username
    password = "carri600"     # Change to existing password
} | ConvertTo-Json

Write-Host "Login Data: $loginData" -ForegroundColor White

Write-Host "`nStep 1: Attempting user login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$API_GATEWAY_URL/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    
    Write-Host "Login Successful!" -ForegroundColor Green
    Write-Host "Generated Token: $($loginResponse.token)" -ForegroundColor White
    Write-Host "User ID: $($loginResponse.user.id)" -ForegroundColor Gray
    Write-Host "Username: $($loginResponse.user.username)" -ForegroundColor Gray
    Write-Host "Email: $($loginResponse.user.email_address)" -ForegroundColor Gray
    
} catch {
    Write-Host "Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get detailed error response
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error Details: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "Could not read error details" -ForegroundColor Red
        }
        
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "Invalid username or password" -ForegroundColor Yellow
            Write-Host "Make sure the user exists and credentials are correct" -ForegroundColor Gray
        } elseif ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "User not found" -ForegroundColor Yellow
            Write-Host "Create user first using users-create.ps1 or users-manualcreate.ps1" -ForegroundColor Gray
        }
    } else {
        Write-Host "Server error or service unavailable" -ForegroundColor Yellow
    }
}

Write-Host "`n=== User Login Completed! ===" -ForegroundColor Cyan