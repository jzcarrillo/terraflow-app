const { Pool } = require('pg');
const { TABLES, STATUS } = require('./constants');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'terraflow_documents',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const initializeDatabase = async () => {
  try {

// CONNECT TO EXISTING DATABASE
    console.log('Connecting to database...');
    
    const client = await pool.connect();
    console.log('✅ Database connected');
    
// CREATE DOCUMENTS TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.DOCUMENTS} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        land_title_id INT NOT NULL,
        transaction_id UUID,
        document_type VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        uploaded_by INT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase
};