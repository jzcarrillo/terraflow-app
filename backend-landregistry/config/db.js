const { Pool } = require('pg');
const config = require('./services');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
});

// INITIALIZE DATABASE WITH RETRY LOGIC
const initializeDatabase = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {

// TEST CONNECTION FIRST
      const client = await pool.connect();
      client.release();
      
// CREATE LAND_TITLES TABLE
      const { TABLES, STATUS } = require('./constants');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLES.LAND_TITLES} (
          id SERIAL PRIMARY KEY,
          owner_name VARCHAR(255),
          contact_no VARCHAR(20),
          email_address VARCHAR(255),
          title_number VARCHAR(20) UNIQUE NOT NULL,
          address TEXT,
          property_location VARCHAR(100),
          lot_number INT,
          survey_number VARCHAR(20),
          area_size NUMERIC,
          classification VARCHAR(50),
          registration_date DATE,
          registrar_office VARCHAR(100),
          previous_title_number VARCHAR(100),
          encumbrances TEXT,
          transaction_id UUID,
          status VARCHAR(50) DEFAULT '${STATUS.PENDING}',
          created_by INT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // ADD EMAIL_ADDRESS COLUMN IF NOT EXISTS
      await pool.query(`
        ALTER TABLE ${TABLES.LAND_TITLES} 
        ADD COLUMN IF NOT EXISTS email_address VARCHAR(255)
      `);
      
      console.log('✅ Database tables initialized successfully');
      return;

    } catch (error) {
      if (i === retries - 1) {
        console.error('❌ Database initialization failed after all retries:', error.message);
        return;
      }
// WAIT 5 SECONDS BEFORE RETRY
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// TEST DATABASE CONNECTION
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

// INITIALIZE ON STARTUP WITH DELAY
setTimeout(() => {
  initializeDatabase();
}, 10000); // WAIT 10 SECONDS FOR POSTGRESQL TO BE READY

module.exports = { pool, testConnection, initializeDatabase };