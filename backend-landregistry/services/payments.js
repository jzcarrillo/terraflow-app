const { pool } = require('../config/db');
const { STATUS } = require('../config/constants');

const paymentStatusUpdate = async (messageData) => {
  const { transaction_id, status } = messageData;
  
  try {
    console.log(`💳 Updating land title status for transaction: ${transaction_id}`);
    console.log(`🔄 New status: ${status}`);
    
    // Update land title status to ACTIVE when payment is PAID
    const query = `
      UPDATE land_titles 
      SET status = $1, updated_at = NOW()
      WHERE transaction_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [STATUS.ACTIVE, transaction_id]);
    
    if (result.rows.length > 0) {
      const landTitle = result.rows[0];
      console.log(`✅ Land title ${landTitle.title_number} activated successfully`);
      return landTitle;
    } else {
      console.log(`⚠️ No land title found for transaction: ${transaction_id}`);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ Payment status update failed:`, error.message);
    throw error;
  }
};

module.exports = {
  paymentStatusUpdate
};