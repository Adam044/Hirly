require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        const tables = ['applications', 'professionals', 'contracts', 'services', 'profile_views', 'reviews', 'interview_sessions'];
        for (const table of tables) {
            console.log(`\n--- Columns in ${table} ---`);
            const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
            console.log(res.rows.map(r => r.column_name).join(', '));
        }
        
        console.log(`\n--- Table count for professionals vs freelancers ---`);
        const profCount = await pool.query("SELECT COUNT(*) FROM professionals");
        console.log(`Professionals: ${profCount.rows[0].count}`);
        
        try {
            const freeCount = await pool.query("SELECT COUNT(*) FROM freelancers");
            console.log(`Freelancers: ${freeCount.rows[0].count}`);
        } catch (e) {
            console.log("Freelancers table does not exist or error.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSchema();
