const { pool } = require('../config/db');
const rabbitmq = require('../utils/rabbitmq');
const { validateWithSchema } = require('../utils/validation');

const createMortgage = async (messageData) => {
  console.log('\n🏦 ===== CREATE MORTGAGE =====');
  console.log('📦 Full messageData:', JSON.stringify(messageData, null, 2));
  
  const { transaction_id, mortgage_data, attachments, user_id } = messageData;
  
  console.log(`🔑 Transaction: ${transaction_id}`);
  console.log(`📎 Attachments received:`, attachments ? attachments.length : 0);
  
  try {
    const { mortgageSchema } = require('../schemas/mortgages');
    const validatedData = validateWithSchema(mortgageSchema, mortgage_data);
  console.log('📦 Validated mortgage data:', JSON.stringify(validatedData, null, 2));
    
    // Check if land title exists and is ACTIVE
    const landTitleQuery = 'SELECT * FROM land_titles WHERE id = $1';
    const landTitleResult = await pool.query(landTitleQuery, [validatedData.land_title_id]);
    
    if (landTitleResult.rows.length === 0) {
      throw new Error('Land title not found');
    }
    
    const landTitle = landTitleResult.rows[0];
    
    if (landTitle.status !== 'ACTIVE') {
      throw new Error('Only ACTIVE land titles can be mortgaged');
    }
    
    // Validate owner name matches
    if (landTitle.owner_name !== validatedData.owner_name) {
      throw new Error('Owner name does not match land title owner');
    }
    
    // Check mortgage amount vs appraised value (if available)
    if (landTitle.appraised_value && validatedData.amount > landTitle.appraised_value) {
      throw new Error('Mortgage amount exceeds appraised value');
    }
    
    // Check maximum 3 ACTIVE/PENDING mortgages
    const countQuery = 'SELECT COUNT(*) FROM mortgages WHERE land_title_id = $1 AND status IN ($2, $3)';
    const countResult = await pool.query(countQuery, [validatedData.land_title_id, 'ACTIVE', 'PENDING']);
    
    if (parseInt(countResult.rows[0].count) >= 3) {
      throw new Error('Maximum 3 mortgages allowed per land title');
    }
    
    // Check for pending transfers
    const transferCheck = await pool.query(
      'SELECT transfer_id FROM land_transfers WHERE land_title_id = $1 AND status = $2',
      [validatedData.land_title_id, 'PENDING']
    );
    
    if (transferCheck.rows.length > 0) {
      throw new Error(`Cannot create mortgage. Land title has a pending transfer (${transferCheck.rows[0].transfer_id}).`);
    }
    
    // Check for duplicate mortgage (same bank and land title with PENDING or ACTIVE status)
    const duplicateQuery = 'SELECT COUNT(*) FROM mortgages WHERE land_title_id = $1 AND bank_name = $2 AND status IN ($3, $4)';
    const duplicateResult = await pool.query(duplicateQuery, [validatedData.land_title_id, validatedData.bank_name, 'PENDING', 'ACTIVE']);
    
    if (parseInt(duplicateResult.rows[0].count) > 0) {
      throw new Error('Duplicate mortgage already exists');
    }
    
    // Calculate lien position based on ACTIVE and PENDING mortgages
    const lienPositionQuery = 'SELECT COUNT(*) FROM mortgages WHERE land_title_id = $1 AND status IN ($2, $3)';
    const lienResult = await pool.query(lienPositionQuery, [validatedData.land_title_id, 'ACTIVE', 'PENDING']);
    const lienPosition = parseInt(lienResult.rows[0].count) + 1;
    
    // Generate mortgage ID: MTG-YYYY-timestamp
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    const mortgageId = `MTG-${year}-${timestamp}`;
    
    // Insert mortgage with PENDING status
    const insertQuery = `
      INSERT INTO mortgages (
        mortgage_id, land_title_id, bank_name, amount,
        owner_name, details, attachments, status, lien_position, transaction_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const insertResult = await pool.query(insertQuery, [
      mortgageId,
      validatedData.land_title_id,
      validatedData.bank_name,
      validatedData.amount,
      validatedData.owner_name,
      validatedData.details || null,
      validatedData.attachments || null,
      'PENDING',
      lienPosition,
      transaction_id,
      user_id
    ]);
    
    const mortgage = insertResult.rows[0];
    
    // Publish to documents queue if attachments exist
    if (attachments && attachments.length > 0) {
      await rabbitmq.publishToQueue('queue_documents', {
        event_type: 'DOCUMENT_UPLOAD',
        transaction_id: transaction_id,
        land_title_id: validatedData.land_title_id,
        mortgage_id: mortgage.id,
        attachments: attachments,
        user_id: user_id
      });
    }
    
    console.log(`✅ Mortgage created successfully (ID: ${mortgage.id})`);
    console.log(`⏳ STATUS: PENDING (Waiting for Payment)`);
    
    return mortgage;
    
  } catch (error) {
    console.error(`❌ Create mortgage failed:`, error.message);
    throw error;
  }
};

const cancelMortgage = async (id) => {
  try {
    const checkQuery = 'SELECT * FROM mortgages WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('Mortgage not found');
    }
    
    const mortgage = checkResult.rows[0];
    
    if (mortgage.status === 'ACTIVE') {
      throw new Error('Cannot cancel ACTIVE mortgage');
    }
    
    const updateQuery = 'UPDATE mortgages SET status = $1 WHERE id = $2 RETURNING *';
    const result = await pool.query(updateQuery, ['CANCELLED', id]);
    
    console.log(`✅ Mortgage ${id} cancelled successfully`);
    return result.rows[0];
    
  } catch (error) {
    console.error(`❌ Cancel mortgage failed:`, error.message);
    throw error;
  }
};

const updateMortgage = async (id, updateData) => {
  try {
    const checkQuery = 'SELECT * FROM mortgages WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('Mortgage not found');
    }
    
    const mortgage = checkResult.rows[0];
    
    // Restrict editing land_title_id when ACTIVE
    if (mortgage.status === 'ACTIVE' && updateData.land_title_id) {
      throw new Error('Cannot change land_title_id for ACTIVE mortgage');
    }
    
    // Build dynamic update query
    const allowedFields = ['amount', 'bank_name', 'details', 'attachments'];
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(updateData[field]);
        paramCount++;
      }
    }
    
    if (updates.length === 0) {
      return mortgage;
    }
    
    values.push(id);
    const updateQuery = `UPDATE mortgages SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(updateQuery, values);
    
    console.log(`✅ Mortgage ${id} updated successfully`);
    return result.rows[0];
    
  } catch (error) {
    console.error(`❌ Update mortgage failed:`, error.message);
    throw error;
  }
};

