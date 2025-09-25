# Simple JWT token generator for testing
$secret = "your-land-registry-secret-key"

# Create header
$header = @{
    alg = "HS256"
    typ = "JWT"
} | ConvertTo-Json -Compress

# Create payload
$payload = @{
    id = 1
    username = "testuser"
    iat = [int][double]::Parse((Get-Date -UFormat %s))
    exp = [int][double]::Parse((Get-Date).AddHours(24).ToString("yyyyMMddHHmmss"))
} | ConvertTo-Json -Compress

# Base64 encode
$headerEncoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($header)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$payloadEncoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($payload)).TrimEnd('=').Replace('+', '-').Replace('/', '_')

# For testing, use a simple signature
$signature = "test-signature"

$token = "$headerEncoded.$payloadEncoded.$signature"

Write-Host "Generated test token:"
Write-Host "Bearer $token"

# Update create-landtitle.ps1 with this token
$scriptPath = ".\create-landtitle.ps1"
$content = Get-Content $scriptPath -Raw
$newContent = $content -replace 'Authorization" = "Bearer [^"]*"', "Authorization`" = `"Bearer $token`""
Set-Content $scriptPath $newContent

Write-Host "Updated create-landtitle.ps1 with new token"