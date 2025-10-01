# Test single land title with attachments to debug the issue

Write-Host "Testing single land title with attachments..." -ForegroundColor Yellow

# Generate token
try {
    $token = node "$PSScriptRoot\generate-long-token.js"
    $token = $token.Trim()
    Write-Host "Token generated successfully!" -ForegroundColor Green
} catch {
    Write-Host "Using fallback token..." -ForegroundColor Red
    $token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWQiOjEsImV4cCI6MTc1ODk4Nzk0OCwiaWF0IjoxNzU4OTAxNTQ4fQ.2hz3shbc0LVOvFhfWYTz22yVaUFAoMjcEOR4k6BcQHU"
}

# First test without attachments (JSON)
Write-Host "`nStep 1: Testing without attachments (JSON)..." -ForegroundColor Cyan

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

$body = @{
    owner_name = "Test User"
    contact_no = "09171234567"
    title_number = "LT-TEST-$(Get-Random -Minimum 1000 -Maximum 9999)"
    address = "123 Test Street"
    property_location = "Test City"
    lot_number = 123
    survey_number = "SV-TEST-001"
    area_size = 100.5
    classification = "Residential"
    registration_date = "2024-01-15T00:00:00.000Z"
    registrar_office = "Test Registry"
    previous_title_number = "LT-2023-0001"
    encumbrances = "None"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:30081/api/land-titles" -Method POST -Headers $headers -Body $body
    Write-Host "SUCCESS: JSON request worked!" -ForegroundColor Green
    $response | ConvertTo-Json | Write-Host
} catch {
    Write-Host "FAILED: JSON request failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
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

Write-Host "`nTest completed!" -ForegroundColor Green