Write-Host "Creating proper Fabric certificates..." -ForegroundColor Yellow

$ordererPath = "C:\tmp\fabric-orderer"
$peerPath = "C:\tmp\fabric-peer"

# Create orderer MSP structure
New-Item -ItemType Directory -Force -Path "$ordererPath\msp\signcerts"
New-Item -ItemType Directory -Force -Path "$ordererPath\msp\keystore"
New-Item -ItemType Directory -Force -Path "$ordererPath\msp\cacerts"
New-Item -ItemType Directory -Force -Path "$ordererPath\msp\tlscacerts"

# Create peer MSP structure
New-Item -ItemType Directory -Force -Path "$peerPath\msp\signcerts"
New-Item -ItemType Directory -Force -Path "$peerPath\msp\keystore"
New-Item -ItemType Directory -Force -Path "$peerPath\msp\cacerts"
New-Item -ItemType Directory -Force -Path "$peerPath\msp\tlscacerts"

# Orderer certificates
@"
-----BEGIN CERTIFICATE-----
MIICGjCCAcCgAwIBAgIRANuOnVN+yd/BGyoX7ioEklQwCgYIKoZIzj0EAwIwczEL
MAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG
cmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh
Lm9yZzEuZXhhbXBsZS5jb20wHhcNMjMwMTAxMDAwMDAwWhcNMzMwMTAxMDAwMDAw
WjBbMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMN
U2FuIEZyYW5jaXNjbzEfMB0GA1UEAwwWQWRtaW5Ab3JnMS5leGFtcGxlLmNvbTBZ
MBMGByqGSM49AgEGCCqGSM49AwEHA0IABJGSxFZE7sop6UmedrvfX3BCDUEJIu84
RNlJ9gnFHyQqHWwpIABdtN9cHcKhjeMJiUfhc0KCjX2E2Nk7DHSGrD2jTTBLMA4G
A1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMCsGA1UdIwQkMCKAIBmrZau7BIB9
rRLkwKmqpmSecIaOOr0CF6Mi2J5H4aauMAoGCCqGSM49BAMCA0gAMEUCIQC4sKQ4
CEgqbTxlRQkILG6+CKAXnchZmGOAui9BdqO+wgIgEoQxb8JHA28qJINp+3YE2mxH
OnTg86BsQQ9B5aV9VuY=
-----END CERTIFICATE-----
"@ | Out-File -FilePath "$ordererPath\msp\signcerts\orderer.pem" -Encoding ASCII

@"
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg7S8j13OmzlB2ynBf
VK67l9t0+6flzANBqhHHFvMlKAehRANCAASRksRWRO7KKelJnna7319wQg1BCSLv
OETZSfYJxR8kKh1sKSAAXbTfXB3CoY3jCYlH4XNCgo19hNjZOwx0hqw9
-----END PRIVATE KEY-----
"@ | Out-File -FilePath "$ordererPath\msp\keystore\priv_sk" -Encoding ASCII

@"
-----BEGIN CERTIFICATE-----
MIICQzCCAemgAwIBAgIQMAa8FZI5On3gBiNJtVA6aTAKBggqhkjOPQQDAjBzMQsw
CQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMNU2FuIEZy
YW5jaXNjbzEZMBcGA1UEChMQb3JnMS5leGFtcGxlLmNvbTEcMBoGA1UEAxMTY2Eu
b3JnMS5leGFtcGxlLmNvbTAeFw0yMzAxMDEwMDAwMDBaFw0zMzAxMDEwMDAwMDBa
MHMxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRYwFAYDVQQHEw1T
YW4gRnJhbmNpc2NvMRkwFwYDVQQKExBvcmcxLmV4YW1wbGUuY29tMRwwGgYDVQQD
ExNjYS5vcmcxLmV4YW1wbGUuY29tMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE
+C9zxMjn7+8B5zOJxH7DAJOjTzqClRFAJqC+MY48FqTh2+BXsVpBmQQGqEdzuKuP
iQq9W3Ry9JzxVAqg4S2upKNFMEMwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQI
MAYBAf8CAQEwHQYDVR0OBBYEFBmrZau7BIB9rRLkwKmqpmSecIaOMAoGCCqGSM49
BAMCA0gAMEUCIQDKoLkqhvaTJNw8+kVVkQdu0b2SU9ey7ES2KsYZNSp+DgIgPzuI
4aJZkQZjQNnn8XFy7VF4E4OBbVo6Y4KmT3JKiVo=
-----END CERTIFICATE-----
"@ | Out-File -FilePath "$ordererPath\msp\cacerts\ca.pem" -Encoding ASCII

# Create genesis block
"GENESIS_BLOCK_PLACEHOLDER" | Out-File -FilePath "$ordererPath\genesis.block" -Encoding ASCII

Write-Host "Certificates created successfully!" -ForegroundColor Green