# Create 50 Land Titles with Attachments Script

# Generate long-lived JWT token
Write-Host "Step 1: Generating long-lived JWT token..." -ForegroundColor Yellow

try {
    # Generate token with 10-year expiry using Node.js script
    $token = node "$PSScriptRoot\generate-long-token.js"
    $token = $token.Trim() # Remove any whitespace
    Write-Host "Long-lived JWT token generated successfully!" -ForegroundColor Green
} catch {
    Write-Host "Failed to generate JWT token, using fallback..." -ForegroundColor Red
    $token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2MDY3NTAwNiwiZXhwIjoxNzYwNzYxNDA2fQ.U_97iZC2tdG6tf0h_t7X_XtdSgos-aA5LD4iCbz64gU"
}

# Create sample PDF content (base64 encoded)
$samplePdfContent = "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovRmlsdGVyIC9GbGF0ZURlY29kZQo+PgpzdHJlYW0KeJzLSM3PyckBAAAGXAJYCmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKNQplbmRvYmoKCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDQgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzUgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKCjUgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCA0IDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgMiAwIFIKPj4KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAxNDkgMDAwMDAgbiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDc0IDAwMDAwIG4gCjAwMDAwMDAxOTMgMDAwMDAgbiAKMDAwMDAwMDI1MCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjM0OQolJUVPRg=="

# Create temporary test files directory
$tempDir = "$env:TEMP\terraflow-batch-test"
if (!(Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force
}

Write-Host "Step 2: Created temp directory: $tempDir" -ForegroundColor Green

# Sample data arrays for variety
$owners = @("Juan Dela Cruz", "Maria Santos", "Jose Rizal", "Ana Garcia", "Pedro Martinez", "Carmen Lopez", "Miguel Torres", "Sofia Reyes", "Carlos Mendoza", "Isabella Cruz")
$cities = @("Manila", "Quezon City", "Makati", "Pasig", "Taguig", "Mandaluyong", "San Juan", "Pasay", "Paranaque", "Las Pinas")
$classifications = @("Residential", "Commercial", "Industrial", "Agricultural")
$registrars = @("Registry of Deeds - Manila", "Registry of Deeds - Quezon City", "Registry of Deeds - Makati", "Registry of Deeds - Pasig")

Write-Host "`nStep 3: === CREATING 50 LAND TITLES WITH ATTACHMENTS ===" -ForegroundColor Cyan

$successCount = 0
$failCount = 0
$usedTitleNumbers = @() # Track used title numbers to avoid duplicates

for ($i = 1; $i -le 2; $i++) {
    try {
        # Generate unique data for each land title
        $owner = $owners[(Get-Random -Maximum $owners.Count)]
        $city = $cities[(Get-Random -Maximum $cities.Count)]
        $classification = $classifications[(Get-Random -Maximum $classifications.Count)]
        $registrar = $registrars[(Get-Random -Maximum $registrars.Count)]
        
        # Generate unique title number
        do {
            $titleNumber = "LT-2025-$(Get-Random -Minimum 100000 -Maximum 999999)-$i"
        } while ($usedTitleNumbers -contains $titleNumber)
        $usedTitleNumbers += $titleNumber
        
        $lotNumber = Get-Random -Minimum 1 -Maximum 9999
        $surveyNumber = "SV-$(Get-Random -Minimum 1000 -Maximum 9999)"
        $areaSize = [Math]::Round((Get-Random -Minimum 50 -Maximum 5000) + (Get-Random -Minimum 0 -Maximum 1) * 0.99, 2)
        $contactNo = "091$(Get-Random -Minimum 10000000 -Maximum 99999999)"
        
        # Create sample documents for this land title
        $titleDeedPath = "$tempDir\title_deed_$i.pdf"
        $surveyPlanPath = "$tempDir\survey_plan_$i.pdf"
        $taxDeclarationPath = "$tempDir\tax_declaration_$i.pdf"
        
        [System.IO.File]::WriteAllBytes($titleDeedPath, [System.Convert]::FromBase64String($samplePdfContent))
        [System.IO.File]::WriteAllBytes($surveyPlanPath, [System.Convert]::FromBase64String($samplePdfContent))
        [System.IO.File]::WriteAllBytes($taxDeclarationPath, [System.Convert]::FromBase64String($samplePdfContent))
        
        # Land title data
        $landTitleData = @{
            owner_name = "$owner $i"
            contact_no = $contactNo
            email_address = "$($owner.Replace(' ', '').ToLower())$i@example.com"
            title_number = $titleNumber
            address = "$(Get-Random -Minimum 1 -Maximum 999) Main Street, $city"
            property_location = $city
            lot_number = $lotNumber
            survey_number = $surveyNumber
            area_size = $areaSize
            classification = $classification
            registration_date = "2024-01-15T00:00:00.000Z"
            registrar_office = $registrar
            previous_title_number = "LT-2023-$(Get-Random -Minimum 1000 -Maximum 9999)"
            encumbrances = "None"
        }
        
        # File attachments
        $files = @(
            @{ path = $titleDeedPath; fileName = "title_deed_$i.pdf" }
            @{ path = $surveyPlanPath; fileName = "survey_plan_$i.pdf" }
            @{ path = $taxDeclarationPath; fileName = "tax_declaration_$i.pdf" }
        )
        
        Write-Host "Creating land title $i/50: $titleNumber (with 3 attachments)" -ForegroundColor Yellow
        
        # Use curl for proper multipart format (same as working test)
        $curlArgs = @(
            "-X", "POST",
            "http://localhost:30081/api/land-titles",
            "-H", "Authorization: Bearer $token"
        )
        
        # Add form fields
        foreach ($key in $landTitleData.Keys) {
            $value = $landTitleData[$key]
            $curlArgs += "-F"
            $curlArgs += "$key=$value"
        }
        
        # Add files
        foreach ($file in $files) {
            $curlArgs += "-F"
            $curlArgs += "attachments=@$($file.path)"
        }
        
        # Execute curl
        $result = & curl.exe $curlArgs 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            $responseObj = $result | ConvertFrom-Json
        } else {
            throw "Curl failed with exit code: $LASTEXITCODE"
        }
        
        Write-Host "SUCCESS: $titleNumber created with attachments" -ForegroundColor Green
        $successCount++
        
        # Small delay to avoid overwhelming the system
        Start-Sleep -Milliseconds 500
        
    } catch {
        Write-Host "FAILED: Land title $i - $($_.Exception.Message)" -ForegroundColor Red
        
        # Try to get detailed error response
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                Write-Host "Error Details: $responseBody" -ForegroundColor Red
            } catch {
                Write-Host "Could not read error details" -ForegroundColor Red
            }
        }
        
        $failCount++
    }
}

# Cleanup temporary files
Write-Host "`nStep 4: Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`n=== BATCH CREATION COMPLETED ===" -ForegroundColor Cyan
Write-Host "SUCCESS: $successCount land titles created with attachments" -ForegroundColor Green
Write-Host "FAILED: $failCount land titles failed" -ForegroundColor Red
Write-Host "TOTAL: 50 attempts" -ForegroundColor White

if ($successCount -gt 0) {
    Write-Host "`nWaiting 5 seconds for processing..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    Write-Host "You can now test GET endpoints to see all the new land titles with documents!" -ForegroundColor Cyan
}