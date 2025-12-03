#!/bin/bash

# Setup Hyperledger Fabric Network for Terraflow

set -e

echo "🚀 Setting up Hyperledger Fabric Network..."

# Generate crypto materials
echo "📜 Generating crypto materials..."
cryptogen generate --config=./crypto-config.yaml

# Generate genesis block
echo "🏗️ Generating genesis block..."
configtxgen -profile TwoOrgsOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block

# Generate channel configuration transaction
echo "📋 Generating channel configuration..."
configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID mychannel

# Generate anchor peer transactions
echo "⚓ Generating anchor peer transactions..."
configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx -channelID mychannel -asOrg Org1MSP

echo "✅ Network setup completed!"
echo "📝 Next steps:"
echo "   1. Run: docker-compose up -d"
echo "   2. Create channel: ./scripts/create-channel.sh"
echo "   3. Deploy chaincode: ./scripts/deploy-chaincode.sh"