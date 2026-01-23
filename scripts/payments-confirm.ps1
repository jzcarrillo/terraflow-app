# Confirm Payment Test
$API_GATEWAY_URL = "http://localhost:30081"

Write-Host "=== Confirm Payment Test ===" -ForegroundColor Cyan

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

# Payment ID to confirm - EDIT THIS VALUE
$paymentId = 1

Write-Host "`nConfirming payment ID: $paymentId" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY_URL/api/payments/$paymentId/confirm" -Method PUT -Headers $headers
    Write-Host "Success: Payment confirmed" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor White
    Write-Host "Transaction ID: $($response.transaction_id)" -ForegroundColor Gray
    Write-Host "New Status: PAID" -ForegroundColor Green
    Write-Host "Note: This will trigger land title activation" -ForegroundColor Yellow
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Confirm Payment Completed ===" -ForegroundColor Cyan