const { pool } = require('../config/db');

const initializeDatabase = async () => {
  try {
    console.log('🔧 Initializing database tables...');
    
    // Create land_titles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS land_titles (
        id SERIAL PRIMARY KEY,
        title_number VARCHAR(50) UNIQUE NOT NULL,
        survey_number VARCHAR(50),
        owner_name VARCHAR(255) NOT NULL,
        contact_no VARCHAR(11),
        email_address VARCHAR(255),
        address TEXT,
        property_location VARCHAR(255),
        lot_number INTEGER,
        area_size DECIMAL(10,2),
        classification VARCHAR(100),
        registration_date DATE,
        registrar_office VARCHAR(255),
        previous_title_number VARCHAR(50),
        encumbrances TEXT,
        transaction_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'PENDING',
        blockchain_hash VARCHAR(255),
        cancellation_hash VARCHAR(255),
        cancelled_at TIMESTAMP,
        reactivation_hash VARCHAR(255),
        reactivated_at TIMESTAMP,
        reactivation_reason TEXT,
        transfer_count INTEGER DEFAULT 0,
        last_transfer_date TIMESTAMP,
        transfer_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER
      )
    `);
    console.log('✅ land_titles table created/verified');
    
    // Create land_transfers table with Buyer/Seller terminology
    await pool.query(`
      CREATE TABLE IF NOT EXISTS land_transfers (
        transfer_id VARCHAR(50) PRIMARY KEY,
        title_number VARCHAR(50) NOT NULL,
        seller_name VARCHAR(255) NOT NULL,
        seller_contact VARCHAR(11),
        seller_email VARCHAR(255),
        seller_address TEXT,
        buyer_name VARCHAR(255) NOT NULL,
        buyer_contact VARCHAR(11) NOT NULL,
        buyer_email VARCHAR(255) NOT NULL,
        buyer_address TEXT NOT NULL,
        transfer_fee DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        payment_id INTEGER,
        blockchain_hash VARCHAR(255),
        transfer_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER
      )
    `);
    console.log('✅ land_transfers table created/verified');
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_land_titles_title_number ON land_titles(title_number);
      CREATE INDEX IF NOT EXISTS idx_land_titles_status ON land_titles(status);
      CREATE INDEX IF NOT EXISTS idx_land_transfers_title_number ON land_transfers(title_number);
      CREATE INDEX IF NOT EXISTS idx_land_transfers_status ON land_transfers(status);
    `);
    console.log('✅ Database indexes created/verified');
    
    console.log('🎉 Database initialization completed successfully');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

module.exports = { initializeDatabase };