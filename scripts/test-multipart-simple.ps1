# Test multipart form data with PowerShell's built-in support

Write-Host "Testing multipart form data with built-in PowerShell support..." -ForegroundColor Yellow

# Generate token
try {
    $token = node "$PSScriptRoot\generate-long-token.js"
    $token = $token.Trim()
    Write-Host "Token generated successfully!" -ForegroundColor Green
} catch {
    Write-Host "Using fallback token..." -ForegroundColor Red
    $token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWQiOjEsImV4cCI6MTc1ODk4Nzk0OCwiaWF0IjoxNzU4OTAxNTQ4fQ.2hz3shbc0LVOvFhfWYTz22yVaUFAoMjcEOR4k6BcQHU"
}

# Create a simple test PDF file
$tempDir = "$env:TEMP\test-multipart"
if (!(Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force
}

$samplePdfContent = "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovRmlsdGVyIC9GbGF0ZURlY29kZQo+PgpzdHJlYW0KeJzLSM3PyckBAAAGXAJYCmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKNQplbmRvYmoKCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDQgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzUgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKCjUgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCA0IDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgMiAwIFIKPj4KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAxNDkgMDAwMDAgbiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDc0IDAwMDAwIG4gCjAwMDAwMDAxOTMgMDAwMDAgbiAKMDAwMDAwMDI1MCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjM0OQolJUVPRg=="
$testPdfPath = "$tempDir\test.pdf"
[System.IO.File]::WriteAllBytes($testPdfPath, [System.Convert]::FromBase64String($samplePdfContent))

Write-Host "Created test PDF: $testPdfPath" -ForegroundColor Green

# Try using curl instead of PowerShell's Invoke-RestMethod for multipart
$curlCommand = @"
curl -X POST "http://localhost:30081/api/land-titles" \
  -H "Authorization: Bearer $token" \
  -F "owner_name=Test User Curl" \
  -F "contact_no=09171234567" \
  -F "title_number=LT-CURL-$(Get-Random -Minimum 1000 -Maximum 9999)" \
  -F "address=123 Curl Street" \
  -F "property_location=Curl City" \
  -F "lot_number=456" \
  -F "survey_number=SV-CURL-001" \
  -F "area_size=200.5" \
  -F "classification=Commercial" \
  -F "registration_date=2024-01-15T00:00:00.000Z" \
  -F "registrar_office=Curl Registry" \
  -F "previous_title_number=LT-2023-0002" \
  -F "encumbrances=None" \
  -F "documents=@$testPdfPath" \
  -v
"@

Write-Host "`nTesting with curl..." -ForegroundColor Cyan
Write-Host "Command: $curlCommand" -ForegroundColor Gray

try {
    $result = Invoke-Expression $curlCommand
    Write-Host "Curl result:" -ForegroundColor Green
    $result | Write-Host
} catch {
    Write-Host "Curl failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Cleanup
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "`nTest completed!" -ForegroundColor Green