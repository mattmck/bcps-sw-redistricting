import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be established
});

// Test database connection on startup
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

// Query helper function
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Get a client from the pool for transactions
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

// Test database connection
export const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as now, PostGIS_Version() as postgis_version');
    console.log('✓ Database connection test successful');
    console.log('  Time:', result.rows[0].now);
    console.log('  PostGIS:', result.rows[0].postgis_version);
    return true;
  } catch (error) {
    console.error('✗ Database connection test failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closePool = async () => {
  await pool.end();
  console.log('✓ Database connection pool closed');
};

export default pool;
