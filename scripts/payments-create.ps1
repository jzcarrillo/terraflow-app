# Create Payment Test
$API_GATEWAY_URL = "http://localhost:30081"

Write-Host "=== Create Payment Test ===" -ForegroundColor Cyan

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

# Payment data - EDIT THESE VALUES
$paymentData = @{
    land_title_id = "LT-2025-399474-1"
    payer_name = "John Doe"
    payment_method = "Credit Card"
    amount = 15000.00
    description = "Land Title Registration Fee"
    created_by = "Cashier 1"
} | ConvertTo-Json

Write-Host "`nPayment Data:" -ForegroundColor Gray
Write-Host $paymentData -ForegroundColor White

Write-Host "`nCreating payment..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY_URL/api/payments" -Method POST -Body $paymentData -ContentType "application/json" -Headers $headers
    Write-Host "Success: Payment created" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor White
    Write-Host "Payment ID: $($response.payment_id)" -ForegroundColor White
    Write-Host "Transaction ID: $($response.transaction_id)" -ForegroundColor Gray
    Write-Host "Status: $($response.status)" -ForegroundColor White
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Create Payment Completed ===" -ForegroundColor Cyan