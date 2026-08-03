const { Pool } = require('pg');
const logger = require('./utils/logger');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugQueries() {
  const client = await pool.connect();
  try {
    logger.debug('--- Debugging Employers Query ---');
    const employersQuery = `
        SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.city, u.is_email_verified,
               e.company_name, e.employer_type, e.id_verification_path, e.verification_status, e.id_rejection_reason, e.company_logo_path
        FROM users u JOIN employers e ON u.id = e.user_id
    `;
    const employersRes = await client.query(employersQuery);
    logger.debug(`Employers found: ${employersRes.rows.length}`);
    if (employersRes.rows.length === 0) {
        // Check if there are any users with type 'employer'
        const usersRes = await client.query("SELECT COUNT(*) FROM users WHERE user_type = 'employer'");
        logger.debug(`Total users with type 'employer': ${usersRes.rows[0].count}`);
        
        // Check if there are any rows in employers table
        const employersTableRes = await client.query("SELECT COUNT(*) FROM employers");
        logger.debug(`Total rows in 'employers' table: ${employersTableRes.rows[0].count}`);
    } else {
        logger.debug('First employer sample:', employersRes.rows[0]);
    }

    logger.debug('\n--- Debugging Jobs With Applications Query ---');
    const jobsAppQuery = `
        SELECT DISTINCT j.id, j.title, j.description, j.budget, j.currency, j.city, j.category, j.created_at, j.employer_id,
               u.first_name as employer_first_name, u.last_name as employer_last_name, u.email as employer_email,
               e.company_name as employer_company_name, COUNT(a.id) as application_count,
               CASE WHEN jan.job_id IS NOT NULL THEN true ELSE false END as notification_sent
        FROM jobs j JOIN users u ON j.employer_id = u.id LEFT JOIN employers e ON u.id = e.user_id
        JOIN applications a ON j.id = a.job_id LEFT JOIN job_application_notifications jan ON j.id = jan.job_id
        WHERE j.status = 'open'
        GROUP BY j.id, j.title, j.description, j.budget, j.currency, j.city, j.category, j.created_at, j.employer_id,
                 u.first_name, u.last_name, u.email, e.company_name, jan.job_id
        HAVING COUNT(a.id) > 0 ORDER BY j.created_at DESC
    `;
    
    try {
        const jobsAppRes = await client.query(jobsAppQuery);
        logger.debug(`Jobs with applications found: ${jobsAppRes.rows.length}`);
        if (jobsAppRes.rows.length > 0) {
             logger.debug('First job sample:', jobsAppRes.rows[0]);
        } else {
            // Check counts
            const jobsCount = await client.query("SELECT COUNT(*) FROM jobs WHERE status = 'open'");
            const appsCount = await client.query("SELECT COUNT(*) FROM applications");
            logger.debug(`Open jobs: ${jobsCount.rows[0].count}, Total applications: ${appsCount.rows[0].count}`);
        }
    } catch (err) {
        logger.error('Jobs Query Error:', err.message);
    }

  } catch (err) {
    logger.error('General Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

debugQueries();
