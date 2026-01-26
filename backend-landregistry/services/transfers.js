const { pool } = require('../config/db');
const { STATUS, QUEUES } = require('../config/constants');
const blockchainClient = require('./blockchain-client');
const rabbitmq = require('../utils/rabbitmq');

const submitTransfer = async (transferData) => {
  try {
    // Validate land title exists and is ACTIVE
    const titleCheck = await pool.query(
      'SELECT * FROM land_titles WHERE title_number = $1 AND status = $2',
      [transferData.title_number, 'ACTIVE']
    );
    
    if (titleCheck.rows.length === 0) {
      throw new Error('Land title not found or not active');
    }
    
    // Check for existing pending or completed transfers for this title
    const existingTransfer = await pool.query(
      'SELECT * FROM land_transfers WHERE title_number = $1 AND status IN ($2, $3)',
      [transferData.title_number, 'PENDING', 'COMPLETED']
    );
    
    if (existingTransfer.rows.length > 0) {
      const transfer = existingTransfer.rows[0];
      throw new Error(`Transfer already exists for this land title (Transfer ID: ${transfer.transfer_id}, Status: ${transfer.status})`);
    }
    
    const landTitle = titleCheck.rows[0];
    
    // Create transfer record with Buyer/Seller terminology
    const result = await pool.query(
      `INSERT INTO land_transfers (
        title_number, seller_name, seller_contact, seller_email, seller_address,
        buyer_name, buyer_contact, buyer_email, buyer_address, 
        transfer_fee, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        transferData.title_number,
        landTitle.owner_name,
        landTitle.contact_no,
        landTitle.email_address,
        landTitle.address,
        transferData.buyer_name,
        transferData.buyer_contact,
        transferData.buyer_email,
        transferData.buyer_address,
        transferData.transfer_fee || 5000,
        'PENDING',
        transferData.created_by
      ]
    );
    
    const transfer = result.rows[0];
    console.log(`🔄 Transfer submitted: ${transfer.transfer_id}`);
    console.log(`💳 Transfer fee: ${transfer.transfer_fee}`);
    console.log(`⚠️ Note: Create payment manually with transfer_id: ${transfer.transfer_id}`);
    
    return transfer;
  } catch (error) {
    console.error('❌ Submit transfer failed:', error.message);
    throw error;
  }
};

const getAllTransfers = async () => {
  try {
    const query = `
      SELECT t.*, lt.property_location, lt.area_size, lt.classification 
      FROM land_transfers t
      LEFT JOIN land_titles lt ON t.title_number = lt.title_number
      ORDER BY t.created_at DESC
    `;
    const result = await pool.query(query);
    console.log(`📋 Retrieved ${result.rows.length} transfers`);
    return result.rows;
  } catch (error) {
    console.error(`❌ Get all transfers failed:`, error.message);
    throw error;
  }
};

const updateTransferStatus = async (transferId, status) => {
  try {
    const result = await pool.query(
      'UPDATE land_transfers SET status = $1, updated_at = NOW() WHERE transfer_id = $2 RETURNING *',
      [status, transferId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Transfer not found');
    }
    
    console.log(`✅ Transfer status updated: ${transferId} -> ${status}`);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Update transfer status failed:', error.message);
    throw error;
  }
};

const processPaymentConfirmed = async (paymentData) => {
  try {
    const { payment_id, transfer_id } = paymentData;
    
    // Get transfer details
    const transferResult = await pool.query(
      'SELECT * FROM land_transfers WHERE transfer_id = $1',
      [transfer_id]
    );
    
    if (transferResult.rows.length === 0) {
      throw new Error('Transfer not found');
    }
    
    const transfer = transferResult.rows[0];
    
    // Update transfer status to COMPLETED
    await pool.query(
      'UPDATE land_transfers SET status = $1, payment_id = $2, transfer_date = NOW() WHERE transfer_id = $3',
      ['COMPLETED', payment_id, transfer_id]
    );
    
    // Update land title ownership (Seller -> Buyer)
    await pool.query(
      `UPDATE land_titles SET 
        owner_name = $1, 
        contact_no = $2, 
        email_address = $3, 
        address = $4,
        updated_at = NOW()
      WHERE title_number = $5`,
      [
        transfer.buyer_name,
        transfer.buyer_contact,
        transfer.buyer_email,
        transfer.buyer_address,
        transfer.title_number
      ]
    );
    
    console.log(`🏠 Land title ownership updated: ${transfer.title_number} (${transfer.seller_name} -> ${transfer.buyer_name})`);
    
    // Record transfer on blockchain
    const transferPayload = {
      title_number: transfer.title_number,
      from_owner: transfer.seller_name,
      to_owner: transfer.buyer_name,
      transfer_fee: transfer.transfer_fee.toString(),
      transfer_date: Math.floor(Date.now() / 1000),
      transaction_type: 'TRANSFER',
      transfer_id: transfer.transfer_id.toString()
    };
    
    try {
      console.log(`🔗 Recording transfer to blockchain: ${transfer.title_number}`);
      const blockchainResponse = await blockchainClient.recordTransfer(transferPayload);
      
      if (blockchainResponse.success && blockchainResponse.blockchainHash) {
        await pool.query(
          'UPDATE land_transfers SET blockchain_hash = $1 WHERE transfer_id = $2',
          [blockchainResponse.blockchainHash, transfer_id]
        );
        console.log(`✅ Transfer blockchain hash stored: ${blockchainResponse.blockchainHash}`);
      }
    } catch (blockchainError) {
      console.error('❌ Transfer blockchain recording failed:', blockchainError.message);
    }
    
    return { transfer, message: 'Transfer completed and ownership updated' };
    
  } catch (error) {
    console.error('❌ Process payment confirmed failed:', error.message);
    throw error;
  }
};

const deleteTransfer = async (transferId) => {
  try {
    const result = await pool.query(
      'DELETE FROM land_transfers WHERE transfer_id = $1 AND status = $2 RETURNING *',
      [transferId, 'PENDING']
    );
    
    if (result.rows.length === 0) {
      throw new Error('Transfer not found or cannot be deleted (only PENDING transfers can be deleted)');
    }
    
    console.log(`🗑️ Transfer deleted: ${transferId}`);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Delete transfer failed:', error.message);
    throw error;
  }
};

module.exports = {
  submitTransfer,
  getAllTransfers,
  updateTransferStatus,
  deleteTransfer,
  processPaymentConfirmed
};