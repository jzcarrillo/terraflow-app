#!/usr/bin/env pwsh

Write-Host "🚀 Setting up Hyperledger Fabric Network..." -ForegroundColor Green

# Step 1: Create storage directories
Write-Host "📁 Creating storage directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "C:\tmp\fabric-orderer"
New-Item -ItemType Directory -Force -Path "C:\tmp\fabric-peer" 
New-Item -ItemType Directory -Force -Path "C:\tmp\fabric-couchdb"

# Step 2: Create PersistentVolumes and PVCs
Write-Host "💾 Creating Kubernetes storage resources..." -ForegroundColor Yellow
kubectl apply -f create-k8s-resources.yaml

# Step 3: Generate crypto materials (mock for now)
Write-Host "🔐 Creating mock crypto materials..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "crypto-config\ordererOrganizations\terraflow.com\msp\tlscacerts"
New-Item -ItemType Directory -Force -Path "crypto-config\peerOrganizations\landregistry.terraflow.com\msp\tlscacerts"

# Create mock genesis block
Write-Host "📦 Creating mock genesis block..." -ForegroundColor Yellow
"MOCK_GENESIS_BLOCK" | Out-File -FilePath "genesis.block" -Encoding ASCII

# Step 4: Create ConfigMaps
Write-Host "🗂️ Creating ConfigMaps..." -ForegroundColor Yellow
kubectl create configmap fabric-genesis-block --from-file=genesis.block -n terraflow-app --dry-run=client -o yaml | kubectl apply -f -

# Create mock MSP configmaps
kubectl create configmap fabric-orderer-msp --from-literal=msp="mock-orderer-msp" -n terraflow-app --dry-run=client -o yaml | kubectl apply -f -
kubectl create configmap fabric-peer-msp --from-literal=msp="mock-peer-msp" -n terraflow-app --dry-run=client -o yaml | kubectl apply -f -

# Step 5: Wait for PVCs to be bound
Write-Host "⏳ Waiting for PVCs to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=Bound pvc/fabric-orderer-pvc -n terraflow-app --timeout=60s
kubectl wait --for=condition=Bound pvc/fabric-peer-pvc -n terraflow-app --timeout=60s  
kubectl wait --for=condition=Bound pvc/fabric-couchdb-pvc -n terraflow-app --timeout=60s

# Step 6: Restart Fabric deployments
Write-Host "🔄 Restarting Fabric deployments..." -ForegroundColor Yellow
kubectl rollout restart deployment fabric-orderer -n terraflow-app
kubectl rollout restart deployment fabric-peer -n terraflow-app
kubectl rollout restart deployment fabric-couchdb -n terraflow-app

# Step 7: Wait for pods to be ready
Write-Host "⏳ Waiting for Fabric pods to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=fabric-orderer -n terraflow-app --timeout=300s
kubectl wait --for=condition=ready pod -l app=fabric-peer -n terraflow-app --timeout=300s
kubectl wait --for=condition=ready pod -l app=fabric-couchdb -n terraflow-app --timeout=300s

Write-Host "✅ Hyperledger Fabric Network setup completed!" -ForegroundColor Green
Write-Host "🔗 Network components:" -ForegroundColor Cyan
Write-Host "  - Orderer: fabric-orderer-service:7050" -ForegroundColor White
Write-Host "  - Peer: fabric-peer-service:7051" -ForegroundColor White  
Write-Host "  - CouchDB: fabric-couchdb-service:5984" -ForegroundColor White
Write-Host "  - Blockchain Service: backend-blockchain-service:50051" -ForegroundColor White