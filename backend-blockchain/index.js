require('dotenv').config();
const GrpcServer = require('./services/grpc-server');

const grpcServer = new GrpcServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await grpcServer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await grpcServer.stop();
  process.exit(0);
});

// Start server
async function main() {
  try {
    console.log('🚀 Starting Blockchain gRPC Service...');
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Fabric Peer: ${process.env.FABRIC_PEER_URL || 'fabric-peer-service:7051'}`);
    console.log(`🔗 Fabric Orderer: ${process.env.FABRIC_ORDERER_URL || 'fabric-orderer-service:7050'}`);
    console.log(`🔗 Fabric CA: ${process.env.FABRIC_CA_URL || 'fabric-ca-service:7054'}`);
    
    await grpcServer.start();
  } catch (error) {
    console.error('❌ Failed to start blockchain service:', error.message);
    process.exit(1);
  }
}

main();