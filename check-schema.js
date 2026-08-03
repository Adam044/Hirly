
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    const client = await pool.connect();
    try {
        console.log('--- Users Table Columns ---');
        const usersCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log(usersCols.rows.map(r => r.column_name).join(', '));

        console.log('\n--- Professionals Table Columns ---');
        const profCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'professionals'");
        console.log(profCols.rows.map(r => r.column_name).join(', '));
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema();
