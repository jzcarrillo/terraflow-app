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
    
    const landTitle = titleCheck.rows[0];
    
    // Check for active or pending mortgages
    const mortgageCheck = await pool.query(
      'SELECT COUNT(*) FROM mortgages WHERE land_title_id = $1 AND status IN ($2, $3)',
      [landTitle.id, 'ACTIVE', 'PENDING']
    );
    
    if (parseInt(mortgageCheck.rows[0].count) > 0) {
      throw new Error('Cannot transfer land title with active or pending mortgages. Please release all mortgages first.');
    }
    
    // Check for existing pending or completed transfers for this land title
    const existingTransfer = await pool.query(
      'SELECT * FROM land_transfers WHERE land_title_id = $1 AND status IN ($2, $3)',
      [landTitle.id, 'PENDING', 'COMPLETED']
    );
    
    if (existingTransfer.rows.length > 0) {
      const transfer = existingTransfer.rows[0];
      throw new Error(`Transfer already exists for this land title (Transfer ID: ${transfer.transfer_id}, Status: ${transfer.status})`);
    }
    
    // Generate transfer ID: TRF-YYYY-TIMESTAMP
    const transferId = `TRF-${new Date().getFullYear()}-${Date.now()}`;
    
    // Create transfer record
    const result = await pool.query(
      `INSERT INTO land_transfers (
        transfer_id, land_title_id, from_owner, to_owner, buyer_contact, buyer_email, buyer_address,
        transfer_type, consideration_amount, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        transferId,
        landTitle.id,
        landTitle.owner_name,
        transferData.buyer_name || transferData.to_owner,
        transferData.buyer_contact,
        transferData.buyer_email,
        transferData.buyer_address,
        transferData.transfer_type || 'SALE',
        transferData.transfer_fee || transferData.consideration_amount || 5000,
        'PENDING',
        transferData.created_by
      ]
    );
    
    const transfer = result.rows[0];
    console.log(`🔄 Transfer submitted: ${transfer.transfer_id}`);
    console.log(`💳 Transfer fee: ${transfer.consideration_amount}`);
    
    return transfer;
  } catch (error) {
    console.error('❌ Submit transfer failed:', error.message);
    throw error;
  }
};

const getAllTransfers = async () => {
  try {
    const query = `
      SELECT t.*, lt.title_number, lt.property_location, lt.area_size, lt.classification 
      FROM land_transfers t
      LEFT JOIN land_titles lt ON t.land_title_id = lt.id
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
    
    // Get transfer details with land title info
    const transferResult = await pool.query(
      `SELECT t.*, lt.title_number, lt.owner_name as current_owner
       FROM land_transfers t
       JOIN land_titles lt ON t.land_title_id = lt.id
       WHERE t.transfer_id = $1`,
      [transfer_id]
    );
    
    if (transferResult.rows.length === 0) {
      throw new Error('Transfer not found');
    }
    
    const transfer = transferResult.rows[0];
    
    // Record 2 separate blockchain transactions - seller and buyer
    const timestamp = Math.floor(Date.now() / 1000);
    const hashes = [];
    
    try {
      // Seller transaction
      const sellerPayload = {
        title_number: transfer.title_number,
        from_owner: transfer.from_owner,
        to_owner: transfer.to_owner,
        transfer_fee: transfer.consideration_amount?.toString() || '0',
        transfer_date: timestamp,
        transaction_type: 'TRANSFER',
        transfer_id: transfer.transfer_id.toString(),
        owner_name: transfer.from_owner
      };
      
      console.log(`🔗 Recording seller transaction: ${transfer.from_owner}`);
      const sellerResponse = await blockchainClient.recordTransfer(sellerPayload);
      if (sellerResponse.success && sellerResponse.blockchainHash) {
        hashes.push(sellerResponse.blockchainHash);
        console.log(`✅ Seller hash: ${sellerResponse.blockchainHash}`);
      }
      
      // Buyer transaction
      const buyerPayload = {
        title_number: transfer.title_number,
        from_owner: transfer.from_owner,
        to_owner: transfer.to_owner,
        transfer_fee: transfer.consideration_amount?.toString() || '0',
        transfer_date: timestamp,
        transaction_type: 'TRANSFER',
        transfer_id: transfer.transfer_id.toString(),
        owner_name: transfer.to_owner
      };
      
      console.log(`🔗 Recording buyer transaction: ${transfer.to_owner}`);
      const buyerResponse = await blockchainClient.recordTransfer(buyerPayload);
      if (buyerResponse.success && buyerResponse.blockchainHash) {
        hashes.push(buyerResponse.blockchainHash);
        console.log(`✅ Buyer hash: ${buyerResponse.blockchainHash}`);
      }
      
      if (hashes.length > 0) {
        // Update transfer with blockchain hash
        await pool.query(
          'UPDATE land_transfers SET blockchain_hash = $1, status = $2, transfer_date = NOW() WHERE transfer_id = $3',
          [hashes.join(','), 'COMPLETED', transfer_id]
        );
        console.log(`✅ Stored ${hashes.length} blockchain hashes`);
      } else {
        // No hashes, just update status
        await pool.query(
          'UPDATE land_transfers SET status = $1, transfer_date = NOW() WHERE transfer_id = $2',
          ['COMPLETED', transfer_id]
        );
      }
    } catch (blockchainError) {
      console.error('⚠️ Blockchain recording failed:', blockchainError.message);
      // Continue with transfer even if blockchain fails
      await pool.query(
        'UPDATE land_transfers SET status = $1, transfer_date = NOW() WHERE transfer_id = $2',
        ['COMPLETED', transfer_id]
      );
    }
    
    // Update land title ownership and contact details
    await pool.query(
      `UPDATE land_titles SET 
        owner_name = $1,
        contact_no = $2,
        email_address = $3,
        address = $4,
        updated_at = NOW()
      WHERE id = $5`,
      [
        transfer.to_owner,
        transfer.buyer_contact,
        transfer.buyer_email,
        transfer.buyer_address,
        transfer.land_title_id
      ]
    );
    
    console.log(`🏠 Land title ownership updated: ${transfer.title_number} (${transfer.from_owner} -> ${transfer.to_owner})`);
    
    return { transfer, message: 'Transfer completed and ownership updated' };
    
  } catch (error) {
    console.error('❌ Process payment confirmed failed:', error.message);
    throw error;
  }
};

