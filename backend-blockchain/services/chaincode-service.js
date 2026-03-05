const FabricClient = require('./fabric-client');

class ChaincodeService {
  constructor() {
    this.fabricClient = new FabricClient();
  }

  async _submitAndRespond(label, fn, fallbackId) {
    try {
      const result = await fn();
      console.log(`✅ ${label} recorded on blockchain`);
      return {
        success: true,
        transaction_id: result.transaction_id || fallbackId || '',
        block_number: result.block_number || '1',
        message: `${label} successfully recorded on blockchain`,
        blockchainHash: result.blockchain_hash
      };
    } catch (error) {
      console.error(`❌ Failed to record ${label}:`, error.message);
      return {
        success: false,
        transaction_id: fallbackId || '',
        block_number: '',
        message: `Failed to record ${label}: ${error.message}`,
        blockchain_hash: ''
      };
    }
  }

  async getLandTitleHistory(titleNumber) {
    try {
      console.log(`📜 Getting land title history: ${titleNumber}`);
      const result = await this.fabricClient.evaluateTransaction('GetLandTitleHistory', titleNumber);
      return { success: true, history: result.history || [], message: 'Land title history retrieved successfully' };
    } catch (error) {
      console.error('❌ Failed to get land title history:', error.message);
      return { success: false, history: [], message: `Failed to get history: ${error.message}` };
    }
  }

  async queryLandTitle(titleNumber) {
    try {
      console.log(`🔍 Querying land title: ${titleNumber}`);
      const result = await this.fabricClient.evaluateTransaction('GetLandTitle', titleNumber);
      return { success: true, land_title: result, message: 'Land title retrieved successfully' };
    } catch (error) {
      console.error('❌ Failed to query land title:', error.message);
      return { success: false, land_title: null, message: `Failed to query land title: ${error.message}` };
    }
  }

  async getTransactionHistory(titleNumber) {
    try {
      console.log(`📜 Getting transaction history: ${titleNumber}`);
      const result = await this.fabricClient.evaluateTransaction('GetTransactionHistory', titleNumber);
      const transactions = typeof result === 'string' ? JSON.parse(result) : result;
      return Array.isArray(transactions) ? transactions : [];
    } catch (error) {
      console.error('❌ Failed to get transaction history:', error.message);
      return [];
    }
  }

  async recordLandTitle(data) {
    const { title_number, owner_name, property_location, status, reference_id, timestamp, transaction_id } = data;
    console.log(`🏠 Recording land title on blockchain: ${title_number}`);
    const result = await this._submitAndRespond('land title', () =>
      this.fabricClient.submitTransaction('CreateLandTitle', title_number, owner_name, property_location, status, reference_id, timestamp.toString(), transaction_id),
      transaction_id
    );
    if (result.success) console.log(`🔍 DEBUG - fabric-client result:`, result);
    return result;
  }

  async recordCancellation(data) {
    const { title_number, previous_status, new_status, original_hash, reason, timestamp, transaction_id } = data;
    console.log(`❌ Recording cancellation on blockchain: ${title_number}`);
    const result = await this._submitAndRespond('cancellation', () =>
      this.fabricClient.submitTransaction('CancelLandTitle', title_number, previous_status, new_status, original_hash, reason, timestamp.toString(), transaction_id),
      transaction_id
    );
    if (result.success) console.log(`🔍 DEBUG - fabric-client cancellation result:`, result);
    return result;
  }

  async recordReactivation(data) {
    const { title_number, previous_status, new_status, original_hash, cancellation_hash, reason, timestamp, transaction_id } = data;
    console.log(`🔄 Recording reactivation on blockchain: ${title_number}`);
    const result = await this._submitAndRespond('reactivation', () =>
      this.fabricClient.submitTransaction('ReactivateLandTitle', title_number, previous_status, new_status, original_hash, cancellation_hash, reason, timestamp.toString(), transaction_id),
      transaction_id
    );
    if (result.success) console.log(`🔍 DEBUG - fabric-client reactivation result:`, result);
    return result;
  }

  async recordTransfer(data) {
    const { title_number, from_owner, to_owner, transfer_fee, transfer_date, transaction_type, transfer_id, owner_name } = data;
    console.log(`🔄 Recording transfer on blockchain: ${title_number}, owner: ${owner_name}`);
    const result = await this._submitAndRespond('transfer', () =>
      this.fabricClient.submitTransaction('TransferLandTitle', title_number, from_owner, to_owner, transfer_fee, transfer_date.toString(), transaction_type, transfer_id, owner_name),
      transfer_id
    );
    if (result.success) console.log(`🔍 DEBUG - fabric-client transfer result:`, result);
    return result;
  }

  async recordMortgage(data) {
    const { mortgage_id, land_title_id, bank_name, amount, status, timestamp, transaction_id } = data;
    console.log(`🏦 Recording mortgage on blockchain: ${mortgage_id}`);
    return this._submitAndRespond('mortgage', () =>
      this.fabricClient.submitTransaction('CreateMortgage', mortgage_id.toString(), land_title_id.toString(), bank_name, amount.toString(), status, timestamp.toString(), transaction_id),
      transaction_id
    );
  }

  async recordMortgageRelease(data) {
    const { mortgage_id, land_title_id, previous_status, new_status, timestamp, transaction_id } = data;
    console.log(`🔓 Recording mortgage release on blockchain: ${mortgage_id}`);
    return this._submitAndRespond('mortgage release', () =>
      this.fabricClient.submitTransaction('ReleaseMortgage', mortgage_id.toString(), land_title_id.toString(), previous_status, new_status, timestamp.toString(), transaction_id),
      transaction_id
    );
  }

  async disconnect() {
    await this.fabricClient.disconnect();
  }
}

module.exports = ChaincodeService;