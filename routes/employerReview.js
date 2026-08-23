const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const EmployerReviewService = require('../services/employerReviewService');

module.exports = function registerEmployerReviewRoutes(app, pool, { sendEmployerLeadOTPEmail, logLiveEvent }) {
    const service = new EmployerReviewService(pool);

    // 1. Send OTP to employer lead
    router.post('/send-otp', async (req, res) => {
        const email = req.body.email;
        const jobId = parseInt(req.body.jobId);
        
        if (!jobId || !email) {
            return res.status(400).json({ error: 'Job ID and email are required.' });
        }

        try {
            // Get job title for the email
            const jobResult = await pool.query('SELECT title FROM jobs WHERE id = $1', [jobId]);
            if (jobResult.rows.length === 0) {
                return res.status(404).json({ error: 'Job not found.' });
            }
            const jobTitle = jobResult.rows[0].title;

            const otp = await service.generateOTP(jobId, email);
            await sendEmployerLeadOTPEmail(email, otp, jobTitle);

            res.json({ success: true, message: 'Verification code sent to your email.' });
        } catch (error) {
            logger.error('Error sending employer lead OTP:', error);
            res.status(403).json({ error: error.message });
        }
    });

    // 2. Verify OTP
    router.post('/verify-otp', async (req, res) => {
        const email = req.body.email;
        const jobId = parseInt(req.body.jobId);
        const otp = req.body.otp;

        if (!jobId || !email || !otp) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        try {
            const verification = await service.verifyOTP(jobId, email, otp);
            if (verification.success) {
                // Set session variable for secure access
                req.session.employerLeadVerified = { jobId, email };
                
                // Explicitly save session and wait for it to finish to prevent race conditions
                req.session.save((err) => {
                    if (err) {
                        logger.error('Session save error in verify-otp:', err);
                        return res.status(500).json({ error: 'Failed to establish session.' });
                    }
                    res.json({ success: true });
                });
            } else {
                res.status(400).json({ error: verification.message });
            }
        } catch (error) {
            logger.error('Error verifying employer lead OTP:', error);
            res.status(500).json({ error: 'Internal server error.' });
        }
    });

    // 3. Get Job and Applicants (Requires verified session)
    router.get('/data/:jobId', async (req, res) => {
        const jobId = parseInt(req.params.jobId);
        const session = req.session.employerLeadVerified;

        if (!session || session.jobId !== jobId) {
            return res.status(401).json({ error: 'Unauthorized access. Please verify your email first.' });
        }

        try {
            const data = await service.getJobAndApplicants(jobId);
            if (!data) {
                return res.status(404).json({ error: 'Job not found.' });
            }
            res.json(data);
        } catch (error) {
            logger.error('Error fetching employer review data:', error);
            res.status(500).json({ error: 'Internal server error.' });
        }
    });

    // 4. Get Public Preview (Job Title, Count, Pipeline & Top Candidate)
    router.get('/data/:jobId/public', async (req, res) => {
        const jobId = parseInt(req.params.jobId);
        try {
            const jobResult = await pool.query(`
                SELECT j.title, COALESCE(e.company_name, j.external_company_name, 'Opportunity') as company_name 
                FROM jobs j
                LEFT JOIN employers e ON j.employer_id = e.id
                WHERE j.id = $1
            `, [jobId]);

            // Get Pipeline Distribution and Analysis Status
            const totalCountResult = await pool.query('SELECT COUNT(*) FROM applications WHERE job_id = $1', [jobId]);
            const analyzedCountResult = await pool.query(`
                SELECT COUNT(*) FROM applications a
                JOIN application_ai_evaluations ev ON a.id = ev.application_id
                WHERE a.job_id = $1
            `, [jobId]);
            
            const pipelineResult = await pool.query(`
                SELECT ev.verdict, COUNT(*) as count 
                FROM applications a
                JOIN application_ai_evaluations ev ON a.id = ev.application_id
                WHERE a.job_id = $1 
                GROUP BY ev.verdict
            `, [jobId]);

            const totalCount = parseInt(totalCountResult.rows[0].count) || 0;
            const analyzedCount = parseInt(analyzedCountResult.rows[0].count) || 0;

            const pipeline = { strong: 0, interview: 0, backup: 0, reject: 0 };
            pipelineResult.rows.forEach(row => {
                const verdict = (row.verdict || '').toLowerCase();
                if (verdict.includes('strong') || verdict.includes('hire') || verdict.includes('accept')) {
                    pipeline.strong += parseInt(row.count);
                } else if (verdict.includes('interview')) {
                    pipeline.interview += parseInt(row.count);
                } else if (verdict.includes('backup')) {
                    pipeline.backup += parseInt(row.count);
                } else if (verdict.includes('reject')) {
                    pipeline.reject += parseInt(row.count);
                }
            });

            // Get Top Candidate (Anonymized but with real analysis)
            const topCandidateResult = await pool.query(`
                SELECT 
                    ev.match_score, 
                    ev.verdict as ai_verdict, 
                    ev.summary as ai_analysis
                FROM applications a
                JOIN application_ai_evaluations ev ON a.id = ev.application_id
                WHERE a.job_id = $1 
                ORDER BY ev.match_score DESC 
                LIMIT 1
            `, [jobId]);

            let topCandidate = null;
            if (topCandidateResult.rows.length > 0) {
                const row = topCandidateResult.rows[0];
                topCandidate = {
                    match_score: row.match_score,
                    ai_verdict: row.ai_verdict,
                    analysis: row.ai_analysis
                };
            }
            
            res.json({ 
                title: jobResult.rows.length > 0 ? jobResult.rows[0].title : 'Opportunity',
                company_name: jobResult.rows.length > 0 ? jobResult.rows[0].company_name : 'Hirly',
                count: totalCount,
                analyzedCount: analyzedCount,
                pipeline,
                topCandidate
            });
        } catch (error) {
            logger.error('Error in public preview data:', error);
            res.status(500).json({ title: 'Opportunity', count: 0 });
        }
    });

    // 5. Track Lead Event
    router.post('/track', async (req, res) => {
        const { jobId, email, eventType, metadata } = req.body;
        
        if (!jobId || !email || !eventType) {
            return res.status(400).json({ error: 'Missing required tracking fields.' });
        }

        try {
            await pool.query(`
                INSERT INTO lead_tracking (job_id, email, event_type, ip_address, user_agent, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                jobId, 
                email, 
                eventType, 
                req.ip, 
                req.headers['user-agent'], 
                metadata ? JSON.stringify(metadata) : null
            ]);

            // Real-time alert for Admin Command Center
            if (logLiveEvent) {
                const eventMap = {
                    'page_access': 'accessed the Employer Review portal',
                    'cta_click': 'clicked "Review Candidates"',
                    'otp_stage_reached': 'reached OTP verification stage',
                    'otp_verify_success': 'successfully verified their email',
                    'workspace_created': 'successfully created their workspace! 🎉'
                };
                
                const action = eventMap[eventType] || `performed ${eventType}`;
                logLiveEvent('lead_conversion', `${email} ${action}`, {
                    jobId,
                    email,
                    eventType,
                    ip: req.ip
                });
            }
            
            res.json({ success: true });
        } catch (error) {
            logger.error('Error tracking lead event:', error);
            // Don't fail the request for tracking errors to avoid UX disruption
            res.json({ success: false, error: 'Failed to log tracking event.' });
        }
    });

    app.use('/api/employer-review', router);
};
