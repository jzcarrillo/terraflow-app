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
      
// CREATE USERS TABLE
      const { TABLES, STATUS } = require('./constants');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLES.USERS} (
          id SERIAL PRIMARY KEY,
          email_address VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(30) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          location TEXT,
          transaction_id UUID,
          status VARCHAR(50) DEFAULT '${STATUS.ACTIVE}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
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