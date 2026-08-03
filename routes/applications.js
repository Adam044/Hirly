const express = require('express');
const { query, param, body } = require('express-validator');

module.exports = function registerApplicationsRoutes(app, pool, deps) {
  const {
    isAuthenticated,
    isEmployer,
    isEmployerVerified,
    isProfessional,
    isEmailVerified,
    upload,
    sendApplicationAcceptedEmail,
    sendApplicationRejectedEmail,
    handleValidationErrors
  } = deps;
  const router = express.Router();

  router.get(
    '/applications/check',
    isAuthenticated,
    [
      query('jobId').isInt({ min: 1 }),
      query('professionalId').isInt({ min: 1 })
    ],
    handleValidationErrors,
    async (req, res) => {
    let client;
    if (!req.session.userId || req.session.userType !== 'professional') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { jobId, professionalId } = req.query;
    if (!jobId || !professionalId) {
        return res.status(400).json({ success: false, error: 'Job ID and User ID are required.' });
    }
    try {
        client = await pool.connect();
        const result = await client.query('SELECT COUNT(*) AS count FROM applications WHERE job_id = $1 AND professional_id = $2', [jobId, professionalId]);
        const hasApplied = result.rows[0].count > 0;
        res.json({ success: true, hasApplied: hasApplied });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Database error while checking application status.' });
    } finally {
        if (client) client.release();
    }
    }
  );

  router.get(
    '/applications/job/:jobId',
    isAuthenticated,
    isEmployer,
    [param('jobId').isInt({ min: 1 })],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const jobId = req.params.jobId;
    const employerId = req.session.userId;
    try {
      client = await pool.connect();
      const jobOwnerResult = await client.query('SELECT employer_id, title FROM jobs WHERE id = $1', [jobId]);
      const jobOwner = jobOwnerResult.rows[0];
      if (!jobOwner || jobOwner.employer_id !== employerId) {
        return res.status(403).json({ success: false, error: 'Access denied. This job does not belong to you.' });
      }
      const result = await client.query(`
        SELECT
            a.id,
            a.job_id,
            a.professional_id,
            a.proposal_message,
            a.bid_amount,
            a.timeline,
            a.status,
            a.applied_at,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            u.city,
            u.gender,
            u.birthdate,
            u.profile_picture_url AS profile_picture,
            f.cv_path,
            f.skills,
            f.bio,
            f.interested_professions,
            j.job_type,
            j.currency,
            j.title AS job_title
        FROM applications a
        JOIN users u ON a.professional_id = u.id
        LEFT JOIN professionals f ON u.id = f.user_id
        JOIN jobs j ON a.job_id = j.id
        WHERE a.job_id = $1
        ORDER BY a.applied_at DESC
      `, [jobId]);
      const formattedApplications = result.rows.map(app => {
          if (!app.interested_professions) {
              app.interested_professions = [];
          }
          return app;
      });
      const jobTitle = jobOwner.title;
      res.json({ success: true, applications: formattedApplications, jobTitle: jobTitle });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error.' });
    } finally {
      if (client) client.release();
    }
    }
  );

  router.patch(
    '/applications/:applicationId/status',
    isAuthenticated,
    isEmployer,
    isEmployerVerified,
    isEmailVerified,
    upload.none(),
    [
      param('applicationId').isInt({ min: 1 }),
      body('status').isIn(['pending', 'accepted', 'rejected', 'interviewing', 'shortlisted']),
      body('rejectionReason').optional().trim().isLength({ max: 500 })
    ],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const applicationId = req.params.applicationId;
    const { status, rejectionReason } = req.body;
    const employerId = req.session.userId;
    const validStatuses = ['pending', 'accepted', 'rejected', 'interviewing', 'shortlisted'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid application status.' });
    }
    try {
        client = await pool.connect();
        const applicationDetailsResult = await client.query(`
            SELECT a.status as current_status, j.employer_id, j.title, u.email, u.first_name, u.last_name
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN users u ON a.professional_id = u.id
            WHERE a.id = $1
        `, [applicationId]);
        const applicationDetails = applicationDetailsResult.rows[0];
        if (!applicationDetails || applicationDetails.employer_id !== employerId) {
            return res.status(403).json({ success: false, error: 'Access denied. You do not have permission to modify this application.' });
        }
        let updateQuery;
        let updateParams;
        if (status === 'rejected' && rejectionReason) {
            updateQuery = 'UPDATE applications SET status = $1, rejection_reason = $2 WHERE id = $3 RETURNING id';
            updateParams = [status, rejectionReason, applicationId];
        } else {
            updateQuery = 'UPDATE applications SET status = $1, rejection_reason = NULL WHERE id = $2 RETURNING id';
            updateParams = [status, applicationId];
        }
        const updateResult = await client.query(updateQuery, updateParams);
        if (updateResult.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Application not found or no changes made.' });
        }
        if (status === 'accepted') {
            sendApplicationAcceptedEmail(applicationDetails.email, applicationDetails.first_name, applicationDetails.title).catch(() => {});
        } else if (status === 'rejected') {
            sendApplicationRejectedEmail(applicationDetails.email, applicationDetails.first_name, applicationDetails.title, rejectionReason).catch(() => {});
        }
        res.json({ success: true, message: 'Application status updated successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    } finally {
        if (client) client.release();
    }
    }
  );

  router.delete(
    '/user/applications/:applicationId',
    isAuthenticated,
    isProfessional,
    isEmailVerified,
    [param('applicationId').isInt({ min: 1 })],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const applicationId = req.params.applicationId;
    const professionalId = req.session.userId;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const applicationResult = await client.query('SELECT professional_id FROM applications WHERE id = $1 FOR UPDATE', [applicationId]);
      const application = applicationResult.rows[0];
      if (!application || application.professional_id !== professionalId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, error: 'Access denied. This application does not belong to you.' });
      }
      const deleteResult = await client.query('DELETE FROM applications WHERE id = $1 RETURNING id', [applicationId]);
      if (deleteResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Application not found or already withdrawn.' });
      }
      await client.query('COMMIT');
      res.json({ success: true, message: 'Application withdrawn successfully.' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: 'Server error during application withdrawal.' });
    } finally {
      if (client) client.release();
    }
    }
  );

  router.get('/user/applications', isAuthenticated, isProfessional, async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(`
        SELECT 
          a.id, a.job_id, j.title AS job_title, j.job_type, a.status, a.applied_at, a.proposal_message, 
          a.bid_amount, a.timeline, j.profession_required, j.job_image_path, j.currency, j.employer_id,
          u.first_name, u.last_name, e.company_name
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN users u ON j.employer_id = u.id
        LEFT JOIN employers e ON u.id = e.user_id
        WHERE a.professional_id = $1
        ORDER BY a.applied_at DESC
      `, [req.session.userId]);
      const formattedApplications = result.rows.map(app => {
        if (!app.profession_required) { app.profession_required = []; }
        return app;
      });
      res.json({ applications: formattedApplications });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load applications' });
    } finally {
      if (client) client.release();
    }
  });

  app.use('/api', router);
};