const { pool } = require('../config/db');
const publisher = require('./publisher');
const { QUEUES, EVENT_TYPES, STATUS } = require('../config/constants');

const landTitleCreation = async (messageData) => {
  const { transaction_id, land_title_data, attachments, user_id } = messageData;
  
  try {
// VALIDATE WITH ZOD FIRST
    const { landTitleSchema } = require('../schemas/landtitles');
    const validatedData = landTitleSchema.parse(land_title_data);
    console.log(`✅ Zod validation successful for title: ${validatedData.title_number}`);
    
    console.log(`📋 Processing land title creation`);
    console.log('📦 Request logs:', JSON.stringify(messageData, null, 2));
    
// CHECK IF TITLE EXISTS
    const existsQuery = 'SELECT id FROM land_titles WHERE title_number = $1';
    const existsResult = await pool.query(existsQuery, [validatedData.title_number]);
    
    if (existsResult.rows.length > 0) {
      throw new Error(`Title number ${validatedData.title_number} already exists in database`);
    }

// CREATE LAND TITLE WITH PENDING STATUS
    const insertQuery = `
      INSERT INTO land_titles (
        title_number, owner_name, address, property_location, 
        lot_number, survey_number, area_size, transaction_id, 
        status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      validatedData.title_number,
      validatedData.owner_name,
      validatedData.address,
      validatedData.property_location,
      validatedData.lot_number,
      validatedData.survey_number,
      validatedData.area_size,
      transaction_id,
      STATUS.PENDING,
      user_id
    ]);
    
    const landTitle = result.rows[0];
    console.log(`✅ Land title created: ${landTitle.title_number} (ID: ${landTitle.id})`);
    
// PUBLISH DOCUMENT PROCESSING EVENT 
    await publisher.publishToQueue(QUEUES.DOCUMENTS, {
      event_type: EVENT_TYPES.DOCUMENT_UPLOAD,
      transaction_id: transaction_id,
      land_title_id: landTitle.id,
      attachments: attachments,
      user_id: user_id
    });
    
    return landTitle;
    
  } catch (error) {
    console.error(`❌ Land title creation failed:`, error.message);
    throw error;
  }
};

const checkTitleExists = async (titleNumber) => {
  try {
    const query = 'SELECT id FROM land_titles WHERE title_number = $1';
    const result = await pool.query(query, [titleNumber]);
    return result.rows.length > 0;
  } catch (error) {
    console.error(`❌ Check title exists failed:`, error.message);
    throw error;
  }
};

const checkLandTitleExists = async (titleNumber) => {
  try {
    console.log(`🔍 Checking land title exists: ${titleNumber}`);
    
    // First, let's see all titles in the database
    const allTitlesQuery = 'SELECT id, title_number FROM land_titles LIMIT 5';
    const allTitlesResult = await pool.query(allTitlesQuery);
    console.log(`📋 All titles in database (first 5):`, allTitlesResult.rows);
    
    // Now check for specific title
    const query = 'SELECT id, title_number FROM land_titles WHERE title_number = $1';
    const result = await pool.query(query, [titleNumber]);
    console.log(`📋 Found ${result.rows.length} land titles for ${titleNumber}:`, result.rows);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error(`❌ Check land title exists failed:`, error.message);
    throw error;
  }
};

const getAllLandTitles = async () => {
  try {
    const query = 'SELECT * FROM land_titles ORDER BY created_at DESC';
    const result = await pool.query(query);
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
    return result.rows[0] || null;
  } catch (error) {
    console.error(`❌ Get land title by ID failed:`, error.message);
    throw error;
  }
};

module.exports = {
  landTitleCreation,
  checkTitleExists,
  checkLandTitleExists,
  getAllLandTitles,
  getLandTitleById
};