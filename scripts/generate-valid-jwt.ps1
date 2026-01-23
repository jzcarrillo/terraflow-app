# Try both possible secrets
$secrets = @(
    "your-land-registry-secret-key",  # From .env file
    "default-secret-key"              # Fallback value
)

foreach ($secret in $secrets) {
    Write-Host "Trying secret: $secret"
    
    $secretBytes = [System.Text.Encoding]::UTF8.GetBytes($secret)
    
    # Create JWT payload with proper Unix timestamp
    $now = Get-Date
    $iat = [int][double]::Parse(($now.ToUniversalTime() - (Get-Date "1970-01-01")).TotalSeconds)
    $exp = [int][double]::Parse(($now.AddDays(1).ToUniversalTime() - (Get-Date "1970-01-01")).TotalSeconds)
    
    $payload = @{
        id = 1
        username = "testuser"
        iat = $iat
        exp = $exp
    }
    
    # Manual HMAC-SHA256 signing
    $header = '{"alg":"HS256","typ":"JWT"}'
    $payloadJson = $payload | ConvertTo-Json -Compress
    
    # Base64URL encode
    function ConvertTo-Base64Url($text) {
        if ([string]::IsNullOrEmpty($text)) { return "" }
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
        $base64 = [Convert]::ToBase64String($bytes)
        return $base64.TrimEnd('=').Replace('+', '-').Replace('/', '_')
    }
    
    $headerEncoded = ConvertTo-Base64Url $header
    $payloadEncoded = ConvertTo-Base64Url $payloadJson
    
    # Create signature using HMAC-SHA256
    $dataToSign = "$headerEncoded.$payloadEncoded"
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = $secretBytes
    $signatureBytes = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($dataToSign))
    $signature = [Convert]::ToBase64String($signatureBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    
    $jwt = "$headerEncoded.$payloadEncoded.$signature"
    
    Write-Host "Generated JWT token with secret '$secret':"
    Write-Host "Bearer $jwt"
    Write-Host ""
}