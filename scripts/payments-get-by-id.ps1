# Get Payment by ID Test
$API_GATEWAY_URL = "http://localhost:30081"

Write-Host "=== Get Payment by ID Test ===" -ForegroundColor Cyan

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

# Payment ID to retrieve - EDIT THIS VALUE
$paymentId = 2

Write-Host "`nGetting payment ID: $paymentId" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY_URL/api/payments/$paymentId" -Method GET -Headers $headers
    Write-Host "Success: Payment retrieved" -ForegroundColor Green
    
    Write-Host "`nPayment Details:" -ForegroundColor Gray
    Write-Host "  ID: $($response.id)" -ForegroundColor White
    Write-Host "  Payment ID: $($response.payment_id)" -ForegroundColor White
    Write-Host "  Reference ID: $($response.reference_id)" -ForegroundColor White
    Write-Host "  Amount: $($response.amount)" -ForegroundColor White
    Write-Host "  Status: $($response.status)" -ForegroundColor White
    Write-Host "  Method: $($response.payment_method)" -ForegroundColor White
    Write-Host "  Payer: $($response.payer_name)" -ForegroundColor White
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Get Payment by ID Completed ===" -ForegroundColor Cyan