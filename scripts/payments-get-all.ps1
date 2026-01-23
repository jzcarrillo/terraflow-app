# Get All Payments Test
$API_GATEWAY_URL = "http://localhost:30081"

Write-Host "=== Get All Payments Test ===" -ForegroundColor Cyan

# Generate JWT token
try {
    $token = node "$PSScriptRoot\generate-long-token.js"
    $token = $token.Trim()
    $headers = @{ "Authorization" = "Bearer $token" }
    Write-Host "Token generated successfully" -ForegroundColor Green
} catch {
    $validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWQiOjEsImV4cCI6MTc1ODk4Nzk0OCwiaWF0IjoxNzU4OTAxNTQ4fQ.2hz3shbc0LVOvFhfWYTz22yVaUFAoMjcEOR4k6BcQHU"
    $headers = @{ "Authorization" = "Bearer $validToken" }
}

Write-Host "`nGetting all payments..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY_URL/api/payments" -Method GET -Headers $headers
    Write-Host "Success: Retrieved $($response.Count) payments" -ForegroundColor Green
    
    if ($response.Count -gt 0) {
        Write-Host "`nPayment List:" -ForegroundColor Gray
        $response | ForEach-Object {
            Write-Host "  ID: $($_.id) | Payment ID: $($_.payment_id) | Amount: $($_.amount) | Status: $($_.status)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Get All Payments Completed ===" -ForegroundColor Cyan