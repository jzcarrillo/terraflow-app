const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto file
const PROTO_PATH = path.join(__dirname, 'backend-blockchain/proto/blockchain.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const blockchainProto = grpc.loadPackageDefinition(packageDefinition).blockchain;

// Connect to blockchain service
const client = new blockchainProto.BlockchainService(
  'localhost:30051', // NodePort
  grpc.credentials.createInsecure()
);

// Query land title
console.log('🔍 Querying blockchain for land title...');

client.QueryLandTitle({ title_number: 'LT-2025-925336-2' }, (error, response) => {
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Blockchain Query Result:');
    console.log(JSON.stringify(response, null, 2));
  }
});

// Get land title history
client.GetLandTitleHistory({ title_number: 'LT-2025-925336-2' }, (error, response) => {
  if (error) {
    console.error('❌ History Error:', error.message);
  } else {
    console.log('📜 Blockchain History:');
    console.log(JSON.stringify(response, null, 2));
  }
});