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
    console.log(`🔗 Attempting blockchain connection to: ${process.env.BLOCKCHAIN_SERVICE_URL || 'backend-blockchain-service:50051'}`);
    console.log(`🔗 Payload:`, JSON.stringify(landTitleData, null, 2));
    
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 10); // 10 second timeout
      
      client.RecordLandTitle(landTitleData, { deadline }, (error, response) => {
        if (error) {
          console.error('❌ Blockchain gRPC error:', error);
          console.error('❌ Error code:', error.code);
          console.error('❌ Error details:', error.details);
          console.error('❌ Error metadata:', error.metadata);
          reject(error);
        } else {
          console.log('✅ Blockchain response:', response);
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

  async recordTransfer(transferData) {
    console.log(`🔄 Recording transfer to blockchain:`, JSON.stringify(transferData, null, 2));
    
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 10);
      
      client.RecordTransfer(transferData, { deadline }, (error, response) => {
        if (error) {
          console.error('❌ Transfer blockchain gRPC error:', error);
          reject(error);
        } else {
          console.log('✅ Transfer blockchain response:', response);
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

  async getTransactionHistory(titleNumber) {
    console.log(`📜 Fetching blockchain transaction history for: ${titleNumber}`);
    
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 10);
      
      client.GetTransactionHistory({ title_number: titleNumber }, { deadline }, (error, response) => {
        if (error) {
          console.error('❌ Get transaction history gRPC error:', error);
          reject(error);
        } else {
          console.log('✅ Transaction history response:', response);
          resolve(response.transactions || []);
        }
      });
    });
  }

  async recordMortgage(mortgageData) {
    console.log(`🏦 Recording mortgage to blockchain:`, JSON.stringify(mortgageData, null, 2));
    
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 10);
      
      client.RecordMortgage(mortgageData, { deadline }, (error, response) => {
        if (error) {
          console.error('❌ Mortgage blockchain gRPC error:', error);
          reject(error);
        } else {
          console.log('✅ Mortgage blockchain response:', response);
          resolve(response);
        }
      });
    });
  }

  async recordMortgageRelease(releaseData) {
    console.log(`🔓 Recording mortgage release to blockchain:`, JSON.stringify(releaseData, null, 2));
    
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 10);
      
      client.RecordMortgageRelease(releaseData, { deadline }, (error, response) => {
        if (error) {
          console.error('❌ Mortgage release blockchain gRPC error:', error);
          reject(error);
        } else {
          console.log('✅ Mortgage release blockchain response:', response);
          resolve(response);
        }
      });
    });
  }
}

module.exports = new BlockchainClient();