#!/bin/bash

# Create and join channel

set -e

echo "🔗 Creating and joining channel..."

# Create channel
echo "📋 Creating mychannel..."
docker exec cli peer channel create -o orderer.example.com:7050 -c mychannel -f ./channel-artifacts/channel.tx

# Join peer to channel
echo "🤝 Joining peer0.org1 to mychannel..."
docker exec cli peer channel join -b mychannel.block

# Update anchor peers
echo "⚓ Updating anchor peers..."
docker exec cli peer channel update -o orderer.example.com:7050 -c mychannel -f ./channel-artifacts/Org1MSPanchors.tx

echo "✅ Channel created and joined successfully!"