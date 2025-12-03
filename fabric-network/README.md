# Hyperledger Fabric Network for Terraflow

## Prerequisites

1. **Hyperledger Fabric Binaries**
   ```bash
   curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.4 1.5.7
   ```

2. **Docker and Docker Compose**
   - Docker Desktop for Windows
   - Docker Compose v3.7+

3. **Node.js Dependencies**
   ```bash
   cd chaincode
   npm install
   ```

## Network Setup

### 1. Generate Crypto Materials
```bash
cd fabric-network
./scripts/setup-network.sh
```

### 2. Start Network
```bash
docker-compose up -d
```

### 3. Create Channel
```bash
./scripts/create-channel.sh
```

### 4. Deploy Chaincode
```bash
./scripts/deploy-chaincode.sh
```

## Network Components

- **Orderer**: `orderer.example.com:7050`
- **Peer**: `peer0.org1.example.com:7051`
- **CA**: `ca.org1.example.com:7054`
- **CouchDB**: `couchdb0:5984`

## Chaincode Functions

- `RecordLandTitle(titleNumber, ownerName, propertyLocation, status, referenceId, timestamp, transactionId)`
- `QueryLandTitle(titleNumber)`
- `GetLandTitleHistory(titleNumber)`
- `UpdateLandTitleStatus(titleNumber, newStatus, transactionId)`

## Testing

```bash
# Query chaincode
docker exec cli peer chaincode query -C mychannel -n landtitle -c '{"function":"QueryLandTitle","Args":["LT-2025-001"]}'

# Invoke chaincode
docker exec cli peer chaincode invoke -o orderer.example.com:7050 --channelID mychannel -n landtitle -c '{"function":"RecordLandTitle","Args":["LT-2025-001","John Doe","123 Main St","ACTIVE","REF-001","2025-01-01","TX-001"]}'
```

## Troubleshooting

1. **Port Conflicts**: Ensure ports 7050, 7051, 7054, 5984 are available
2. **Docker Issues**: Run `docker system prune -a` to clean up
3. **Permission Issues**: Ensure scripts have execute permissions: `chmod +x scripts/*.sh`

## Integration with Backend

The backend-blockchain service connects to this network via:
- Connection Profile: `connection-profile.json`
- Wallet: Auto-generated in `wallet/` directory
- Identity: `appUser` (created during setup)