const FabricClient = require('./fabric-client');

class ChaincodeService {
  constructor() {
    this.fabricClient = new FabricClient();
  }

  async recordLandTitle(landTitleData) {
    try {
      const {
        title_number,
        owner_name,
        property_location,
        status,
        reference_id,
        timestamp,
        transaction_id
      } = landTitleData;

      console.log(`🏠 Recording land title on blockchain: ${title_number}`);

      // Submit transaction to chaincode
      const result = await this.fabricClient.submitTransaction(
        'CreateLandTitle',
        title_number,
        owner_name,
        property_location,
        status,
        reference_id,
        timestamp.toString(),
        transaction_id
      );

      console.log(`✅ Land title recorded on blockchain: ${title_number}`);
      
      console.log(`🔍 DEBUG - fabric-client result:`, result);
      
      return {
        success: true,
        transaction_id: result.transaction_id || transaction_id,
        block_number: result.block_number || '1',
        message: 'Land title successfully recorded on blockchain',
        blockchainHash: result.blockchain_hash
      };

    } catch (error) {
      console.error('❌ Failed to record land title:', error.message);
      
      return {
        success: false,
        transaction_id: landTitleData.transaction_id || '',
        block_number: '',
        message: `Failed to record land title: ${error.message}`,
        blockchain_hash: ''
      };
    }
  }

  async getLandTitleHistory(titleNumber) {
    try {
      console.log(`📜 Getting land title history: ${titleNumber}`);

      const result = await this.fabricClient.evaluateTransaction(
        'GetLandTitleHistory',
        titleNumber
      );

      return {
        success: true,
        history: result.history || [],
        message: 'Land title history retrieved successfully'
      };

    } catch (error) {
      console.error('❌ Failed to get land title history:', error.message);
      
      return {
        success: false,
        history: [],
        message: `Failed to get history: ${error.message}`
      };
    }
  }

  async queryLandTitle(titleNumber) {
    try {
      console.log(`🔍 Querying land title: ${titleNumber}`);

      const result = await this.fabricClient.evaluateTransaction(
        'GetLandTitle',
        titleNumber
      );

      return {
        success: true,
        land_title: result,
        message: 'Land title retrieved successfully'
      };

    } catch (error) {
      console.error('❌ Failed to query land title:', error.message);
      
      return {
        success: false,
        land_title: null,
        message: `Failed to query land title: ${error.message}`
      };
    }
  }

  async disconnect() {
    await this.fabricClient.disconnect();
  }
}

module.exports = ChaincodeService;