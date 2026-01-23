# Get Payment Status Test
$API_GATEWAY_URL = "http://localhost:30081"

Write-Host "=== Get Payment Status Test ===" -ForegroundColor Cyan

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

# Payment ID to check status - EDIT THIS VALUE
$paymentId = 4

Write-Host "`nGetting status for payment ID: $paymentId" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY_URL/api/payments/$paymentId/status" -Method GET -Headers $headers
    Write-Host "Success: Status retrieved" -ForegroundColor Green
    Write-Host "Payment Status: $($response.status)" -ForegroundColor White
    Write-Host "Message: $($response.message)" -ForegroundColor Gray
    
    # Status color coding
    switch ($response.status) {
        "PENDING" { Write-Host "Status Description: Payment is awaiting confirmation" -ForegroundColor Yellow }
        "PAID" { Write-Host "Status Description: Payment has been confirmed and processed" -ForegroundColor Green }
        "CANCELLED" { Write-Host "Status Description: Payment has been cancelled" -ForegroundColor Red }
        "FAILED" { Write-Host "Status Description: Payment processing failed" -ForegroundColor Red }
        default { Write-Host "Status Description: Unknown status" -ForegroundColor Gray }
    }
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Get Payment Status Completed ===" -ForegroundColor Cyan