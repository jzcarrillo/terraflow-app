# Cancel Payment Test
$API_GATEWAY_URL = "http://localhost:30081"

Write-Host "=== Cancel Payment Test ===" -ForegroundColor Cyan

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

# Payment ID to cancel - EDIT THIS VALUE
$paymentId = 1

Write-Host "`nCancelling payment ID: $paymentId" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY_URL/api/payments/$paymentId/cancel" -Method PUT -Headers $headers
    Write-Host "Success: Payment cancelled" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor White
    Write-Host "Transaction ID: $($response.transaction_id)" -ForegroundColor Gray
    Write-Host "New Status: CANCELLED" -ForegroundColor Yellow
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Cancel Payment Completed ===" -ForegroundColor Cyan