const updateTransfer = async (transferId, updateData) => {
  try {
    // Check if transfer exists and is PENDING
    const checkResult = await pool.query(
      'SELECT * FROM land_transfers WHERE transfer_id = $1',
      [transferId]
    );
    
    if (checkResult.rows.length === 0) {
      throw new Error('Transfer not found');
    }
    
    const transfer = checkResult.rows[0];
    
    if (transfer.status !== 'PENDING') {
      throw new Error('Only PENDING transfers can be updated');
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    // Map buyer_name to to_owner
    if (updateData.buyer_name !== undefined || updateData.to_owner !== undefined) {
      updates.push(`to_owner = $${paramCount++}`);
      values.push(updateData.buyer_name || updateData.to_owner);
    }
    if (updateData.buyer_contact !== undefined) {
      updates.push(`buyer_contact = $${paramCount++}`);
      values.push(updateData.buyer_contact);
    }
    if (updateData.buyer_email !== undefined) {
      updates.push(`buyer_email = $${paramCount++}`);
      values.push(updateData.buyer_email);
    }
    if (updateData.buyer_address !== undefined) {
      updates.push(`buyer_address = $${paramCount++}`);
      values.push(updateData.buyer_address);
    }
    if (updateData.consideration_amount !== undefined) {
      updates.push(`consideration_amount = $${paramCount++}`);
      values.push(updateData.consideration_amount);
    }
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(transferId);
    
    const query = `
      UPDATE land_transfers 
      SET ${updates.join(', ')} 
      WHERE transfer_id = $${paramCount} 
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    console.log(`✅ Transfer updated: ${transferId}`);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Update transfer failed:', error.message);
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
  updateTransfer,
  deleteTransfer,
  processPaymentConfirmed
};