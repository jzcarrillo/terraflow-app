const { pool } = require('../config/db');
const rabbitmq = require('../utils/rabbitmq');
const { checkTitleExists, validateWithSchema } = require('../utils/validation');
const { handleError } = require('../utils/errorHandler');
const { QUEUES, EVENT_TYPES, STATUS } = require('../config/constants');

const landTitleCreation = async (messageData) => {
  const { transaction_id, land_title_data, attachments, user_id } = messageData;
  
  console.log('\n🏠 ===== CREATE LAND TITLE =====');
  console.log(`🔑 Transaction: ${transaction_id}`);
  console.log(`🏷️ Title: ${land_title_data.title_number}`);
  console.log('📦 Request Payload:', JSON.stringify(land_title_data, null, 2));
  
  try {
    const { landTitleSchema } = require('../schemas/landtitles');
    const validatedData = validateWithSchema(landTitleSchema, land_title_data);
    
    const exists = await checkTitleExists(validatedData.title_number);
    if (exists) {
      console.log(`❌ FAILED: Title ${validatedData.title_number} already exists`);
      throw new Error(`Title number ${validatedData.title_number} already exists in database`);
    }

// CREATE LAND TITLE WITH PENDING STATUS
    const insertQuery = `
      INSERT INTO land_titles (
        title_number, owner_name, contact_no, email_address, address, 
        property_location, lot_number, survey_number, area_size, 
        classification, registration_date, registrar_office, 
        previous_title_number, encumbrances, transaction_id, 
        status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      validatedData.title_number,
      validatedData.owner_name,
      validatedData.contact_no,
      validatedData.email_address,
      validatedData.address,
      validatedData.property_location,
      validatedData.lot_number,
      validatedData.survey_number,
      validatedData.area_size,
      validatedData.classification,
      validatedData.registration_date,
      validatedData.registrar_office,
      validatedData.previous_title_number,
      validatedData.encumbrances,
      transaction_id,
      STATUS.PENDING,
      user_id
    ]);
    
    const landTitle = result.rows[0];
    
    await rabbitmq.publishToQueue(QUEUES.DOCUMENTS, {
      event_type: EVENT_TYPES.DOCUMENT_UPLOAD,
      transaction_id: transaction_id,
      land_title_id: landTitle.id,
      attachments: attachments,
      user_id: user_id
    });
    
    console.log(`✅ Land title created successfully (ID: ${landTitle.id})`);
    console.log(`⏳ STATUS: PENDING (Waiting for Payment)`);
    console.log(`📤 Message published to queue_documents: ${attachments ? attachments.length : 0} files`);
    
    return landTitle;
    
  } catch (error) {
    throw error;
  }
};

const getAllLandTitles = async () => {
  try {
    const query = 'SELECT * FROM land_titles ORDER BY created_at DESC';
    const result = await pool.query(query);
    console.log(`📋 Retrieved ${result.rows.length} land titles`);
    return result.rows;
  } catch (error) {
    console.error(`❌ Get all land titles failed:`, error.message);
    throw error;
  }
};

const getLandTitleById = async (id) => {
  try {
    const query = 'SELECT * FROM land_titles WHERE id = $1';
    const result = await pool.query(query, [id]);
    const title = result.rows[0];
    console.log(`🔍 Land title ${id}: ${title ? 'FOUND' : 'NOT FOUND'}`);
    return title || null;
  } catch (error) {
    console.error(`❌ Get land title by ID failed:`, error.message);
    throw error;
  }
};

module.exports = {
  landTitleCreation,
  getAllLandTitles,
  getLandTitleById
};