# Payment ID Validation Test
$API_GATEWAY_URL = "http://localhost:30081"

Write-Host "=== Payment ID Validation Test ===" -ForegroundColor Cyan

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

# Test Payment ID - EDIT THIS VALUE
$paymentId = "PAY-2025-17600755487841"

Write-Host "`nTesting Payment ID: $paymentId" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY_URL/api/payments/validate/id?payment_id=$paymentId" -Method GET -Headers $headers
    Write-Host "Validation Result: $($response.message)" -ForegroundColor Green
    Write-Host "Exists: $($response.exists)" -ForegroundColor White
} catch {
    Write-Host "Validation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Payment ID Validation Completed ===" -ForegroundColor Cyan