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
        transfer_id,
        owner_name
      } = transferData;

      console.log(`🔄 Recording transfer on blockchain: ${title_number}, owner: ${owner_name}`);

      // Submit transfer transaction to chaincode
      const result = await this.fabricClient.submitTransaction(
        'TransferLandTitle',
        title_number,
        from_owner,
        to_owner,
        transfer_fee,
        transfer_date.toString(),
        transaction_type,
        transfer_id,
        owner_name
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

  async getTransactionHistory(titleNumber) {
    try {
      console.log(`📜 Getting transaction history: ${titleNumber}`);

      const result = await this.fabricClient.evaluateTransaction(
        'GetTransactionHistory',
        titleNumber
      );

      // Parse JSON string to array
      const transactions = typeof result === 'string' ? JSON.parse(result) : result;
      return Array.isArray(transactions) ? transactions : [];

    } catch (error) {
      console.error('❌ Failed to get transaction history:', error.message);
      return [];
    }
  }

  async recordMortgage(mortgageData) {
    try {
      const {
        mortgage_id,
        land_title_id,
        bank_name,
        amount,
        status,
        timestamp,
        transaction_id
      } = mortgageData;

      console.log(`🏦 Recording mortgage on blockchain: ${mortgage_id}`);

      // Submit transaction to chaincode
      const result = await this.fabricClient.submitTransaction(
        'CreateMortgage',
        mortgage_id.toString(),
        land_title_id.toString(),
        bank_name,
        amount.toString(),
        status,
        timestamp.toString(),
        transaction_id
      );

      console.log(`✅ Mortgage recorded on blockchain: ${mortgage_id}`);
      
      return {
        success: true,
        transaction_id: result.transaction_id || transaction_id,
        block_number: result.block_number || '1',
        message: 'Mortgage successfully recorded on blockchain',
        blockchainHash: result.blockchain_hash
      };

    } catch (error) {
      console.error('❌ Failed to record mortgage:', error.message);
      
      return {
        success: false,
        transaction_id: mortgageData.transaction_id || '',
        block_number: '',
        message: `Failed to record mortgage: ${error.message}`,
        blockchain_hash: ''
      };
    }
  }

  async recordMortgageRelease(releaseData) {
    try {
      const {
        mortgage_id,
        land_title_id,
        previous_status,
        new_status,
        timestamp,
        transaction_id
      } = releaseData;

      console.log(`🔓 Recording mortgage release on blockchain: ${mortgage_id}`);

      // Submit transaction to chaincode
      const result = await this.fabricClient.submitTransaction(
        'ReleaseMortgage',
        mortgage_id.toString(),
        land_title_id.toString(),
        previous_status,
        new_status,
        timestamp.toString(),
        transaction_id
      );

      console.log(`✅ Mortgage release recorded on blockchain: ${mortgage_id}`);
      
      return {
        success: true,
        transaction_id: result.transaction_id || transaction_id,
        block_number: result.block_number || '1',
        message: 'Mortgage release successfully recorded on blockchain',
        blockchainHash: result.blockchain_hash
      };

    } catch (error) {
      console.error('❌ Failed to record mortgage release:', error.message);
      
      return {
        success: false,
        transaction_id: releaseData.transaction_id || '',
        block_number: '',
        message: `Failed to record mortgage release: ${error.message}`,
        blockchain_hash: ''
      };
    }
  }

  async disconnect() {
    await this.fabricClient.disconnect();
  }
}

module.exports = ChaincodeService;