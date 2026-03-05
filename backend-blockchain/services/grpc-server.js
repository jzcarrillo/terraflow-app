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

  _createHandler(name, fn) {
    return async (call, callback) => {
      try {
        const request = call.request;
        console.log(`📥 gRPC ${name} request:`, JSON.stringify(request, null, 2));
        const result = await fn(request);
        console.log(`📤 gRPC ${name} response:`, result);
        callback(null, result);
      } catch (error) {
        console.error(`❌ gRPC ${name} error:`, error.message);
        callback({ code: grpc.status.INTERNAL, message: error.message });
      }
    };
  }

  async initialize() {
    try {
      const PROTO_PATH = path.join(__dirname, '../proto/blockchain.proto');
      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true, longs: String, enums: String, defaults: true, oneofs: true, json: true
      });
      const blockchainProto = grpc.loadPackageDefinition(packageDefinition).blockchain;
      const svc = this.chaincodeService;

      this.server.addService(blockchainProto.BlockchainService.service, {
        RecordLandTitle:      this._createHandler('RecordLandTitle',      (r) => svc.recordLandTitle(r)),
        RecordCancellation:   this._createHandler('RecordCancellation',   (r) => svc.recordCancellation(r)),
        RecordReactivation:   this._createHandler('RecordReactivation',   (r) => svc.recordReactivation(r)),
        RecordTransfer:       this._createHandler('RecordTransfer',       (r) => svc.recordTransfer(r)),
        GetLandTitleHistory:  this._createHandler('GetLandTitleHistory',  (r) => svc.getLandTitleHistory(r.title_number)),
        QueryLandTitle:       this._createHandler('QueryLandTitle',       (r) => svc.queryLandTitle(r.title_number)),
        GetTransactionHistory:this._createHandler('GetTransactionHistory',(r) => svc.getTransactionHistory(r.title_number).then(t => ({ transactions: t || [] }))),
        RecordMortgage:       this._createHandler('RecordMortgage',       (r) => svc.recordMortgage(r)),
        RecordMortgageRelease:this._createHandler('RecordMortgageRelease',(r) => svc.recordMortgageRelease(r))
      });

      console.log('✅ gRPC server initialized');
    } catch (error) {
      console.error('❌ Failed to initialize gRPC server:', error.message);
      throw error;
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