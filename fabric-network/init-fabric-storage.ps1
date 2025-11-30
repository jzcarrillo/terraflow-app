Write-Host "Initializing Fabric storage..." -ForegroundColor Yellow

# Create required directories and files
$ordererPath = "C:\tmp\fabric-orderer"
$peerPath = "C:\tmp\fabric-peer"

# Create orderer structure
New-Item -ItemType Directory -Force -Path "$ordererPath\msp\keystore"
New-Item -ItemType Directory -Force -Path "$ordererPath\msp\signcerts"
New-Item -ItemType Directory -Force -Path "$ordererPath\msp\cacerts"
New-Item -ItemType Directory -Force -Path "$ordererPath\msp\tlscacerts"

# Create peer structure  
New-Item -ItemType Directory -Force -Path "$peerPath\msp\keystore"
New-Item -ItemType Directory -Force -Path "$peerPath\msp\signcerts"
New-Item -ItemType Directory -Force -Path "$peerPath\msp\cacerts"
New-Item -ItemType Directory -Force -Path "$peerPath\msp\tlscacerts"

# Create mock certificates and keys
"MOCK_ORDERER_CERT" | Out-File -FilePath "$ordererPath\msp\signcerts\cert.pem" -Encoding ASCII
"MOCK_ORDERER_KEY" | Out-File -FilePath "$ordererPath\msp\keystore\key.pem" -Encoding ASCII
"MOCK_CA_CERT" | Out-File -FilePath "$ordererPath\msp\cacerts\ca.pem" -Encoding ASCII

"MOCK_PEER_CERT" | Out-File -FilePath "$peerPath\msp\signcerts\cert.pem" -Encoding ASCII
"MOCK_PEER_KEY" | Out-File -FilePath "$peerPath\msp\keystore\key.pem" -Encoding ASCII
"MOCK_CA_CERT" | Out-File -FilePath "$peerPath\msp\cacerts\ca.pem" -Encoding ASCII

# Create genesis block
"MOCK_GENESIS_BLOCK_DATA" | Out-File -FilePath "$ordererPath\genesis.block" -Encoding ASCII

Write-Host "Fabric storage initialized successfully!" -ForegroundColor Green