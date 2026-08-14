const logger = require('../utils/logger');
const crypto = require('crypto');

class EmployerReviewService {
    constructor(pool) {
        this.pool = pool;
    }

    async generateOTP(jobId, email) {
        const client = await this.pool.connect();
        const numericJobId = parseInt(jobId);
        try {
            // 1. Verify that this job is external and has this email
            const jobResult = await client.query(
                `SELECT id, external_company_email 
                 FROM jobs 
                 WHERE id = $1 AND is_external = true AND external_company_email = $2`,
                [numericJobId, email]
            );

            if (jobResult.rows.length === 0) {
                throw new Error('Unauthorized: Email does not match the company email for this job.');
            }

            // 2. Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

            // 3. Store in DB
            await client.query(
                `DELETE FROM employer_lead_otps WHERE job_id = $1 AND email = $2`,
                [numericJobId, email]
            );

            await client.query(
                `INSERT INTO employer_lead_otps (job_id, email, otp, expires_at) 
                 VALUES ($1, $2, $3, $4)`,
                [numericJobId, email, otp, expiresAt]
            );

            return otp;
        } finally {
            client.release();
        }
    }

    async verifyOTP(jobId, email, otp) {
        const client = await this.pool.connect();
        const numericJobId = parseInt(jobId);
        try {
            const result = await client.query(
                `SELECT * FROM employer_lead_otps 
                 WHERE job_id = $1 AND email = $2 AND otp = $3 AND expires_at > NOW()`,
                [numericJobId, email, otp]
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'Invalid or expired verification code.' };
            }

            // Clean up used OTP
            await client.query(
                `DELETE FROM employer_lead_otps WHERE job_id = $1 AND email = $2`,
                [numericJobId, email]
            );

            return { success: true };
        } finally {
            client.release();
        }
    }

    async getJobAndApplicants(jobId) {
        const client = await this.pool.connect();
        try {
            // Fetch job details
            const jobResult = await client.query(
                `SELECT j.id, j.title, j.description, j.external_company_name, j.external_company_logo, j.deadline,
                        COALESCE(e.company_name, j.external_company_name, 'Opportunity') as company_name 
                 FROM jobs j
                 LEFT JOIN employers e ON j.employer_id = e.id
                 WHERE j.id = $1`,
                [jobId]
            );

            if (jobResult.rows.length === 0) return null;

            // Fetch applicants with AI evaluations
            const applicantsResult = await client.query(
                `SELECT 
                    a.id as application_id,
                    u.first_name,
                    u.last_name,
                    u.profile_picture_url,
                    u.country,
                    u.city,
                    p.profession,
                    p.skills,
                    ev.match_score,
                    ev.verdict,
                    ev.summary,
                    ev.strengths,
                    ev.weaknesses,
                    dr.detailed_summary,
                    dr.detailed_strengths as matched_skills,
                    dr.detailed_weaknesses as missing_skills,
                    dr.interview_questions
                 FROM applications a
                 JOIN users u ON a.professional_id = u.id
                 LEFT JOIN professionals p ON u.id = p.user_id
                 LEFT JOIN application_ai_evaluations ev ON a.id = ev.application_id
                 LEFT JOIN deep_reports dr ON a.id = dr.application_id
                 WHERE a.job_id = $1
                 ORDER BY ev.match_score DESC NULLS LAST`,
                [jobId]
            );

            const applicants = applicantsResult.rows;

            // Calculate summary stats
            const stats = {
                total: applicants.length,
                high: applicants.filter(a => a.verdict === 'Strong Hire').length,
                strong: applicants.filter(a => a.verdict === 'Interview').length,
                other: applicants.filter(a => !['Strong Hire', 'Interview'].includes(a.verdict)).length
            };

            return {
                job: jobResult.rows[0],
                applicants,
                stats
            };
        } finally {
            client.release();
        }
    }
}

module.exports = EmployerReviewService;
