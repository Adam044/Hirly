require('dotenv').config({ quiet: true });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query(fs.readFileSync(path.join(__dirname, '../supabase/migrations/add_encrypted_access_key_to_jobs.sql'), 'utf8'));
    const result = await client.query("SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'jobs' AND column_name = 'access_key_encrypted'");
    if (result.rows[0]?.data_type !== 'text') throw new Error('Encrypted access-key column verification failed.');
    await client.query('COMMIT');
    console.log('Verified jobs.access_key_encrypted. Existing hashes and passwords were not changed.');
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    throw error;
  } finally {
    client?.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('Direct-access migration failed:', error.code || error.message);
  process.exitCode = 1;
});
