#!/bin/bash

# Generate crypto materials for Fabric network
echo "🔐 Generating crypto materials..."

# Create crypto-config directory
mkdir -p crypto-config

# Generate certificates using cryptogen
cryptogen generate --config=crypto-config.yaml --output=crypto-config

# Generate genesis block
echo "📦 Generating genesis block..."
configtxgen -profile TerraflowOrdererGenesis -channelID system-channel -outputBlock genesis.block

# Generate channel configuration
echo "📋 Generating channel configuration..."
configtxgen -profile TerraflowChannel -outputCreateChannelTx channel.tx -channelID terraflow-channel

# Generate anchor peer updates
echo "⚓ Generating anchor peer updates..."
configtxgen -profile TerraflowChannel -outputAnchorPeersUpdate LandRegistryMSPanchors.tx -channelID terraflow-channel -asOrg LandRegistryMSP

echo "✅ Crypto materials generated successfully!"
echo "📁 Files created:"
echo "  - crypto-config/ (certificates and keys)"
echo "  - genesis.block (orderer genesis block)"
echo "  - channel.tx (channel configuration)"
echo "  - LandRegistryMSPanchors.tx (anchor peer config)"