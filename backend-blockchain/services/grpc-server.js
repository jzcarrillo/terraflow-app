const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const ChaincodeService = require('./chaincode-service');

class GrpcServer {
  constructor() {
    this.server = new grpc.Server();
    this.chaincodeService = new ChaincodeService();
    this.port = process.env.GRPC_PORT || 50051;
  }

  async initialize() {
    try {
      // Load proto file
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

      // Add service implementation
      this.server.addService(blockchainProto.BlockchainService.service, {
        RecordLandTitle: this.recordLandTitle.bind(this),
        RecordCancellation: this.recordCancellation.bind(this),
        RecordReactivation: this.recordReactivation.bind(this),
        RecordTransfer: this.recordTransfer.bind(this),
        GetLandTitleHistory: this.getLandTitleHistory.bind(this),
        QueryLandTitle: this.queryLandTitle.bind(this),
        GetTransactionHistory: this.getTransactionHistory.bind(this),
        RecordMortgage: this.recordMortgage.bind(this),
        RecordMortgageRelease: this.recordMortgageRelease.bind(this)
      });

      console.log('✅ gRPC server initialized');
    } catch (error) {
      console.error('❌ Failed to initialize gRPC server:', error.message);
      throw error;
    }
  }

  async recordLandTitle(call, callback) {
    try {
      const request = call.request;
      console.log(`📥 gRPC RecordLandTitle request:`, JSON.stringify(request, null, 2));
      console.log(`🔍 Request keys:`, Object.keys(request));
      console.log(`🔍 Request values:`, Object.values(request));

      const result = await this.chaincodeService.recordLandTitle({
        title_number: request.title_number,
        owner_name: request.owner_name,
        property_location: request.property_location,
        status: request.status,
        reference_id: request.reference_id,
        timestamp: request.timestamp,
        transaction_id: request.transaction_id
      });

      console.log(`📤 gRPC RecordLandTitle response:`, result);
      callback(null, result);

    } catch (error) {
      console.error('❌ gRPC RecordLandTitle error:', error.message);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }

  async getLandTitleHistory(call, callback) {
    try {
      const request = call.request;
      console.log(`📥 gRPC GetLandTitleHistory request:`, request);

      const result = await this.chaincodeService.getLandTitleHistory(request.title_number);

      console.log(`📤 gRPC GetLandTitleHistory response:`, result);
      callback(null, result);

    } catch (error) {
      console.error('❌ gRPC GetLandTitleHistory error:', error.message);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }

  async recordCancellation(call, callback) {
    try {
      const request = call.request;
      console.log(`📥 gRPC RecordCancellation request:`, JSON.stringify(request, null, 2));

      const result = await this.chaincodeService.recordCancellation({
        title_number: request.title_number,
        previous_status: request.previous_status,
        new_status: request.new_status,
        original_hash: request.original_hash,
        reason: request.reason,
        timestamp: request.timestamp,
        transaction_id: request.transaction_id
      });

      console.log(`📤 gRPC RecordCancellation response:`, result);
      callback(null, result);

    } catch (error) {
      console.error('❌ gRPC RecordCancellation error:', error.message);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }

  async recordReactivation(call, callback) {
    try {
      const request = call.request;
      console.log(`📥 gRPC RecordReactivation request:`, JSON.stringify(request, null, 2));

      const result = await this.chaincodeService.recordReactivation({
        title_number: request.title_number,
        previous_status: request.previous_status,
        new_status: request.new_status,
        original_hash: request.original_hash,
        cancellation_hash: request.cancellation_hash,
        reason: request.reason,
        timestamp: request.timestamp,
        transaction_id: request.transaction_id
      });

      console.log(`📤 gRPC RecordReactivation response:`, result);
      callback(null, result);

    } catch (error) {
      console.error('❌ gRPC RecordReactivation error:', error.message);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }

  async recordTransfer(call, callback) {
    try {
      const request = call.request;
      console.log(`📥 gRPC RecordTransfer request:`, JSON.stringify(request, null, 2));

      const result = await this.chaincodeService.recordTransfer({
        title_number: request.title_number,
        from_owner: request.from_owner,
        to_owner: request.to_owner,
        transfer_fee: request.transfer_fee,
        transfer_date: request.transfer_date,
        transaction_type: request.transaction_type,
        transfer_id: request.transfer_id,
        owner_name: request.owner_name
      });

      console.log(`📤 gRPC RecordTransfer response:`, result);
      callback(null, result);

    } catch (error) {
      console.error('❌ gRPC RecordTransfer error:', error.message);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }

  async queryLandTitle(call, callback) {
    try {
      const request = call.request;
      console.log(`📥 gRPC QueryLandTitle request:`, request);

      const result = await this.chaincodeService.queryLandTitle(request.title_number);

      console.log(`📤 gRPC QueryLandTitle response:`, result);
      callback(null, result);

    } catch (error) {
      console.error('❌ gRPC QueryLandTitle error:', error.message);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }

  async getTransactionHistory(call, callback) {
    try {
      const request = call.request;
      console.log(`📥 gRPC GetTransactionHistory request:`, request);

      const result = await this.chaincodeService.getTransactionHistory(request.title_number);

      console.log(`📤 gRPC GetTransactionHistory response:`, result);
      callback(null, { transactions: result || [] });

    } catch (error) {
      console.error('❌ gRPC GetTransactionHistory error:', error.message);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }

  async recordMortgage(call, callback) {
    try {
      const request = call.request;
      console.log(`📥 gRPC RecordMortgage request:`, JSON.stringify(request, null, 2));

      const result = await this.chaincodeService.recordMortgage({
        mortgage_id: request.mortgage_id,
        land_title_id: request.land_title_id,
        bank_name: request.bank_name,
        amount: request.amount,
        status: request.status,
        timestamp: request.timestamp,
        transaction_id: request.transaction_id
      });

      console.log(`📤 gRPC RecordMortgage response:`, result);
      callback(null, result);

    } catch (error) {
      console.error('❌ gRPC RecordMortgage error:', error.message);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }

  async recordMortgageRelease(call, callback) {
    try {
      const request = call.request;
      console.log(`📥 gRPC RecordMortgageRelease request:`, JSON.stringify(request, null, 2));

      const result = await this.chaincodeService.recordMortgageRelease({
        mortgage_id: request.mortgage_id,
        land_title_id: request.land_title_id,
        previous_status: request.previous_status,
        new_status: request.new_status,
        timestamp: request.timestamp,
        transaction_id: request.transaction_id
      });

      console.log(`📤 gRPC RecordMortgageRelease response:`, result);
      callback(null, result);

    } catch (error) {
      console.error('❌ gRPC RecordMortgageRelease error:', error.message);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }

  async start() {
    try {
      await this.initialize();

      // Bind server
      const address = `0.0.0.0:${this.port}`;
      this.server.bindAsync(
        address,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) {
            console.error('❌ Failed to bind gRPC server:', error.message);
            process.exit(1);
          }
          
          console.log(`🚀 Blockchain gRPC server running on port ${port}`);
          this.server.start();
        }
      );

    } catch (error) {
      console.error('❌ Failed to start gRPC server:', error.message);
      throw error;
    }
  }

  async stop() {
    try {
      await this.chaincodeService.disconnect();
      
      this.server.tryShutdown((error) => {
        if (error) {
          console.error('❌ Error shutting down gRPC server:', error.message);
        } else {
          console.log('🔌 gRPC server shut down gracefully');
        }
      });
    } catch (error) {
      console.error('❌ Failed to stop gRPC server:', error.message);
    }
  }
}

module.exports = GrpcServer;