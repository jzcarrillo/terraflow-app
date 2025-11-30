#!/bin/bash

echo "📡 Creating and joining channel..."

# Set environment variables
export CORE_PEER_TLS_ENABLED=false
export CORE_PEER_LOCALMSPID="LandRegistryMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/landregistry.terraflow.com/peers/peer0.landregistry.terraflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/landregistry.terraflow.com/users/Admin@landregistry.terraflow.com/msp
export CORE_PEER_ADDRESS=peer0.landregistry.terraflow.com:7051

# Create channel
peer channel create -o orderer.terraflow.com:7050 -c landtitle -f ./channel-artifacts/landtitle.tx

# Join peer to channel
peer channel join -b landtitle.block

# Update anchor peer
peer channel update -o orderer.terraflow.com:7050 -c landtitle -f ./channel-artifacts/LandRegistryMSPanchors.tx

echo "✅ Channel created and peer joined successfully!"