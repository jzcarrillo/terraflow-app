const { Pool } = require('pg');
const { TABLES, STATUS } = require('./constants');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'terraflow_documents',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_actual_postgres_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const initializeDatabase = async () => {
  try {

    
    // First create database if it doesn't exist
    const { Client } = require('pg');
    const adminClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: 'postgres', // Connect to default postgres database
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'your_actual_postgres_password',
    });
    
    await adminClient.connect();
    
    // Check if database exists, create if not
    const dbName = process.env.DB_NAME || 'terraflow_documents';
    const result = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    
    if (result.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
    }
    
    await adminClient.end();
    
    // Now connect to the actual database
    const client = await pool.connect();

    
    // Create documents table
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
        status VARCHAR(20) DEFAULT '${STATUS.ACTIVE}',
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