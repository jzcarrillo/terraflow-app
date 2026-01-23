# Edit Payment Test
$API_GATEWAY_URL = "http://localhost:30081"

Write-Host "=== Edit Payment Test ===" -ForegroundColor Cyan

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

# Payment ID to edit - EDIT THIS VALUE
$paymentId = 2

# Updated payment data - EDIT THESE VALUES
$editData = @{
    amount = 20000.00
    payment_method = "Bank Transfer"
} | ConvertTo-Json

Write-Host "`nEditing payment ID: $paymentId" -ForegroundColor Yellow
Write-Host "Updated Data:" -ForegroundColor Gray
Write-Host $editData -ForegroundColor White

try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY_URL/api/payments/$paymentId" -Method PUT -Body $editData -ContentType "application/json" -Headers $headers
    Write-Host "Success: Payment updated" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor White
    Write-Host "Transaction ID: $($response.transaction_id)" -ForegroundColor Gray
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Edit Payment Completed ===" -ForegroundColor Cyan