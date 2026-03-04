const { Pool } = require('pg');
const config = require('./services');

// Database configuration
const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

const pool = new Pool(dbConfig);

// Log database configuration (without password)
console.log('📊 Database Configuration:');
console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Max Connections: ${dbConfig.max}`);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
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
          transaction_id VARCHAR(50),
          blockchain_hash VARCHAR(255),
          status VARCHAR(50) DEFAULT '${STATUS.PENDING}',
          created_by VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // CREATE MORTGAGES TABLE
      console.log('Creating mortgages table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS mortgages (
          id SERIAL PRIMARY KEY,
          mortgage_id VARCHAR(50) UNIQUE NOT NULL,
          land_title_id INT REFERENCES ${TABLES.LAND_TITLES}(id) ON DELETE CASCADE,
          bank_name VARCHAR(255) NOT NULL,
          amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
          details TEXT,
          attachments TEXT,
          lien_position INT NOT NULL CHECK (lien_position BETWEEN 1 AND 3),
          owner_name VARCHAR(255) NOT NULL,
          status VARCHAR(20) DEFAULT 'PENDING',
          transaction_id VARCHAR(50),
          blockchain_hash VARCHAR(255),
          cancellation_hash VARCHAR(255),
          release_blockchain_hash VARCHAR(255),
          release_cancellation_hash VARCHAR(255),
          created_by VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // CREATE MORTGAGES INDEXES
      console.log('Creating mortgages indexes...');
      await pool.query(`
        DROP INDEX IF EXISTS idx_mortgages_bank_user
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_mortgages_land_title ON mortgages(land_title_id)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_mortgages_status ON mortgages(status)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_mortgages_lien_position ON mortgages(lien_position)
      `);
      
      // CREATE MORTGAGES AUTO-UPDATE TRIGGER
      await pool.query(`
        CREATE OR REPLACE FUNCTION update_mortgages_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);
      
      await pool.query(`
        DROP TRIGGER IF EXISTS trigger_update_mortgages_updated_at ON mortgages
      `);
      
      await pool.query(`
        CREATE TRIGGER trigger_update_mortgages_updated_at
        BEFORE UPDATE ON mortgages
        FOR EACH ROW
        EXECUTE FUNCTION update_mortgages_updated_at()
      `);
      
      // CREATE LAND_TRANSFERS TABLE
      console.log('Creating land_transfers table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS land_transfers (
          id SERIAL PRIMARY KEY,
          transfer_id VARCHAR(50) UNIQUE NOT NULL,
          land_title_id INT REFERENCES ${TABLES.LAND_TITLES}(id) ON DELETE CASCADE,
          from_owner VARCHAR(255) NOT NULL,
          to_owner VARCHAR(255) NOT NULL,
          buyer_contact VARCHAR(20),
          buyer_email VARCHAR(255),
          buyer_address TEXT,
          transfer_type VARCHAR(50) NOT NULL,
          transfer_date DATE,
          consideration_amount DECIMAL(15,2),
          status VARCHAR(20) DEFAULT 'PENDING',
          transaction_id VARCHAR(50),
          blockchain_hash VARCHAR(255),
          cancellation_hash VARCHAR(255),
          created_by VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // CREATE LAND_TRANSFERS INDEXES
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_transfers_land_title ON land_transfers(land_title_id)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_transfers_status ON land_transfers(status)
      `);
      
      // CREATE LAND_TRANSFERS AUTO-UPDATE TRIGGER
      await pool.query(`
        CREATE OR REPLACE FUNCTION update_transfers_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);
      
      await pool.query(`
        DROP TRIGGER IF EXISTS trigger_update_transfers_updated_at ON land_transfers
      `);
      
      await pool.query(`
        CREATE TRIGGER trigger_update_transfers_updated_at
        BEFORE UPDATE ON land_transfers
        FOR EACH ROW
        EXECUTE FUNCTION update_transfers_updated_at()
      `);
      
      // ADD EMAIL_ADDRESS COLUMN IF NOT EXISTS
      await pool.query(`
        ALTER TABLE ${TABLES.LAND_TITLES} 
        ADD COLUMN IF NOT EXISTS email_address VARCHAR(255)
      `);
      
      // ADD BLOCKCHAIN_HASH COLUMN IF NOT EXISTS
      await pool.query(`
        ALTER TABLE ${TABLES.LAND_TITLES} 
        ADD COLUMN IF NOT EXISTS blockchain_hash VARCHAR(255)
      `);
      
      // ADD CANCELLATION BLOCKCHAIN FIELDS
      await pool.query(`
        ALTER TABLE ${TABLES.LAND_TITLES} 
        ADD COLUMN IF NOT EXISTS cancellation_hash VARCHAR(255),
        ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS cancellation_reason TEXT
      `);
      
      // ADD REACTIVATION BLOCKCHAIN FIELDS
      await pool.query(`
        ALTER TABLE ${TABLES.LAND_TITLES} 
        ADD COLUMN IF NOT EXISTS reactivation_hash VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS reactivation_reason TEXT
      `);
      
      // ADD APPRAISED_VALUE COLUMN FOR MORTGAGE VALIDATION
      await pool.query(`
        ALTER TABLE ${TABLES.LAND_TITLES} 
        ADD COLUMN IF NOT EXISTS appraised_value DECIMAL(15,2)
      `);
      
      // ADD MORTGAGE_ID COLUMN (for existing databases created before this column was added)
      await pool.query(`
        ALTER TABLE mortgages 
        ADD COLUMN IF NOT EXISTS mortgage_id VARCHAR(50) UNIQUE
      `);
      
      // ADD DETAILS AND ATTACHMENTS COLUMNS
      console.log('Adding details column to mortgages...');
      await pool.query(`
        ALTER TABLE mortgages 
        ADD COLUMN IF NOT EXISTS details TEXT
      `);
      console.log('✅ Details column added');
      
      console.log('Adding attachments column to mortgages...');
      await pool.query(`
        ALTER TABLE mortgages 
        ADD COLUMN IF NOT EXISTS attachments TEXT
      `);
      console.log('✅ Attachments column added');
      
      console.log('✅ Database tables initialized successfully');
      return;

    } catch (error) {
      console.error(`❌ Database initialization attempt ${i + 1}/${retries} failed:`, error.message);
      console.error('Error details:', error);
      if (i === retries - 1) {
        console.error('❌ Database initialization failed after all retries');
        throw error;
      }
      console.log(`⏳ Retrying in 5 seconds...`);
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

// Database initialization handled by utils/init-database.js

module.exports = { pool, testConnection, initializeDatabase };