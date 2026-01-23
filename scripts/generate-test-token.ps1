# JWT token generator with proper HMAC-SHA256 signature
$secret = "default-secret-key"

# Create header
$header = @{
    alg = "HS256"
    typ = "JWT"
} | ConvertTo-Json -Compress

# Create payload with current timestamp
$now = [int][double]::Parse((Get-Date -UFormat %s))
$exp = $now + (24 * 60 * 60)  # 24 hours from now

$payload = @{
    id = 1
    username = "testuser"
    iat = $now
    exp = $exp
} | ConvertTo-Json -Compress

# Base64 encode (URL-safe)
$headerEncoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($header)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$payloadEncoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($payload)).TrimEnd('=').Replace('+', '-').Replace('/', '_')

# Create signature using HMAC-SHA256
$stringToSign = "$headerEncoded.$payloadEncoded"
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($secret)
$signatureBytes = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($stringToSign))
$signature = [Convert]::ToBase64String($signatureBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')

$token = "$headerEncoded.$payloadEncoded.$signature"

Write-Host "Generated test token:"
Write-Host "Bearer $token"

# Update create-landtitle.ps1 with this token
$scriptPath = ".\create-landtitle.ps1"
$content = Get-Content $scriptPath -Raw
$newContent = $content -replace '"Authorization" = "Bearer [^"]*"', "`"Authorization`" = `"Bearer $token`""
Set-Content $scriptPath $newContent

Write-Host "Updated create-landtitle.ps1 with new token"