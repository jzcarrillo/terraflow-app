const { Pool } = require('pg');
const config = require('./services');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
});

// Initialize database tables with retry logic
const initializeDatabase = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Initializing database... (attempt ${i + 1}/${retries})`);
      
      // Test connection first
      const client = await pool.connect();
      client.release();
      
      // Create land_titles table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS land_titles (
          id SERIAL PRIMARY KEY,
          owner_name VARCHAR(255),
          contact_no VARCHAR(20),
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
          status VARCHAR(50) DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      console.log('Database tables initialized successfully');
      return;
    } catch (error) {
      console.error(`Database initialization attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('All database initialization attempts failed');
        return;
      }
      // Wait 5 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
  } catch (error) {
    console.error('Database connection error:', error);
  }
};

// Initialize on startup with delay
setTimeout(() => {
  initializeDatabase();
}, 10000); // Wait 10 seconds for PostgreSQL to be ready

module.exports = { pool, testConnection, initializeDatabase };