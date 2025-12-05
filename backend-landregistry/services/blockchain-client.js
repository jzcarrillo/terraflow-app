const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load protocol buffer definition
const PROTO_PATH = path.join(__dirname, '../proto/blockchain.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  json: true
});

const blockchainProto = grpc.loadPackageDefinition(packageDefinition).blockchain;

// Create gRPC client
const client = new blockchainProto.BlockchainService(
  process.env.BLOCKCHAIN_SERVICE_URL || 'backend-blockchain-service:50051',
  grpc.credentials.createInsecure()
);

class BlockchainClient {
  async recordLandTitle(landTitleData) {
    return new Promise((resolve, reject) => {
      client.RecordLandTitle(landTitleData, (error, response) => {
        if (error) {
          console.error('Blockchain gRPC error:', error);
          reject(error);
        } else {
          console.log('Blockchain response:', response);
          resolve(response);
        }
      });
    });
  }

  async recordCancellation(cancellationData) {
    return new Promise((resolve, reject) => {
      client.RecordCancellation(cancellationData, (error, response) => {
        if (error) {
          console.error('Cancellation gRPC error:', error);
          reject(error);
        } else {
          console.log('Cancellation response:', response);
          resolve(response);
        }
      });
    });
  }

  async recordReactivation(reactivationData) {
    return new Promise((resolve, reject) => {
      client.RecordReactivation(reactivationData, (error, response) => {
        if (error) {
          console.error('Reactivation gRPC error:', error);
          reject(error);
        } else {
          console.log('Reactivation response:', response);
          resolve(response);
        }
      });
    });
  }

  async getLandTitle(landTitleId) {
    return new Promise((resolve, reject) => {
      client.GetLandTitle({ landTitleId }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}

module.exports = new BlockchainClient();