const { Pool } = require('pg');
const config = require('./services');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
});

// CREATE TABLES IF THEY DON'T EXIST
const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        payment_id VARCHAR(255) UNIQUE NOT NULL,
        reference_type VARCHAR(100) NOT NULL,
        reference_id VARCHAR(255) NOT NULL,
        transfer_id VARCHAR(50),
        amount DECIMAL(10,2) NOT NULL,
        payer_name VARCHAR(255) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'CASH',
        status VARCHAR(50) DEFAULT 'PENDING',
        created_by VARCHAR(255),
        confirmed_by VARCHAR(255),
        confirmed_at TIMESTAMP,
        cancelled_by VARCHAR(255),
        cancellation_reason TEXT,
        cancelled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NULL
      )
    `);
    console.log('✅ Payments table created/verified');
  } catch (error) {
    console.error('❌ Error creating payments table:', error.message);
  }
};

// TEST CONNECTION AND CREATE TABLES
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('❌ Error acquiring client', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL payments database');
    await createTables();
    release();
  }
});

module.exports = { pool };