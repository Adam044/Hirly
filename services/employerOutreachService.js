const logger = require('../utils/logger');
const cron = require('node-cron');
const sendEmployerOutreachEmailTemplate = require('../utils/emailTemplates/employerOutreach');
const { sendEmail } = require('../utils/emailService');

class EmployerOutreachService {
    constructor(pool, app) {
        this.pool = pool;
        this.app = app;
        this.isProcessing = false;
    }

    initSchedule() {
        // Run every day at 10:00 AM - DISABLED FOR MANUAL MODE
        /*
        cron.schedule('0 10 * * *', async () => {
            logger.info('[Outreach] Starting daily deadline outreach check...');
            await this.processExpiredExternalJobs();
        });
        */
        logger.info('[Outreach] Employer Outreach Service initialized (Manual Mode)');
    }

    async getPendingLeads(page = 1, limit = 10, filters = {}) {
        let client;
        try {
            client = await this.pool.connect();
            const offset = (page - 1) * limit;
            const { search, status, minApplicants, emailStatus } = filters;

            let queryConditions = ['j.is_external = true'];
            let queryParams = [];

            if (search) {
                queryParams.push(`%${search.toLowerCase()}%`);
                queryConditions.push(`(LOWER(j.title) LIKE $${queryParams.length} OR LOWER(j.external_company_name) LIKE $${queryParams.length} OR LOWER(j.external_company_email) LIKE $${queryParams.length})`);
            }

            if (status === 'pending') {
                queryConditions.push('j.auto_outreach_sent = false');
            } else if (status === 'sent') {
                queryConditions.push('j.auto_outreach_sent = true');
            }

            if (emailStatus === 'has_email') {
                queryConditions.push('j.external_company_email IS NOT NULL');
            } else if (emailStatus === 'no_email') {
                queryConditions.push('j.external_company_email IS NULL');
            }

            // For minApplicants, we need a subquery in WHERE or a CTE
            // Let's use a subquery for simplicity
            if (minApplicants && parseInt(minApplicants) > 0) {
                queryParams.push(parseInt(minApplicants));
                queryConditions.push(`(SELECT COUNT(*) FROM applications WHERE job_id = j.id) >= $${queryParams.length}`);
            }

            const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

            const countResult = await client.query(`
                SELECT COUNT(*) FROM jobs j ${whereClause}
            `, queryParams);
            const totalCount = parseInt(countResult.rows[0].count);

            const result = await client.query(`
                SELECT j.id, j.title, j.external_company_name, j.external_company_email, 
                (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count,
                (
                    SELECT COUNT(*) 
                    FROM applications a
                    JOIN application_ai_evaluations ae ON a.id = ae.application_id
                    WHERE a.job_id = j.id 
                    AND ae.verdict IN ('Strong Hire', 'Interview')
                ) as high_match_count,
                j.deadline, j.created_at, j.auto_outreach_sent
                FROM jobs j
                ${whereClause}
                ORDER BY j.auto_outreach_sent ASC, j.created_at DESC
                LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
            `, [...queryParams, limit, offset]);
            
            return {
                leads: result.rows,
                pagination: {
                    total: totalCount,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: totalCount > offset + result.rows.length
                }
            };
        } finally {
            if (client) client.release();
        }
    }

    async updateExternalCompanyEmail(jobId, email) {
        let client;
        try {
            client = await this.pool.connect();
            await client.query(
                'UPDATE jobs SET external_company_email = $1 WHERE id = $2 AND is_external = true',
                [email, jobId]
            );
            return { success: true };
        } finally {
            if (client) client.release();
        }
    }

    async sendManualOutreach(jobId, language = 'en', testEmail = null) {
        let client;
        try {
            client = await this.pool.connect();
            
            const jobResult = await client.query(`
                SELECT j.id, j.title, j.external_company_name, j.external_company_email, 
                (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count,
                (
                    SELECT COUNT(*) 
                    FROM applications a
                    JOIN application_ai_evaluations ae ON a.id = ae.application_id
                    WHERE a.job_id = j.id 
                    AND ae.verdict IN ('Strong Hire', 'Interview')
                ) as high_match_count
                FROM jobs j
                WHERE j.id = $1
            `, [jobId]);

            if (jobResult.rows.length === 0) throw new Error('Job not found');
            const job = jobResult.rows[0];

            const recipient = testEmail || job.external_company_email;
            if (!recipient) throw new Error('No recipient email found');

            const reviewUrl = `${process.env.BASE_URL || 'https://hirly.net'}/employer-review?jobId=${job.id}&email=${encodeURIComponent(recipient)}`;
            
            const { subject, html } = sendEmployerOutreachEmailTemplate(
                job.external_company_name,
                job.title,
                job.applicant_count,
                job.high_match_count,
                reviewUrl,
                language
            );

            await sendEmail(recipient, subject, html);

            // If it's not a test, mark as sent
            if (!testEmail) {
                await client.query(
                    'UPDATE jobs SET auto_outreach_sent = true WHERE id = $1',
                    [job.id]
                );
            }

            return { success: true, recipient };
        } finally {
            if (client) client.release();
        }
    }

    async processExpiredExternalJobs() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        let client;
        try {
            client = await this.pool.connect();
            
            // 1. Find jobs that:
            // - Are external
            // - Have a deadline that has passed
            // - Have at least 1 applicant
            // - Have an external_company_email
            // - Haven't had outreach sent yet
            const jobsResult = await client.query(`
                SELECT j.id, j.title, j.external_company_name, j.external_company_email, 
                (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
                FROM jobs j
                WHERE j.is_external = true
                AND j.deadline < NOW()
                AND j.external_company_email IS NOT NULL
                AND j.auto_outreach_sent = false
                AND (SELECT COUNT(*) FROM applications WHERE job_id = j.id) > 0
            `);

            logger.info(`[Outreach] Found ${jobsResult.rows.length} jobs qualifying for outreach`);

            for (const job of jobsResult.rows) {
                try {
                    await this.sendOutreach(job);
                    
                    // Mark as sent
                    await client.query(
                        'UPDATE jobs SET auto_outreach_sent = true WHERE id = $1',
                        [job.id]
                    );
                    
                    logger.info(`[Outreach] Successfully sent outreach for job ${job.id} to ${job.external_company_email}`);
                } catch (sendError) {
                    logger.error(`[Outreach] Failed to send outreach for job ${job.id}:`, sendError);
                }
            }
        } catch (error) {
            logger.error('[Outreach] Error processing expired jobs:', error);
        } finally {
            if (client) client.release();
            this.isProcessing = false;
        }
    }

    async sendOutreach(job) {
        const reviewUrl = `${process.env.BASE_URL || 'https://hirly.net'}/employer-review?jobId=${job.id}&email=${encodeURIComponent(job.external_company_email)}`;
        
        const { subject, html } = sendEmployerOutreachEmailTemplate(
            job.external_company_name,
            job.title,
            job.applicant_count,
            reviewUrl
        );

        await sendEmail(job.external_company_email, subject, html);
    }
}

module.exports = EmployerOutreachService;
