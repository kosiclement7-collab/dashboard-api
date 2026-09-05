const pool = require('./db');

// Creates the tables if they don't already exist. Safe to run every
// time the server starts.
async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL CHECK (type IN ('personal', 'business')),
      category VARCHAR(100) NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
      note TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);`);

  console.log('Migration complete: users and entries tables ready.');
}

module.exports = migrate;