const checkTransferEligibility = async (landTitleId) => {
  try {
    const query = 'SELECT COUNT(*) FROM mortgages WHERE land_title_id = $1 AND status IN ($2, $3)';
    const result = await pool.query(query, [landTitleId, 'PENDING', 'ACTIVE']);
    
    const hasMortgages = parseInt(result.rows[0].count) > 0;
    return !hasMortgages;
    
  } catch (error) {
    console.error(`❌ Check transfer eligibility failed:`, error.message);
    throw error;
  }
};

const getMortgagesForPayment = async (referenceType) => {
  try {
    let query;
    
    if (referenceType === 'mortgage') {
      query = 'SELECT * FROM mortgages WHERE status = $1 ORDER BY created_at DESC';
      const result = await pool.query(query, ['PENDING']);
      return result.rows;
    } else if (referenceType === 'mortgage_release') {
      query = 'SELECT * FROM mortgages WHERE status = $1 ORDER BY created_at DESC';
      const result = await pool.query(query, ['ACTIVE']);
      return result.rows;
    } else {
      // Default: return PENDING mortgages
      query = 'SELECT * FROM mortgages WHERE status = $1 ORDER BY created_at DESC';
      const result = await pool.query(query, ['PENDING']);
      return result.rows.filter(m => m.status === 'PENDING');
    }
    
  } catch (error) {
    console.error(`❌ Get mortgages for payment failed:`, error.message);
    throw error;
  }
};

const createReleaseMortgage = async (data) => {
  const { mortgage_id, user_id } = data;
  
  try {
    const checkQuery = 'SELECT * FROM mortgages WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [mortgage_id]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('Mortgage not found');
    }
    
    const mortgage = checkResult.rows[0];
    
    if (mortgage.status !== 'ACTIVE') {
      throw new Error('Only ACTIVE mortgages can be released');
    }
    
    // Publish release payment creation event to payments queue
    const releaseAmount = mortgage.amount * 0.01; // 1% of mortgage amount as release fee
    
    await rabbitmq.publishToQueue('queue_payments', {
      event_type: 'CREATE_RELEASE_PAYMENT',
      mortgage_id: mortgage.mortgage_id || mortgage.id.toString(),
      reference_id: mortgage.mortgage_id || mortgage.id.toString(),
      reference_type: 'mortgage_release',
      amount: releaseAmount,
      description: mortgage.owner_name,
      user_id: user_id
    });
    
    console.log(`✅ Release payment event published for mortgage ${mortgage_id}`);
    
    return mortgage;
    
  } catch (error) {
    console.error(`❌ Create release mortgage failed:`, error.message);
    throw error;
  }
};

const updateReleaseMortgage = async (id, updateData) => {
  try {
    const checkQuery = 'SELECT * FROM mortgages WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('Mortgage not found');
    }
    
    const allowedFields = ['release_fee'];
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(updateData[field]);
        paramCount++;
      }
    }
    
    if (updates.length === 0) {
      return checkResult.rows[0];
    }
    
    values.push(id);
    const updateQuery = `UPDATE mortgages SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(updateQuery, values);
    
    console.log(`✅ Release mortgage ${id} updated successfully`);
    return result.rows[0];
    
  } catch (error) {
    console.error(`❌ Update release mortgage failed:`, error.message);
    throw error;
  }
};

const cancelReleaseMortgage = async (id) => {
  try {
    const checkQuery = 'SELECT * FROM mortgages WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('Mortgage not found');
    }
    
    const updateQuery = 'UPDATE mortgages SET release_status = $1 WHERE id = $2 RETURNING *';
    const result = await pool.query(updateQuery, ['CANCELLED', id]);
    
    console.log(`✅ Release mortgage ${id} cancelled successfully`);
    return result.rows[0];
    
  } catch (error) {
    console.error(`❌ Cancel release mortgage failed:`, error.message);
    throw error;
  }
};

const getLandTitlesForMortgage = async () => {
  try {
    const query = 'SELECT * FROM land_titles WHERE status = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, ['ACTIVE']);
    
    console.log(`📋 Retrieved ${result.rows.length} ACTIVE land titles for mortgage`);
    return result.rows;
    
  } catch (error) {
    console.error(`❌ Get land titles for mortgage failed:`, error.message);
    throw error;
  }
};

module.exports = {
  createMortgage,
  cancelMortgage,
  updateMortgage,
  checkTransferEligibility,
  getMortgagesForPayment,
  createReleaseMortgage,
  updateReleaseMortgage,
  cancelReleaseMortgage,
  getLandTitlesForMortgage
};
