#!/bin/bash

# Deploy Land Title Chaincode

set -e

echo "📦 Deploying Land Title Chaincode..."

# Package chaincode
echo "📦 Packaging chaincode..."
docker exec cli peer lifecycle chaincode package landtitle.tar.gz --path /opt/gopath/src/github.com/chaincode --lang node --label landtitle_1.0

# Install chaincode
echo "💾 Installing chaincode..."
docker exec cli peer lifecycle chaincode install landtitle.tar.gz

# Get package ID
echo "🔍 Getting package ID..."
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled --output json | jq -r '.installed_chaincodes[0].package_id')
echo "Package ID: $PACKAGE_ID"

# Approve chaincode
echo "✅ Approving chaincode..."
docker exec cli peer lifecycle chaincode approveformyorg -o orderer.example.com:7050 --channelID mychannel --name landtitle --version 1.0 --package-id $PACKAGE_ID --sequence 1

# Commit chaincode
echo "🚀 Committing chaincode..."
docker exec cli peer lifecycle chaincode commit -o orderer.example.com:7050 --channelID mychannel --name landtitle --version 1.0 --sequence 1

# Initialize chaincode
echo "🎯 Initializing chaincode..."
docker exec cli peer chaincode invoke -o orderer.example.com:7050 --channelID mychannel -n landtitle -c '{"function":"InitLedger","Args":[]}'

echo "✅ Chaincode deployed and initialized successfully!"