#!/bin/bash

# Generate certificates for Fabric network
echo "🔐 Generating certificates for Hyperledger Fabric network..."

# Create directories
mkdir -p channel-artifacts

# Generate crypto material
cryptogen generate --config=./config/crypto-config.yaml

# Generate genesis block
configtxgen -profile TerraflowOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block

# Generate channel configuration transaction
configtxgen -profile LandTitleChannel -outputCreateChannelTx ./channel-artifacts/landtitle.tx -channelID landtitle

# Generate anchor peer transaction
configtxgen -profile LandTitleChannel -outputAnchorPeersUpdate ./channel-artifacts/LandRegistryMSPanchors.tx -channelID landtitle -asOrg LandRegistryMSP

echo "✅ Certificates and channel artifacts generated successfully!"