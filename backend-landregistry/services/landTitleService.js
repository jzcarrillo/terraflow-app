const { pool } = require('../config/db');
const { TABLES, STATUS } = require('../config/constants');

class LandTitleService {


  async checkTitleExists(titleNumber) {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM ${TABLES.LAND_TITLES} WHERE title_number = $1`,
      [titleNumber]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  async createLandTitle(data) {
    const { 
      owner_name, contact_no, title_number, address, property_location, 
      lot_number, survey_number, area_size, classification,
      registration_date, registrar_office, previous_title_number, encumbrances 
    } = data;

    const result = await pool.query(`
      INSERT INTO ${TABLES.LAND_TITLES} (
        owner_name, contact_no, title_number, address, property_location,
        lot_number, survey_number, area_size, classification, registration_date,
        registrar_office, previous_title_number, encumbrances, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      owner_name, contact_no, title_number, address, property_location,
      lot_number, survey_number, area_size, classification, registration_date,
      registrar_office, previous_title_number, encumbrances, STATUS.PENDING
    ]);

    return result.rows[0];
  }

  validateRequiredFields(data) {
    const { 
      owner_name, contact_no, title_number, address, property_location, 
      lot_number, survey_number, area_size, classification,
      registration_date, registrar_office, previous_title_number, encumbrances 
    } = data;
    
    const requiredFields = {
      owner_name,
      contact_no,
      title_number,
      address,
      property_location,
      lot_number,
      survey_number,
      area_size,
      classification,
      registration_date,
      registrar_office,
      previous_title_number,
      encumbrances
    };
    
    const missingFields = [];
    
    for (const [field, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || value === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }
}

const landTitleService = new LandTitleService();
module.exports = landTitleService;