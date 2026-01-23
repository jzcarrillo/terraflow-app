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

  async recordCancellation(cancellationData) {
    try {
      const {
        title_number,
        previous_status,
        new_status,
        original_hash,
        reason,
        timestamp,
        transaction_id
      } = cancellationData;

      console.log(`❌ Recording cancellation on blockchain: ${title_number}`);

      // Submit cancellation transaction to chaincode
      const result = await this.fabricClient.submitTransaction(
        'CancelLandTitle',
        title_number,
        previous_status,
        new_status,
        original_hash,
        reason,
        timestamp.toString(),
        transaction_id
      );

      console.log(`✅ Cancellation recorded on blockchain: ${title_number}`);
      
      console.log(`🔍 DEBUG - fabric-client cancellation result:`, result);
      
      return {
        success: true,
        transaction_id: result.transaction_id || transaction_id,
        block_number: result.block_number || '1',
        message: 'Land title cancellation successfully recorded on blockchain',
        blockchainHash: result.blockchain_hash
      };

    } catch (error) {
      console.error('❌ Failed to record cancellation:', error.message);
      
      return {
        success: false,
        transaction_id: cancellationData.transaction_id || '',
        block_number: '',
        message: `Failed to record cancellation: ${error.message}`,
        blockchain_hash: ''
      };
    }
  }

  async recordReactivation(reactivationData) {
    try {
      const {
        title_number,
        previous_status,
        new_status,
        original_hash,
        cancellation_hash,
        reason,
        timestamp,
        transaction_id
      } = reactivationData;

      console.log(`🔄 Recording reactivation on blockchain: ${title_number}`);

      // Submit reactivation transaction to chaincode
      const result = await this.fabricClient.submitTransaction(
        'ReactivateLandTitle',
        title_number,
        previous_status,
        new_status,
        original_hash,
        cancellation_hash,
        reason,
        timestamp.toString(),
        transaction_id
      );

      console.log(`✅ Reactivation recorded on blockchain: ${title_number}`);
      
      console.log(`🔍 DEBUG - fabric-client reactivation result:`, result);
      
      return {
        success: true,
        transaction_id: result.transaction_id || transaction_id,
        block_number: result.block_number || '1',
        message: 'Land title reactivation successfully recorded on blockchain',
        blockchainHash: result.blockchain_hash
      };

    } catch (error) {
      console.error('❌ Failed to record reactivation:', error.message);
      
      return {
        success: false,
        transaction_id: reactivationData.transaction_id || '',
        block_number: '',
        message: `Failed to record reactivation: ${error.message}`,
        blockchain_hash: ''
      };
    }
  }

  async recordTransfer(transferData) {
    try {
      const {
        title_number,
        from_owner,
        to_owner,
        transfer_fee,
        transfer_date,
        transaction_type,
        transfer_id
      } = transferData;

      console.log(`🔄 Recording transfer on blockchain: ${title_number}`);

      // Submit transfer transaction to chaincode
      const result = await this.fabricClient.submitTransaction(
        'TransferLandTitle',
        title_number,
        from_owner,
        to_owner,
        transfer_fee,
        transfer_date.toString(),
        transaction_type,
        transfer_id
      );

      console.log(`✅ Transfer recorded on blockchain: ${title_number}`);
      
      console.log(`🔍 DEBUG - fabric-client transfer result:`, result);
      
      return {
        success: true,
        transaction_id: result.transaction_id || transfer_id,
        block_number: result.block_number || '1',
        message: 'Land title transfer successfully recorded on blockchain',
        blockchainHash: result.blockchain_hash
      };

    } catch (error) {
      console.error('❌ Failed to record transfer:', error.message);
      
      return {
        success: false,
        transaction_id: transferData.transfer_id || '',
        block_number: '',
        message: `Failed to record transfer: ${error.message}`,
        blockchain_hash: ''
      };
    }
  }

  async disconnect() {
    await this.fabricClient.disconnect();
  }
}

module.exports = ChaincodeService;