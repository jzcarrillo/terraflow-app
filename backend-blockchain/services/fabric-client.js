// Mock Fabric implementation for development
const crypto = require('crypto');

class FabricClient {
  constructor() {
    this.mockLedger = new Map();
    this.transactionCounter = 0;
    this.connected = false;
  }

  async initialize() {
    try {
      console.log('🔗 Initializing Mock Fabric client...');
      this.connected = true;
      console.log('✅ Mock Fabric client initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Mock Fabric client:', error.message);
      throw error;
    }
  }

  async submitTransaction(functionName, ...args) {
    try {
      if (!this.connected) {
        await this.initialize();
      }

      console.log(`📤 Mock transaction: ${functionName}`);
      console.log(`📦 Args:`, args);

      // Generate mock transaction ID
      this.transactionCounter++;
      const transactionId = `tx_${Date.now()}_${this.transactionCounter}`;
      const blockNumber = Math.floor(this.transactionCounter / 10) + 1;
      const blockchainHash = crypto.createHash('sha256')
        .update(`${transactionId}_${JSON.stringify(args)}`)
        .digest('hex');

      // Store in mock ledger
      const record = {
        transactionId,
        functionName,
        args,
        timestamp: new Date().toISOString(),
        blockNumber,
        blockchainHash
      };

      this.mockLedger.set(transactionId, record);

      const response = {
        success: true,
        message: 'Land title recorded successfully on mock blockchain',
        transaction_id: transactionId,
        block_number: blockNumber,
        blockchain_hash: blockchainHash
      };
      
      console.log(`✅ Mock transaction completed:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Failed to submit mock transaction ${functionName}:`, error.message);
      throw error;
    }
  }

  async evaluateTransaction(functionName, ...args) {
    try {
      if (!this.connected) {
        await this.initialize();
      }

      console.log(`🔍 Mock query: ${functionName}`);
      
      // Mock query response
      const response = {
        success: true,
        data: Array.from(this.mockLedger.values()),
        count: this.mockLedger.size
      };
      
      console.log(`✅ Mock query completed`);
      return response;
    } catch (error) {
      console.error(`❌ Failed to evaluate mock transaction ${functionName}:`, error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      this.connected = false;
      console.log('🔌 Mock Fabric client disconnected');
    } catch (error) {
      console.error('❌ Failed to disconnect mock client:', error.message);
    }
  }
}

module.exports = FabricClient;