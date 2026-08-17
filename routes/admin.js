const express = require('express');
const path = require('path');
const { getAvailableTemplates, getTemplateContent } = require('../utils/templateHelper');
const logger = require('../utils/logger');
const { logoFetcher } = require('../utils/companyLogoFetcher');

module.exports = function registerAdminRoutes(app, pool, {
  isAuthenticated,
  isAdmin,
  uploadAdminLogo,
  storeFileInSupabase,
  deleteFileFromSupabase,
  sendManualJobAlerts,
  sendEmailCampaign,
  sendEmailCampaignTest,
  sendEmailCampaignWithProgress,
  sendVerificationEmail,
  sendEmail,
  employerOutreach
}) {
  const router = express.Router();

  router.get('/admin/dashboard-stats', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    try {
      const { range = '30D' } = req.query;
      client = await pool.connect();
      
      let growthInterval = 'day';
      let growthLimit = '30 days';
      if (range === '90D') { growthInterval = 'week'; growthLimit = '90 days'; }
      if (range === '1Y') { growthInterval = 'month'; growthLimit = '1 year'; }

      const [
        totalUsersRes,
        totalProfessionalsRes,
        totalEmployersRes,
        companyEmployersRes,
        individualEmployersRes,
        totalJobsRes,
        openJobsRes,
        pendingApplicationsRes,
        totalVerifiedUsersRes,
        pendingVerificationsRes,
        emailStatsRes,
        growthDataRes,
        recentEventsRes
      ] = await Promise.all([
        client.query('SELECT COUNT(*) FROM users'),
        client.query('SELECT COUNT(*) FROM professionals'),
        client.query('SELECT COUNT(*) FROM employers'),
        client.query("SELECT COUNT(*) FROM employers WHERE employer_type = 'company'"),
        client.query("SELECT COUNT(*) FROM employers WHERE employer_type = 'individual' OR employer_type IS NULL"),
        client.query('SELECT COUNT(*) FROM jobs'),
        client.query("SELECT COUNT(*) FROM jobs WHERE status = 'open'"),
        client.query("SELECT COUNT(*) FROM applications WHERE status = 'pending'"),
        client.query('SELECT COUNT(*) FROM users WHERE is_email_verified = TRUE'),
        client.query("SELECT COUNT(*) FROM professionals WHERE verification_status = 'Pending Verification'"),
        client.query("SELECT sender_email, COUNT(*) as count FROM email_logs WHERE sent_at > NOW() - INTERVAL '24 hours' GROUP BY sender_email"),
        client.query(`
          SELECT 
            DATE_TRUNC($1, created_at) as date, 
            COUNT(*) as count 
          FROM users 
          WHERE created_at > NOW() - $2::INTERVAL
          GROUP BY 1 
          ORDER BY 1 ASC
        `, [growthInterval, growthLimit]),
        client.query(`
          (SELECT 'user' as type, first_name || ' ' || last_name as title, 'Joined Hirly' as detail, created_at FROM users ORDER BY created_at DESC LIMIT 5)
          UNION ALL
          (SELECT 'job' as type, title, 'New job posted' as detail, created_at FROM jobs ORDER BY created_at DESC LIMIT 5)
          UNION ALL
          (SELECT 'application' as type, 'New Application' as title, 'Application received' as detail, applied_at as created_at FROM applications ORDER BY applied_at DESC LIMIT 5)
          ORDER BY created_at DESC LIMIT 10
        `)
      ]);

      const emailStatsMap = {};
      emailStatsRes.rows.forEach(row => {
        emailStatsMap[row.sender_email] = parseInt(row.count);
      });

      const stats = {
        totalUsers: totalUsersRes.rows[0].count,
        totalProfessionals: totalProfessionalsRes.rows[0].count,
        totalEmployers: totalEmployersRes.rows[0].count,
        companyEmployers: companyEmployersRes.rows[0].count,
        individualEmployers: individualEmployersRes.rows[0].count,
        totalJobs: totalJobsRes.rows[0].count,
        openJobs: openJobsRes.rows[0].count,
        pendingApplications: pendingApplicationsRes.rows[0].count,
        totalVerifiedUsers: totalVerifiedUsersRes.rows[0].count,
        pendingVerifications: pendingVerificationsRes.rows[0].count,
        growthData: growthDataRes.rows,
        recentEvents: recentEventsRes.rows,
        emailStats: {
          sender1: { email: process.env.EMAIL_USER, count: emailStatsMap[process.env.EMAIL_USER] || 0 },
          sender2: { email: process.env.AUTO_EMAIL_USER, count: emailStatsMap[process.env.AUTO_EMAIL_USER] || 0 }
        }
      };
      
      res.json({ success: true, stats });
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch dashboard statistics.', details: error.message });
    } finally { if (client) client.release(); }
  });

  router.get('/admin/email-templates', isAuthenticated, isAdmin, (req, res) => {
    try {
      const templates = getAvailableTemplates();
      res.json({ success: true, templates });
    } catch (error) {
      logger.error('Error fetching templates:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch templates.' });
    }
  });

  router.get('/admin/email-templates/:id', isAuthenticated, isAdmin, (req, res) => {
    try {
      const { id } = req.params;
      
      // Map frontend IDs to backend helper IDs
      const templateMapping = {
          'id-verification': 'id-verification-reminder',
          'email-verification': 'email-verification-reminder',
          'general-welcome': 'general-welcome',
          'professional-welcome': 'professional-welcome',
          'professional-engagement': 'professional-engagement',
          'employer-marketing': 'employer-marketing',
          'employer-engagement': 'employer-engagement',
          'job-application-notification': 'job-application-notification'
      };

      const backendTemplateId = templateMapping[id] || id;
      
      const content = getTemplateContent(backendTemplateId);
      res.json({ success: true, content });
    } catch (error) {
      logger.error(`Error fetching template ${req.params.id}:`, error);
      res.status(500).json({ success: false, error: 'Failed to fetch template content.' });
    }
  });

  router.get('/admin/professionals', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    try {
      const { search = '', status = 'All', category = 'all', city = 'all', page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      client = await pool.connect();
      const params = [];
      let paramIndex = 1;
      const whereClauses = [];
      if (status && status !== 'All') { whereClauses.push(`f.verification_status = $${paramIndex++}`); params.push(status); }
      if (search) {
        const searchTerm = `%${search.toLowerCase()}%`;
        whereClauses.push(`(LOWER(u.first_name) ILIKE $${paramIndex} OR LOWER(u.last_name) ILIKE $${paramIndex} OR LOWER(u.email) ILIKE $${paramIndex} OR LOWER(f.profession) ILIKE $${paramIndex})`);
        params.push(searchTerm); paramIndex++;
      }
      if (city && city !== 'all') { whereClauses.push(`u.city = $${paramIndex++}`); params.push(city); }

      let whereClause = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
      
      const countRes = await client.query(`SELECT COUNT(*) FROM users u JOIN professionals f ON u.id = f.user_id${whereClause}`, params);
      const totalCount = parseInt(countRes.rows[0].count);

      let query = `
        SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.city, u.profile_picture_url, u.slug,
               f.profession, f.skills, f.bio, f.verification_status, f.id_verification_path, f.id_rejection_reason, f.id as professional_id, f.current_status, f.created_at
        FROM users u JOIN professionals f ON u.id = f.user_id
        ${whereClause}
        ORDER BY f.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(parseInt(limit), offset);

      const { rows: professionals } = await client.query(query, params);
      res.json({ 
        success: true, 
        professionals,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: offset + professionals.length < totalCount
        }
      });
    } catch (error) {
      logger.error('Error fetching professionals:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch professionals.' });
    } finally { if (client) client.release(); }
  });

  router.get('/admin/employers', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    try {
      const { search = '', status = 'All', type = 'all', logo = 'all', city = 'all', page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      client = await pool.connect();
      const params = [];
      let paramIndex = 1;
      const whereClauses = ["u.user_type = 'employer'"];
      if (status && status !== 'All') { whereClauses.push(`e.verification_status = $${paramIndex++}`); params.push(status); }
      if (search) {
        const searchTerm = `%${search.toLowerCase()}%`;
        whereClauses.push(`(LOWER(u.first_name) ILIKE $${paramIndex} OR LOWER(u.last_name) ILIKE $${paramIndex} OR LOWER(u.email) ILIKE $${paramIndex} OR LOWER(e.company_name) ILIKE $${paramIndex})`);
        params.push(searchTerm); paramIndex++;
      }
      if (type && type !== 'all') { whereClauses.push(`e.employer_type = $${paramIndex++}`); params.push(type); }
      if (city && city !== 'all') { whereClauses.push(`u.city = $${paramIndex++}`); params.push(city); }
      if (logo === 'has-logo') {
        whereClauses.push("(e.company_logo_path IS NOT NULL AND e.company_logo_path != 'N/A' AND e.company_logo_path != '')");
      } else if (logo === 'no-logo') {
        whereClauses.push("(e.company_logo_path IS NULL OR e.company_logo_path = 'N/A' OR e.company_logo_path = '')");
      }

      const whereClause = ` WHERE ${whereClauses.join(' AND ')}`;
      
      const countRes = await client.query(`SELECT COUNT(*) FROM users u LEFT JOIN employers e ON u.id = e.user_id${whereClause}`, params);
      const totalCount = parseInt(countRes.rows[0].count);

      let query = `
        SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.city, u.is_email_verified, u.slug,
               e.company_name, e.employer_type, e.id_verification_path, e.verification_status, e.id_rejection_reason, e.company_logo_path, e.id as employer_id, e.created_at
        FROM users u LEFT JOIN employers e ON u.id = e.user_id
        ${whereClause}
        ORDER BY e.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(parseInt(limit), offset);

      const { rows: employers } = await client.query(query, params);
      res.json({ 
        success: true, 
        employers,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: offset + employers.length < totalCount
        }
      });
    } catch (error) {
      logger.error('Error fetching employers:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch employers.' });
    } finally { if (client) client.release(); }
  });

  router.post('/admin/update-verification-status', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    const { userId, userType, newStatus, rejectionReason } = req.body;
    if (!userId || !userType || !newStatus) { return res.status(400).json({ success: false, error: 'Missing required parameters.' }); }
    if (newStatus === 'Rejected' && !rejectionReason) { return res.status(400).json({ success: false, error: 'Rejection reason is required for rejecting verification.' }); }
    try {
      client = await pool.connect();
      const table = userType === 'professional' ? 'professionals' : 'employers';
      let query, params;
      if (newStatus === 'Rejected') {
        query = `UPDATE ${table} SET verification_status = $1, id_rejection_reason = $2 WHERE user_id = $3`;
        params = [newStatus, rejectionReason, userId];
      } else {
        query = `UPDATE ${table} SET verification_status = $1, id_rejection_reason = NULL WHERE user_id = $2`;
        params = [newStatus, userId];
      }
      await client.query(query, params);
      res.json({ success: true, message: `User verification status updated to '${newStatus}'.` });
    } catch { res.status(500).json({ success: false, error: 'Failed to update verification status.' }); }
    finally { if (client) client.release(); }
  });

  router.post('/admin/bulk-verify-professionals', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    const { userIds, status } = req.body;
    if (!userIds || !Array.isArray(userIds) || !status) {
      return res.status(400).json({ success: false, error: 'Invalid parameters.' });
    }
    try {
      client = await pool.connect();
      await client.query('UPDATE professionals SET verification_status = $1, id_rejection_reason = NULL WHERE user_id = ANY($2)', [status, userIds]);
      res.json({ success: true, message: `Successfully updated ${userIds.length} professionals.` });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to bulk update professionals.' });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/admin/bulk-verify-employers', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    const { userIds, status } = req.body;
    if (!userIds || !Array.isArray(userIds) || !status) {
      return res.status(400).json({ success: false, error: 'Invalid parameters.' });
    }
    try {
      client = await pool.connect();
      await client.query('UPDATE employers SET verification_status = $1, id_rejection_reason = NULL WHERE user_id = ANY($2)', [status, userIds]);
      res.json({ success: true, message: `Successfully updated ${userIds.length} employers.` });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to bulk update employers.' });
    } finally {
      if (client) client.release();
    }
  });

  // --- Job Sanitizer Endpoints ---
  router.get('/admin/analyze-duplicates', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { timeframe = '30 days' } = req.query;
      const useAllTime = timeframe === 'all';
      const interval = useAllTime ? '100 years' : timeframe;
      
      // 1. Find Semantic Duplicate Clusters
      const duplicatesResult = await pool.query(`
        WITH potential_clusters AS (
          SELECT 
            LOWER(TRIM(title)) as norm_title,
            LOWER(TRIM(external_company_name)) as norm_company,
            city,
            COUNT(*) as job_count,
            ARRAY_AGG(id) as job_ids
          FROM jobs
          WHERE created_at > NOW() - $1::interval
          AND status = 'open'
          GROUP BY norm_title, norm_company, city
          HAVING COUNT(*) > 1
        )
        SELECT 
          'duplicate_cluster' as type,
          c.norm_title,
          c.norm_company,
          c.city,
          c.job_count,
          (
            SELECT json_agg(j)
            FROM (
              SELECT id, title, external_company_name, city, created_at, external_source as source_name, external_id
              FROM jobs 
              WHERE id = ANY(c.job_ids)
              ORDER BY created_at DESC
            ) j
          ) as jobs
        FROM potential_clusters c
        ORDER BY c.job_count DESC
      `, [interval]);

      // 2. Find "Bad Source" Jobs (Palestine via Jooble/Adzuna)
      const badSourceResult = await pool.query(`
        SELECT 
          'bad_source' as type,
          id, title, external_company_name, city, created_at, external_source as source_name, external_id
        FROM jobs
        WHERE country = 'Palestine' 
        AND LOWER(external_source) IN ('jooble', 'adzuna')
        AND created_at > NOW() - $1::interval
        AND status = 'open'
        ORDER BY created_at DESC
      `, [interval]);

      // 3. Find "Bad Data" Jobs (City is 'Palestine')
      const badCityResult = await pool.query(`
        SELECT 
          'bad_city' as type,
          id, title, external_company_name, city, created_at, external_source as source_name, external_id
        FROM jobs
        WHERE (LOWER(city) = 'palestine' OR city IS NULL)
        AND country = 'Palestine'
        AND created_at > NOW() - $1::interval
        AND status = 'open'
        ORDER BY created_at DESC
      `, [interval]);

      // 4. Find "Expired" Jobs (Deadline has passed)
      const expiredResult = await pool.query(`
        SELECT 
          'expired' as type,
          id, title, external_company_name, city, created_at, external_source as source_name, external_id, deadline
        FROM jobs
        WHERE deadline IS NOT NULL 
        AND deadline < CURRENT_DATE
        AND created_at > NOW() - $1::interval
        AND status = 'open'
        ORDER BY deadline ASC
      `, [interval]);

      // 5. Find "Same Location" Jobs (City = Country)
      const sameLocationResult = await pool.query(`
        SELECT 
          'same_location' as type,
          id, title, external_company_name, city, country, created_at, external_source as source_name, external_id
        FROM jobs
        WHERE LOWER(city) = LOWER(country)
        AND created_at > NOW() - $1::interval
        AND status = 'open'
        ORDER BY created_at DESC
      `, [interval]);

      // 6. Find "Future Dated" Jobs
      const futureDatedResult = await pool.query(`
        SELECT 
          'future_dated' as type,
          id, title, external_company_name, city, created_at, external_source as source_name, external_id
        FROM jobs
        WHERE created_at > NOW()
        AND status = 'open'
        ORDER BY created_at DESC
      `);

      // Combine results
      const clusters = [];

      if (futureDatedResult.rows.length > 0) {
        clusters.push({
          type: 'future_dated_cluster',
          norm_title: 'Future Dated Jobs',
          norm_company: 'Jobs with "created_at" in the future',
          city: 'Various',
          job_count: futureDatedResult.rows.length,
          jobs: futureDatedResult.rows
        });
      }

      if (badSourceResult.rows.length > 0) {
        clusters.push({
          type: 'bad_source_cluster',
          norm_title: 'Unreliable Palestinian Sources',
          norm_company: 'Jooble / Adzuna (Palestine)',
          city: 'Multiple',
          job_count: badSourceResult.rows.length,
          jobs: badSourceResult.rows
        });
      }

      if (badCityResult.rows.length > 0) {
        clusters.push({
          type: 'bad_source_cluster', // Use same UI type for auto-delete
          norm_title: 'Vague Location Data',
          norm_company: 'City marked as "Palestine"',
          city: 'Palestine',
          job_count: badCityResult.rows.length,
          jobs: badCityResult.rows
        });
      }

      if (expiredResult.rows.length > 0) {
        clusters.push({
          type: 'expired_cluster', // New type
          norm_title: 'Expired Listings',
          norm_company: 'Deadline has passed',
          city: 'Various',
          job_count: expiredResult.rows.length,
          jobs: expiredResult.rows.map(j => ({
            ...j,
            title: `${j.title} (Expired: ${new Date(j.deadline).toLocaleDateString()})`
          }))
        });
      }

      if (sameLocationResult.rows.length > 0) {
        clusters.push({
          type: 'same_location_cluster',
          norm_title: 'City matches Country',
          norm_company: 'Vague Location (needs "Other")',
          city: 'Same as Country',
          job_count: sameLocationResult.rows.length,
          jobs: sameLocationResult.rows
        });
      }

      res.json({ 
        success: true, 
        clusters: [...clusters, ...duplicatesResult.rows] 
      });
    } catch (error) {
      logger.error('Error analyzing duplicates:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/admin/bulk-remove-jobs', isAuthenticated, isAdmin, async (req, res) => {
    const { jobIds } = req.body;
    if (!jobIds || !Array.isArray(jobIds)) {
      return res.status(400).json({ success: false, error: 'Invalid job IDs provided.' });
    }

    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      
      // Instead of deleting, we just mark them as closed
      const result = await client.query("UPDATE jobs SET status = 'closed' WHERE id = ANY($1)", [jobIds]);
      
      await client.query('COMMIT');
      res.json({ success: true, count: result.rowCount });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      logger.error('Error removing jobs:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/admin/bulk-close-jobs', isAuthenticated, isAdmin, async (req, res) => {
    const { jobIds } = req.body;
    if (!jobIds || !Array.isArray(jobIds)) {
      return res.status(400).json({ success: false, error: 'Invalid job IDs provided.' });
    }

    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        "UPDATE jobs SET status = 'closed' WHERE id = ANY($1)",
        [jobIds]
      );
      res.json({ success: true, count: result.rowCount });
    } catch (error) {
      logger.error('Error closing jobs:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/admin/bulk-fix-locations', isAuthenticated, isAdmin, async (req, res) => {
    const { jobIds } = req.body;
    if (!jobIds || !Array.isArray(jobIds)) {
      return res.status(400).json({ success: false, error: 'Invalid job IDs provided.' });
    }

    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        "UPDATE jobs SET city = 'Other' WHERE id = ANY($1)",
        [jobIds]
      );
      res.json({ success: true, count: result.rowCount });
    } catch (error) {
      logger.error('Error fixing job locations:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/admin/bulk-fix-future-dates', isAuthenticated, isAdmin, async (req, res) => {
    const { jobIds } = req.body;
    if (!jobIds || !Array.isArray(jobIds)) {
      return res.status(400).json({ success: false, error: 'Invalid job IDs provided.' });
    }

    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        "UPDATE jobs SET created_at = NOW() WHERE id = ANY($1)",
        [jobIds]
      );
      res.json({ success: true, count: result.rowCount });
    } catch (error) {
      logger.error('Error fixing future dated jobs:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/admin/job-sources', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query('SELECT * FROM job_sources ORDER BY priority DESC, created_at DESC');
      res.json({ success: true, sources: result.rows });
    } catch (error) {
      logger.error('Error fetching job sources:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch job sources.' });
    } finally { if (client) client.release(); }
  });

  router.post('/admin/job-sources', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    const { name, type, country_code, base_url, config, active, priority } = req.body;
    try {
      client = await pool.connect();
      const result = await client.query(
        `INSERT INTO job_sources (name, type, country_code, base_url, config, active, priority) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [name, type, country_code, base_url, config || {}, active !== false, priority || 100]
      );
      res.json({ success: true, source: result.rows[0] });
    } catch (error) {
      logger.error('Error creating job source:', error);
      res.status(500).json({ success: false, error: 'Failed to create job source.', details: error.message });
    } finally { if (client) client.release(); }
  });

  router.put('/admin/job-sources/:id', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    const { id } = req.params;
    const { name, type, country_code, base_url, config, active, priority } = req.body;
    try {
      client = await pool.connect();
      const result = await client.query(
        `UPDATE job_sources 
         SET name = $1, type = $2, country_code = $3, base_url = $4, config = $5, active = $6, priority = $7, updated_at = NOW()
         WHERE id = $8 
         RETURNING *`,
        [name, type, country_code, base_url, config, active, priority, id]
      );
      if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Source not found.' });
      res.json({ success: true, source: result.rows[0] });
    } catch (error) {
      logger.error('Error updating job source:', error);
      res.status(500).json({ success: false, error: 'Failed to update job source.' });
    } finally { if (client) client.release(); }
  });

  router.delete('/admin/job-sources/:id', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    const { id } = req.params;
    try {
      client = await pool.connect();
      await client.query('DELETE FROM job_sources WHERE id = $1', [id]);
      res.json({ success: true, message: 'Job source deleted successfully.' });
    } catch (error) {
      logger.error('Error deleting job source:', error);
      res.status(500).json({ success: false, error: 'Failed to delete job source.' });
    } finally { if (client) client.release(); }
  });

  router.post('/admin/trigger-source-scan/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const jobAggregator = app.get('jobAggregator');
      if (!jobAggregator) {
        return res.status(503).json({ success: false, error: 'Job Aggregator Service is still initializing.' });
      }

      // Trigger single source scan in background
      jobAggregator.runAggregation({ sourceId: id })
        .catch(err => logger.error(`Manual source scan failed for ${id}:`, err));

      res.json({ success: true, message: 'Source scan triggered in background.' });
    } catch (error) {
      logger.error('Error triggering source scan:', error);
      res.status(500).json({ success: false, error: 'Failed to trigger scan.' });
    }
  });

  router.get('/admin/intelligence-sources', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await pool.query("SELECT id, name, country_code FROM job_sources WHERE active = true ORDER BY priority ASC");
      res.json({ success: true, sources: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/admin/trigger-job-aggregation', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const jobAggregator = app.get('jobAggregator');
      if (!jobAggregator) {
        return res.status(503).json({ success: false, error: 'Job Aggregator Service is still initializing. Please try again in a few seconds.' });
      }

      const { countries, keywords, deepScan, sources, intelligenceSources, maxPages, lookbackDays } = req.body;

      // Run in background
      jobAggregator.runAggregation({ 
        countries, 
        keywords, 
        deepScan, 
        sources,
        intelligenceSources,
        maxPages,
        lookbackDays
      }).catch(err => logger.error('Manual aggregation failed:', err));

      res.json({ success: true, message: 'Job aggregation triggered in background.' });
    } catch (error) {
      logger.error('Error triggering job aggregation:', error);
      res.status(500).json({ success: false, error: 'Failed to trigger aggregation.' });
    }
  });

  router.post('/admin/stop-job-aggregation', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const jobAggregator = app.get('jobAggregator');
      if (!jobAggregator) {
        return res.status(503).json({ success: false, error: 'Job Aggregator Service is still initializing.' });
      }

      const stopped = jobAggregator.stopAggregation();
      if (stopped) {
        res.json({ success: true, message: 'Stop request sent successfully.' });
      } else {
        res.status(400).json({ success: false, error: 'No aggregation is currently running.' });
      }
    } catch (error) {
      logger.error('Error stopping job aggregation:', error);
      res.status(500).json({ success: false, error: 'Failed to stop aggregation.' });
    }
  });

  router.get('/admin/job-aggregation-status', isAuthenticated, isAdmin, (req, res) => {
    const jobAggregator = app.get('jobAggregator');
    if (!jobAggregator) {
      return res.json({ 
        success: true, 
        status: { 
          isWorking: false, 
          currentSource: 'Initializing...', 
          progress: 0, 
          logs: [{ timestamp: new Date().toISOString(), message: 'System is initializing database connections...', type: 'info' }] 
        } 
      });
    }
    res.json({ success: true, status: jobAggregator.getStatus() });
  });

  router.post('/admin/test-aggregator-connections', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const jobAggregator = app.get('jobAggregator');
      if (!jobAggregator) {
        return res.status(503).json({ success: false, error: 'Job Aggregator Service is still initializing.' });
      }

      const results = {
        adzuna: { success: false, message: 'Not tested' },
        jooble: { success: false, message: 'Not tested' },
        careerjet: { success: false, message: 'Not tested' }
      };

      // Test Adzuna (using GB as a safe default)
      try {
        const adzunaJobs = await jobAggregator.fetchFromAdzuna('gb', 'job', 1);
        results.adzuna = { 
          success: adzunaJobs.length >= 0, 
          message: adzunaJobs.length > 0 ? `Connected! Found ${adzunaJobs.length} test jobs.` : 'Connected, but no jobs found for test query.' 
        };
      } catch (err) {
        results.adzuna = { success: false, message: err.message };
      }

      // Test Jooble (using AE as a safe default)
      try {
        const joobleJobs = await jobAggregator.fetchFromJooble('ae', 'job', 1);
        results.jooble = { 
          success: joobleJobs.length >= 0, 
          message: joobleJobs.length > 0 ? `Connected! Found ${joobleJobs.length} test jobs.` : 'Connected, but no jobs found for test query.' 
        };
      } catch (err) {
        results.jooble = { success: false, message: err.message };
      }

      // Test Careerjet (using AE as a safe default)
      try {
        const careerjetJobs = await jobAggregator.fetchFromCareerjet('ae', 'job', 1);
        results.careerjet = { 
          success: careerjetJobs.length >= 0, 
          message: careerjetJobs.length > 0 ? `Connected! Found ${careerjetJobs.length} test jobs.` : 'Connected, but no jobs found for test query.' 
        };
      } catch (err) {
        results.careerjet = { success: false, message: err.message };
      }

      res.json({ success: true, results });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to run connection tests.' });
    }
  });

  router.post('/admin/update-job-aggregator-schedule', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const jobAggregator = app.get('jobAggregator');
      if (!jobAggregator) {
        return res.status(503).json({ success: false, error: 'Job Aggregator Service is still initializing.' });
      }

      const { hour, minute } = req.body;
      if (hour === undefined || minute === undefined) {
        return res.status(400).json({ success: false, error: 'Hour and minute are required.' });
      }

      const cronExpression = `${minute} ${hour} * * *`;
      await jobAggregator.setSchedule(cronExpression);

      res.json({ success: true, message: `Schedule updated to ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} daily.` });
    } catch (error) {
      logger.error('Error updating aggregator schedule:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to update schedule.' });
    }
  });

  router.post('/admin/toggle-job-aggregator-automation', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const jobAggregator = app.get('jobAggregator');
      if (!jobAggregator) {
        return res.status(503).json({ success: false, error: 'Job Aggregator Service is still initializing.' });
      }

      const { enabled } = req.body;
      if (enabled === undefined) {
        return res.status(400).json({ success: false, error: 'Enabled status is required.' });
      }

      const result = await jobAggregator.toggleAutoTrigger(enabled);
      res.json({ success: true, enabled: result, message: `Daily automation ${result ? 'enabled' : 'disabled'}.` });
    } catch (error) {
      logger.error('Error toggling aggregator automation:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to toggle automation.' });
    }
  });

  router.post('/admin/prune-jobs', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const jobAggregator = app.get('jobAggregator');
      if (!jobAggregator) {
        return res.status(503).json({ success: false, error: 'Job Aggregator Service is still initializing.' });
      }

      const count = await jobAggregator.pruneOldJobs();
      res.json({ success: true, message: `Successfully pruned ${count} old external jobs.` });
    } catch (error) {
      logger.error('Error pruning jobs:', error);
      res.status(500).json({ success: false, error: 'Failed to prune jobs.' });
    }
  });

  router.get('/admin/jobs', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    const { search, city, category, status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    try {
      client = await pool.connect();
      const params = [];
      let paramIndex = 1;
      const whereClauses = ["j.is_external = FALSE"];
      
      if (search) { 
        const s = `%${search.toLowerCase()}%`; 
        whereClauses.push(`(LOWER(j.title) ILIKE $${paramIndex} OR LOWER(u.first_name) ILIKE $${paramIndex} OR LOWER(u.last_name) ILIKE $${paramIndex} OR LOWER(e.company_name) ILIKE $${paramIndex})`); 
        params.push(s); 
        paramIndex++; 
      }
      if (city && city !== 'all') { whereClauses.push(`j.city = $${paramIndex++}`); params.push(city); }
      if (category && category !== 'all') { whereClauses.push(`j.category = $${paramIndex++}`); params.push(category); }
      if (status && status !== 'all') { whereClauses.push(`j.status = $${paramIndex++}`); params.push(status); }
      
      const whereClause = ` WHERE ${whereClauses.join(' AND ')}`;
      
      const countRes = await client.query(`SELECT COUNT(*) FROM jobs j JOIN users u ON j.employer_id = u.id ${whereClause}`, params);
      const totalCount = parseInt(countRes.rows[0].count);

      let query = `
        SELECT j.id, j.title, j.description, j.status, j.created_at, j.has_been_sent, j.city, j.category, j.budget, j.currency,
               u.id as employer_id, u.first_name AS employer_first_name, u.last_name AS employer_last_name, u.slug AS employer_slug,
               e.company_name as employer_company_name,
               (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as app_count
        FROM jobs j JOIN users u ON j.employer_id = u.id LEFT JOIN employers e ON u.id = e.user_id
        ${whereClause}
        ORDER BY j.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(parseInt(limit), offset);
      
      const { rows: jobs } = await client.query(query, params);
      res.json({ 
        success: true, 
        jobs,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: offset + jobs.length < totalCount
        }
      });
    } catch (error) {
      logger.error('Error fetching jobs:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch jobs.' }); 
    }
    finally { if (client) client.release(); }
  });

  router.get('/admin/reviews', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      const query = `
        SELECT r.id, r.rating, r.comment, r.created_at,
               j.title as job_title,
               u_reviewer.first_name || ' ' || u_reviewer.last_name as reviewer_name,
               u_reviewee.first_name || ' ' || u_reviewee.last_name as reviewee_name
        FROM reviews r
        JOIN jobs j ON r.job_id = j.id
        JOIN users u_reviewer ON r.reviewer_id = u_reviewer.id
        JOIN users u_reviewee ON r.professional_id = u_reviewee.id
        ORDER BY r.created_at DESC
      `;
      const { rows: reviews } = await client.query(query);
      res.json({ success: true, reviews });
    } catch (error) {
      logger.error('Error fetching reviews:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch reviews.' });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    let client; const { search } = req.query;
    try {
      client = await pool.connect();
      const params = []; let query = 'SELECT id, first_name, last_name, email, user_type FROM users';
      if (search) { const s = `%${search.toLowerCase()}%`; query += ' WHERE LOWER(first_name) ILIKE $1 OR LOWER(last_name) ILIKE $1 OR LOWER(email) ILIKE $1'; params.push(s); }
      query += ' ORDER BY first_name LIMIT 20';
      const { rows: users } = await client.query(query, params);
      res.json({ success: true, users });
    } catch { res.status(500).json({ success: false, error: 'Failed to fetch users.' }); }
    finally { if (client) client.release(); }
  });

  router.get('/admin/get-recipients', isAuthenticated, isAdmin, async (req, res) => {
    try {
      client = await pool.connect();
      const { city, professions } = req.query;
      const filterConditions = ["u.user_type = 'professional'"]; const filterValues = []; let paramIndex = 1;
      if (city && city !== 'all') { filterConditions.push(`u.city = $${paramIndex++}`); filterValues.push(city); }
      if (professions && professions !== 'all') { const arr = professions.split(','); if (arr.length > 0) { filterConditions.push(`EXISTS (SELECT 1 FROM jsonb_array_elements_text(f.interested_professions) as p WHERE p.value = ANY($${paramIndex++}))`); filterValues.push(arr); } }
      const whereClause = filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : '';
      const queryText = `SELECT u.first_name, u.last_name, u.email FROM users u JOIN professionals f ON u.id = f.user_id ${whereClause}`;
      const { rows: recipients } = await client.query(queryText, filterValues);
      res.json({ success: true, recipients });
    } catch { res.status(500).json({ success: false, error: 'Failed to fetch recipients.' }); }
    finally { if (client) client.release(); }
  });

  router.post('/admin/get-campaign-recipients', isAuthenticated, isAdmin, async (req, res) => {
    let client; const { filters } = req.body;
    try {
      client = await pool.connect();
      const params = []; const whereClauses = []; let paramIndex = 1; let query = 'SELECT u.email, u.first_name, u.last_name FROM users u'; let joinClauses = '';
      const idStatuses = ['Verified', 'Pending Verification', 'Rejected', 'Not Submitted'];
      if (filters.idVerificationStatus && filters.idVerificationStatus.some(s => idStatuses.includes(s))) {
        if (filters.userType && filters.userType.includes('professional')) { joinClauses += ' LEFT JOIN professionals f ON u.id = f.user_id'; whereClauses.push(`f.verification_status = ANY($${paramIndex++}::text[])`); params.push(filters.idVerificationStatus); }
        if (filters.userType && filters.userType.includes('employer')) { joinClauses += ' LEFT JOIN employers e ON u.id = e.user_id'; whereClauses.push(`e.verification_status = ANY($${paramIndex++}::text[])`); params.push(filters.idVerificationStatus); }
        if (!filters.userType) { joinClauses += ' LEFT JOIN professionals f ON u.id = f.user_id LEFT JOIN employers e ON u.id = e.user_id'; whereClauses.push(`(f.verification_status = ANY($${paramIndex++}::text[]) OR e.verification_status = ANY($${paramIndex++}::text[]))`); params.push(filters.idVerificationStatus, filters.idVerificationStatus); }
      }
      if (filters.isEmailVerified !== undefined) { whereClauses.push(`u.is_email_verified = $${paramIndex++}`); params.push(filters.isEmailVerified); }
      if (filters.userType && filters.userType.length > 0) { whereClauses.push(`u.user_type = ANY($${paramIndex++}::text[])`); params.push(filters.userType); }
      if (whereClauses.length > 0) { query += ` ${joinClauses} WHERE ${whereClauses.join(' AND ')}`; } else if (joinClauses.length > 0) { query += ` ${joinClauses}`; }
      query += ' ORDER BY u.first_name';
      const { rows: recipients } = await client.query(query, params);
      res.json({ success: true, recipients });
    } catch { res.status(500).json({ success: false, error: 'Failed to fetch recipients.' }); }
    finally { if (client) client.release(); }
  });

  router.get('/admin/jobs-with-applications', isAuthenticated, isAdmin, async (req, res) => {
    let client; try {
      client = await pool.connect();
      const { search, city, category, notified } = req.query;
      let query = `
        SELECT DISTINCT j.id, j.title, j.description, j.budget, j.currency, j.city, j.category, j.created_at, j.employer_id,
               u.first_name as employer_first_name, u.last_name as employer_last_name, u.email as employer_email, u.slug as employer_slug,
               e.company_name as employer_company_name, COUNT(a.id) as application_count,
               CASE WHEN jan.job_id IS NOT NULL THEN true ELSE false END as notification_sent
        FROM jobs j JOIN users u ON j.employer_id = u.id LEFT JOIN employers e ON u.id = e.user_id
        JOIN applications a ON j.id = a.job_id LEFT JOIN job_application_notifications jan ON j.id = jan.job_id
        WHERE 1=1
      `;
      const params = []; let paramIndex = 1;
      if (search && search.trim()) { query += ` AND (j.title ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex})`; params.push(`%${search.trim()}%`); paramIndex++; }
      if (city && city !== 'all') { query += ` AND j.city = $${paramIndex}`; params.push(city); paramIndex++; }
      if (category && category !== 'all') { query += ` AND j.category = $${paramIndex}`; params.push(category); paramIndex++; }
      if (notified && notified !== 'all') { if (notified === 'notified') { query += ' AND jan.job_id IS NOT NULL'; } else if (notified === 'not_notified') { query += ' AND jan.job_id IS NULL'; } }
      query += `
        GROUP BY j.id, j.title, j.description, j.budget, j.currency, j.city, j.category, j.created_at, j.employer_id,
                 u.first_name, u.last_name, u.email, u.slug, e.company_name, jan.job_id
        HAVING COUNT(a.id) > 0 ORDER BY j.created_at DESC
      `;
      const result = await client.query(query, params);
      res.json({ success: true, jobs: result.rows });
    } catch { res.status(500).json({ success: false, error: 'Server error fetching jobs with applications.' }); }
    finally { if (client) client.release(); }
  });

  router.post('/admin/send-application-notifications', isAuthenticated, isAdmin, async (req, res) => {
    let client; try {
      const { jobIds } = req.body; if (!jobIds || jobIds.length === 0) { return res.status(400).json({ success: false, error: 'No job IDs provided.' }); }
      client = await pool.connect();
      const jobsQuery = `
        SELECT j.id, j.title, j.created_at, j.employer_id,
               u.first_name as employer_first_name, u.last_name as employer_last_name, u.email as employer_email,
               e.company_name as employer_company_name, COUNT(a.id) as application_count
        FROM jobs j JOIN users u ON j.employer_id = u.id LEFT JOIN employers e ON u.id = e.user_id
        JOIN applications a ON j.id = a.job_id WHERE j.id = ANY($1)
        GROUP BY j.id, j.title, j.created_at, j.employer_id, u.first_name, u.last_name, u.email, e.company_name
      `;
      const jobsResult = await client.query(jobsQuery, [jobIds]);
      const jobs = jobsResult.rows; if (jobs.length === 0) { return res.status(404).json({ success: false, error: 'No jobs found with the provided IDs.' }); }
      let successCount = 0, errorCount = 0;
      for (const job of jobs) {
        try {
          const employerName = job.employer_company_name || `${job.employer_first_name} ${job.employer_last_name}`;
          const subject = 'طلبات جديدة لوظيفتك في هايرلي - فرصة للعثور على أفضل المواهب!';
          const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';
          const mainContentHtml = `
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; font-size: 28px; margin: 0; font-weight: bold;">🎉 أخبار رائعة!</h1>
              <p style="color: #64748b; font-size: 16px; margin: 10px 0 0 0;">لديك طلبات جديدة لوظيفتك</p>
            </div>
            <p style="font-size: 18px; color: #1e293b; margin-bottom: 20px;">مرحباً <strong>${employerName}</strong>,</p>
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-right: 4px solid #6366f1; padding: 25px; margin: 25px 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <h3 style="color: #6366f1; margin: 0 0 15px 0; font-size: 20px; display: flex; align-items: center;">
                <i class="fas fa-briefcase" style="margin-left: 10px; font-size: 18px;"></i>
                تفاصيل الوظيفة
              </h3>
              <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 15px;">
                <p style="margin: 8px 0; font-size: 16px; color: #334155;"><strong>📋 عنوان الوظيفة:</strong> ${job.title}</p>
                <p style="margin: 8px 0; font-size: 16px; color: #334155;"><strong>👥 عدد الطلبات الجديدة:</strong> <span style="color: #059669; font-weight: bold; font-size: 18px;">${job.application_count}</span></p>
                <p style="margin: 8px 0; font-size: 16px; color: #334155;"><strong>📅 تاريخ النشر:</strong> ${new Date(job.created_at).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${appBaseUrl}/hire_dashboard.html" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-size: 18px; font-weight: bold; box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3); transition: all 0.3s ease; border: none;">
                <i class="fas fa-users" style="margin-left: 10px;"></i>
                مراجعة الطلبات الآن
              </a>
            </div>`;
          const fullEmailHtml = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${subject}</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></head><body><div class="container"><div class="content">${mainContentHtml}</div></div></body></html>`;
          
          await sendEmail(job.employer_email, subject, fullEmailHtml);
          
          await client.query(`INSERT INTO job_application_notifications (job_id, sent_at, sent_by_admin_id) VALUES ($1, NOW(), $2)
                               ON CONFLICT (job_id) DO UPDATE SET sent_at = NOW(), sent_by_admin_id = $2`, [job.id, req.session.userId]);
          successCount++;
        } catch (emailError) { errorCount++; }
      }
      if (successCount > 0) { res.json({ success: true, message: `Successfully sent ${successCount} notification(s). ${errorCount > 0 ? `${errorCount} failed.` : ''}`, successCount, errorCount }); }
      else { res.status(500).json({ success: false, error: 'Failed to send any notifications.' }); }
    } catch (error) { res.status(500).json({ success: false, error: 'Server error sending notifications.' }); }
    finally { if (client) client.release(); }
  });

  router.post('/admin/send-job-notifications', isAuthenticated, isAdmin, async (req, res) => {
    const { jobIds, filters } = req.body;
    try {
      if (!jobIds || jobIds.length === 0) { return res.status(400).json({ success: false, error: 'No job IDs provided.' }); }
      const result = await sendManualJobAlerts(jobIds, filters);
      if (result.success) { res.json({ success: true, message: `Job alerts sent to ${result.count} recipients.` }); }
      else { res.status(500).json({ success: false, error: result.error || 'Failed to send job alerts.' }); }
    } catch (error) { res.status(500).json({ success: false, error: 'Server error during job alert sending.' }); }
  });

  router.post('/admin/send-emails', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { subject, message, filters, template, dryRun } = req.body;
      const result = await sendEmailCampaign(subject, message, filters, template, dryRun);
      if (result.success) { res.status(200).json({ success: true, message: result.message, count: result.count }); }
      else { res.status(500).json({ success: false, error: result.error }); }
    } catch (error) { res.status(500).json({ success: false, error: 'Internal server error.' }); }
  });

  router.post('/admin/send-emails-test', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { subject, message, testEmail, template } = req.body;
      const recipient = testEmail || req.session.user.email;
      const result = await sendEmailCampaignTest(subject, message, recipient, template);
      if (result.success) { res.status(200).json({ success: true, message: result.message }); }
      else { res.status(500).json({ success: false, error: result.error }); }
    } catch (error) { res.status(500).json({ success: false, error: 'Internal server error.' }); }
  });

  router.post('/admin/send-email-campaign', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { subject, message, filters, template, dryRun, testEmail } = req.body;
      const result = await sendEmailCampaign(subject, message, filters, template, dryRun, testEmail);
      if (result.success) { res.status(200).json({ success: true, message: result.message, count: result.count }); }
      else { res.status(500).json({ success: false, error: result.error }); }
    } catch (error) { res.status(500).json({ success: false, error: 'Internal server error.' }); }
  });

  router.post('/admin/send-verification-email', isAuthenticated, isAdmin, async (req, res) => {
    let client; const { userId, email } = req.body;
    try {
      client = await pool.connect(); await client.query('BEGIN');
      const userResult = await client.query('SELECT id, is_email_verified FROM users WHERE id = $1 FOR UPDATE', [userId]);
      const user = userResult.rows[0]; if (!user) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, error: 'User not found.' }); }
      if (user.is_email_verified) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, error: 'Email is already verified.' }); }
      const newToken = Math.floor(100000 + Math.random() * 900000).toString(); const newExpiry = new Date(Date.now() + 30 * 60 * 1000);
      await client.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);
      await client.query('INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [userId, newToken, newExpiry]);
      await sendVerificationEmail(email, newToken);
      await client.query('COMMIT'); res.json({ success: true, message: 'New verification email sent successfully.' });
    } catch (error) { if (client) await client.query('ROLLBACK'); res.status(500).json({ success: false, error: error.message || 'Failed to send verification email.' }); }
    finally { if (client) client.release(); }
  });

  // --- Manual Outreach Routes ---
  router.get('/admin/outreach-leads', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        search: req.query.search,
        status: req.query.status,
        minApplicants: req.query.minApplicants,
        emailStatus: req.query.emailStatus
      };
      const data = await employerOutreach.getPendingLeads(page, limit, filters);
      res.json({ success: true, ...data });
    } catch (error) {
      logger.error('Error fetching outreach leads:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch outreach leads.' });
    }
  });

  router.post('/admin/update-outreach-email', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { jobId, email } = req.body;
      if (!jobId) return res.status(400).json({ success: false, error: 'Job ID is required.' });
      
      await employerOutreach.updateExternalCompanyEmail(jobId, email);
      res.json({ success: true, message: 'Email updated successfully.' });
    } catch (error) {
      logger.error('Error updating outreach email:', error);
      res.status(500).json({ success: false, error: 'Failed to update email.' });
    }
  });

  router.post('/admin/send-outreach', isAuthenticated, isAdmin, async (req, res) => {
    try {
      let { jobId, testEmail, language = 'en' } = req.body;
      if (!jobId) return res.status(400).json({ success: false, error: 'Job ID is required.' });

      if (testEmail === 'self') {
        testEmail = req.session.user.email;
      }

      const result = await employerOutreach.sendManualOutreach(jobId, language, testEmail);
      res.json({ success: true, message: `Email sent to ${result.recipient}`, recipient: result.recipient });
    } catch (error) {
      logger.error('Error sending manual outreach:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to send outreach.' });
    }
  });

  router.get('/admin/template-preview/:templateId', isAuthenticated, isAdmin, (req, res) => {
    const { templateId } = req.params;
    
    // Map frontend IDs to backend helper IDs
    const templateMapping = {
        'id-verification': 'id-verification-reminder',
        'email-verification': 'email-verification-reminder',
        'general-welcome': 'general-welcome',
        'professional-welcome': 'professional-welcome',
        'professional-engagement': 'professional-engagement',
        'employer-marketing': 'employer-marketing',
        'employer-engagement': 'employer-engagement',
        'job-application-notification': 'job-application-notification'
    };

    const backendTemplateId = templateMapping[templateId] || templateId;

    try {
        const content = getTemplateContent(backendTemplateId);
        res.json({ success: true, content });
    } catch (error) {
        logger.error(`Error fetching template ${templateId}:`, error);
        res.status(404).json({ success: false, error: 'Template not found' });
    }
  });

  router.get('/admin/email-campaign-progress/:campaignId', isAuthenticated, isAdmin, (req, res) => {
    const { campaignId } = req.params; const progress = (global.emailCampaignProgress || new Map()).get(campaignId);
    if (!progress) { return res.status(404).json({ success: false, error: 'Campaign not found.' }); }
    res.json({ success: true, progress });
  });

  router.post('/admin/send-emails-batch', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { subject, message, filters, template, dryRun } = req.body;
      const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (!global.emailCampaignProgress) global.emailCampaignProgress = new Map();
      global.emailCampaignProgress.set(campaignId, { status: 'starting', totalEmails: 0, processedEmails: 0, successCount: 0, failureCount: 0, currentBatch: 0, totalBatches: 0, batchSize: 17, startTime: new Date(), lastUpdate: new Date(), message: 'Initializing email campaign...' });
      setImmediate(async () => {
        try {
          const campaignData = { filters, emailList: filters.emails || null, templateType: template, customSubject: subject, customMessage: message, isDryRun: dryRun, batchSize: req.body.batchSize || 17, delayMs: (req.body.batchDelay || 2) * 60 * 1000, maxRecipients: req.body.maxRecipients || 1000 };
          const result = await sendEmailCampaignWithProgress(campaignData, global.emailCampaignProgress, campaignId);
          const final = global.emailCampaignProgress.get(campaignId); if (final) { final.status = result.success ? 'completed' : 'failed'; final.message = result.message || (result.success ? 'Campaign completed successfully' : 'Campaign failed'); final.lastUpdate = new Date(); final.endTime = new Date(); }
        } catch (error) {
          const progress = global.emailCampaignProgress.get(campaignId); if (progress) { progress.status = 'failed'; progress.message = error.message || 'Campaign failed with error'; progress.lastUpdate = new Date(); progress.endTime = new Date(); }
        }
      });
      res.json({ success: true, campaignId, message: 'Email campaign started. Use the campaign ID to track progress.' });
    } catch (error) { res.status(500).json({ success: false, error: 'Internal server error.' }); }
  });

  router.post('/admin/stop-email-campaign/:campaignId', isAuthenticated, isAdmin, (req, res) => {
    try {
      const { campaignId } = req.params; const progress = (global.emailCampaignProgress || new Map()).get(campaignId);
      if (!progress) { return res.status(404).json({ success: false, error: 'Campaign not found.' }); }
      if (['completed','failed','stopped'].includes(progress.status)) { return res.status(400).json({ success: false, error: 'Campaign is not running.' }); }
      progress.status = 'stopped'; progress.message = 'Campaign stopped by user'; progress.lastUpdate = new Date(); progress.endTime = new Date(); progress.shouldStop = true;
      res.json({ success: true, message: 'Campaign stop requested.' });
    } catch (error) { res.status(500).json({ success: false, error: 'Internal server error.' }); }
  });

  router.post('/admin/upload-company-logo', isAuthenticated, isAdmin, uploadAdminLogo, async (req, res) => {
    try {
      const { employerId } = req.body; 
      const logoFile = req.files?.['logo']?.[0] || req.files?.['company_logo']?.[0];
      
      if (!employerId) { return res.status(400).json({ error: 'Employer ID is required.' }); }
      if (!logoFile) { return res.status(400).json({ error: 'Logo file is required.' }); }
      let client; try {
        client = await pool.connect(); await client.query('BEGIN');
        const employerResult = await client.query('SELECT id FROM users WHERE id = $1 AND user_type = $2', [employerId, 'employer']);
        if (employerResult.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Employer not found.' }); }
        const company_logo_path = await storeFileInSupabase(employerId, 'company_logo', logoFile);
        const oldLogoResult = await client.query('SELECT company_logo_path FROM employers WHERE user_id = $1', [employerId]);
        const oldLogoPath = oldLogoResult.rows[0]?.company_logo_path;
        if (oldLogoPath && oldLogoPath !== 'N/A') { await deleteFileFromSupabase(oldLogoPath, 'company_logos'); }
        await client.query('UPDATE employers SET company_logo_path = $1 WHERE user_id = $2', [company_logo_path, employerId]);
        await client.query('COMMIT'); res.json({ success: true, message: 'Logo uploaded successfully.', logoUrl: company_logo_path });
      } catch (error) { if (client) await client.query('ROLLBACK'); res.status(500).json({ error: 'Failed to upload logo.' }); }
      finally { if (client) client.release(); }
    } catch (error) { res.status(500).json({ error: 'Failed to upload logo.' }); }
  });

  router.post('/admin/remove-company-logo', isAuthenticated, isAdmin, async (req, res) => {
    const { employerId } = req.body; if (!employerId) { return res.status(400).json({ error: 'Employer ID is required.' }); }
    let client; try {
      client = await pool.connect(); await client.query('BEGIN');
      const employerResult = await client.query('SELECT company_logo_path FROM employers WHERE user_id = $1', [employerId]);
      if (employerResult.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Employer not found.' }); }
      const currentLogoPath = employerResult.rows[0].company_logo_path;
      if (!currentLogoPath || currentLogoPath === 'N/A') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'No logo to remove.' }); }
      await deleteFileFromSupabase(currentLogoPath, 'company_logos');
      await client.query('UPDATE employers SET company_logo_path = $1 WHERE user_id = $2', ['N/A', employerId]);
      await client.query('COMMIT'); res.json({ success: true, message: 'Logo removed successfully.' });
    } catch (error) { if (client) await client.query('ROLLBACK'); res.status(500).json({ error: 'Failed to remove logo.' }); }
    finally { if (client) client.release(); }
  });

  router.get('/admin/categories', isAuthenticated, isAdmin, async (req, res) => {
    let client; try { client = await pool.connect(); const { rows } = await client.query('SELECT category, COUNT(*) as count FROM jobs GROUP BY category ORDER BY count DESC;'); const categories = rows.map(row => ({ name: row.category })); res.json({ success: true, categories }); } catch { res.status(500).json({ success: false, error: 'Failed to fetch categories.' }); } finally { if (client) client.release(); }
  });

  router.get('/admin/cities', isAuthenticated, isAdmin, async (req, res) => {
    let client; try { client = await pool.connect(); const { rows } = await client.query('SELECT city, COUNT(*) as count FROM jobs WHERE city IS NOT NULL GROUP BY city ORDER BY count DESC;'); const cities = rows.map(row => ({ name: row.city })); res.json({ success: true, cities }); } catch { res.status(500).json({ success: false, error: 'Failed to fetch cities.' }); } finally { if (client) client.release(); }
  });

  router.post('/admin/delete-user', isAuthenticated, isAdmin, async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID is required.' });
    
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      
      // Delete from all potential related tables first due to FK constraints
      // (The DB might have CASCADE, but let's be safe)
      await client.query('DELETE FROM professionals WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM employers WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM applications WHERE professional_id = $1', [userId]);
      await client.query("UPDATE jobs SET status = 'closed' WHERE employer_id = $1", [userId]);
      await client.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
      
      // Finally delete the user
      const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);
      
      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'User not found.' });
      }
      
      await client.query('COMMIT');
      res.json({ success: true, message: 'User and all related data deleted successfully.' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      logger.error('Error deleting user:', error);
      res.status(500).json({ success: false, error: 'Failed to delete user.' });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/admin/update-user-info', isAuthenticated, isAdmin, async (req, res) => {
    const { userId, firstName, lastName, email, phone, city, profession } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID is required.' });
    
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      
      // Update basic user info
      await client.query(`
        UPDATE users 
        SET first_name = COALESCE($1, first_name), 
            last_name = COALESCE($2, last_name), 
            email = COALESCE($3, email), 
            phone = COALESCE($4, phone), 
            city = COALESCE($5, city)
        WHERE id = $6
      `, [firstName, lastName, email, phone, city, userId]);
      
      // Update profession if professional
      if (profession) {
        await client.query(`
          UPDATE professionals 
          SET profession = $1 
          WHERE user_id = $2
        `, [profession, userId]);
      }
      
      await client.query('COMMIT');
      res.json({ success: true, message: 'User info updated successfully.' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      logger.error('Error updating user info:', error);
      res.status(500).json({ success: false, error: 'Failed to update user info.' });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/admin/aggregated-jobs', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    try {
      const { search = '', logoStatus = 'all', page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      client = await pool.connect();
      
      const params = [];
      let paramIndex = 1;
      const whereClauses = ["is_external = TRUE"];
      
      if (search) {
        const s = `%${search.toLowerCase()}%`;
        whereClauses.push(`(LOWER(title) ILIKE $${paramIndex} OR LOWER(external_company_name) ILIKE $${paramIndex})`);
        params.push(s);
        paramIndex++;
      }
      
      if (logoStatus === 'no-logo') {
        whereClauses.push("(external_company_logo IS NULL OR external_company_logo = '' OR external_company_logo LIKE '%ui-avatars.com%')");
      } else if (logoStatus === 'has-logo') {
        whereClauses.push("(external_company_logo IS NOT NULL AND external_company_logo != '' AND external_company_logo NOT LIKE '%ui-avatars.com%')");
      }
      
      const whereClause = ` WHERE ${whereClauses.join(' AND ')}`;
      
      // Fetch insights
      const [totalAgg, activeAgg, totalApps] = await Promise.all([
        client.query('SELECT COUNT(*) FROM jobs WHERE is_external = TRUE'),
        client.query("SELECT COUNT(*) FROM jobs WHERE is_external = TRUE AND status = 'open'"),
        client.query("SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.is_external = TRUE")
      ]);

      const countRes = await client.query(`SELECT COUNT(*) FROM jobs${whereClause}`, params);
      const totalCount = parseInt(countRes.rows[0].count);
      
      // Allowed sort columns
      const allowedSortColumns = {
        'created_at': 'j.created_at',
        'app_count': 'app_count',
        'views': 'j.external_apply_clicks'
      };
      const sortCol = allowedSortColumns[sortBy] || 'j.created_at';
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const query = `
        SELECT j.id, j.title, j.external_company_name, j.external_company_logo, j.external_apply_url, j.created_at, j.country, j.city,
               j.external_apply_clicks as views,
               (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as app_count,
               s.name as source_name
        FROM jobs j
        LEFT JOIN job_sources s ON j.external_source = s.name
        ${whereClause.replace('WHERE ', 'WHERE j.')}
        ORDER BY ${sortCol} ${order}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(parseInt(limit), offset);
      
      const { rows: jobs } = await client.query(query, params);
      res.json({ 
        success: true, 
        jobs,
        insights: {
          total: totalAgg.rows[0].count,
          active: activeAgg.rows[0].count,
          applications: totalApps.rows[0].count
        },
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: offset + jobs.length < totalCount
        }
      });
    } catch (error) {
      logger.error('Error fetching aggregated jobs:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch aggregated jobs.' });
    } finally { if (client) client.release(); }
  });

  // Global state for bulk logo fetch progress
  const bulkLogoStatus = {
    isWorking: false,
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    sanitized: 0,
    logs: [],
    startTime: null,
    stopRequested: false
  };

  router.get('/admin/bulk-logo-progress', isAuthenticated, isAdmin, (req, res) => {
    res.json({ success: true, status: bulkLogoStatus });
  });

  router.post('/admin/stop-bulk-logo-fetch', isAuthenticated, isAdmin, (req, res) => {
    if (bulkLogoStatus.isWorking) {
      bulkLogoStatus.stopRequested = true;
      bulkLogoStatus.logs.push({ 
        timestamp: new Date().toISOString(), 
        message: 'Stop requested by admin. Finishing current task...', 
        type: 'warning' 
      });
      res.json({ success: true, message: 'Stop request sent.' });
    } else {
      res.status(400).json({ success: false, error: 'No bulk fetch is currently running.' });
    }
  });

  router.post('/admin/bulk-magic-fetch-logos', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    try {
      if (bulkLogoStatus.isWorking) {
        return res.status(400).json({ success: false, error: 'A bulk fetch is already in progress.' });
      }

      const { mode, jobIds } = req.body;
      client = await pool.connect();
      
      let query = "SELECT id, external_company_name, external_apply_url FROM jobs WHERE is_external = true";
      let params = [];

      if (mode === 'selected' && jobIds && jobIds.length > 0) {
        query += ' AND id = ANY($1)';
        params.push(jobIds);
      } else if (mode === 'no-logo') {
        query += " AND (external_company_logo IS NULL OR external_company_logo = '' OR external_company_logo LIKE '%ui-avatars.com%')";
      }
      
      query += ' ORDER BY created_at DESC';
      
      const jobsRes = await client.query(query, params);

      if (jobsRes.rows.length === 0) {
        return res.json({ success: true, count: 0, message: 'No jobs found for processing.' });
      }

      // Initialize status
      bulkLogoStatus.isWorking = true;
      bulkLogoStatus.total = jobsRes.rows.length;
      bulkLogoStatus.current = 0;
      bulkLogoStatus.success = 0;
      bulkLogoStatus.failed = 0;
      bulkLogoStatus.sanitized = 0;
      bulkLogoStatus.stopRequested = false;
      bulkLogoStatus.logs = [{ timestamp: new Date().toISOString(), message: `Starting discovery for ${jobsRes.rows.length} jobs.`, type: 'info' }];
      bulkLogoStatus.startTime = new Date();
      
      processBulkLogos(jobsRes.rows, pool, bulkLogoStatus).catch(err => {
        logger.error('Bulk logo processing failed:', err);
        bulkLogoStatus.isWorking = false;
        bulkLogoStatus.logs.push({ timestamp: new Date().toISOString(), message: `Critical Error: ${err.message}`, type: 'error' });
      });

      res.json({ 
        success: true, 
        count: jobsRes.rows.length, 
        message: `Started AI discovery for ${jobsRes.rows.length} jobs.` 
      });
    } catch (error) {
      logger.error('Error initiating bulk logo fetch:', error);
      res.status(500).json({ success: false, error: 'Failed to initiate bulk discovery.' });
    } finally {
      if (client) client.release();
    }
  });

  // Helper function for background processing with concurrency
  async function processBulkLogos(jobs, pool, status) {
    const concurrency = 5;
    const sanitizationPatterns = [
      /private company/i, /anonymous/i, /employer identity hidden/i, /هوية صاحب العمل مخفية/i,
      /confidential/i, /hidden/i, /unknown/i, /شركة خاصة/i, /unspecified/i,
      /N\/A/i, /Not Provided/i, /Hirly Professional/i, /Professional User/i
    ];

    // Split jobs into chunks
    for (let i = 0; i < jobs.length; i += concurrency) {
      if (status.stopRequested) {
        status.isWorking = false;
        status.logs.push({ 
          timestamp: new Date().toISOString(), 
          message: 'Process stopped by user.', 
          type: 'info' 
        });
        return;
      }

      const chunk = jobs.slice(i, i + concurrency);
      
      await Promise.all(chunk.map(async (job) => {
        status.current++;
        const companyName = job.external_company_name || '';

        // Sanitization
        const isGeneric = sanitizationPatterns.some(pattern => pattern.test(companyName));
        if (isGeneric) {
          try {
            await pool.query("DELETE FROM jobs WHERE id = $1", [job.id]);
            status.sanitized++;
            status.logs.push({ 
              timestamp: new Date().toISOString(), 
              message: `Sanitized: Deleted generic employer "${companyName}"`, 
              type: 'warning' 
            });
          } catch (err) {}
          return;
        }

        try {
          const logoUrl = await logoFetcher.getLogoUrl(companyName, job.external_apply_url);
          if (logoUrl) {
            let finalLogoUrl = logoUrl;
            
            // Persist external logo to Supabase
            try {
              const buffer = await logoFetcher.fetchImageBuffer(logoUrl);
              const extension = path.extname(new URL(logoUrl).pathname) || '.png';
              const filename = `logo_${Date.now()}${extension}`;
              const mockFile = {
                buffer: buffer,
                originalname: filename,
                mimetype: 'image/png'
              };
              // Using a dummy admin ID (0) or the first admin's ID
              finalLogoUrl = await storeFileInSupabase(0, 'company_logo', mockFile);
            } catch (persistErr) {
              logger.warn(`Bulk persist failed for ${companyName}, using hotlink:`, persistErr.message);
            }

            await pool.query("UPDATE jobs SET external_company_logo = $1 WHERE id = $2", [finalLogoUrl, job.id]);
            status.success++;
            status.logs.push({ 
              timestamp: new Date().toISOString(), 
              message: `Found & Persisted logo for ${companyName}`, 
              type: 'success' 
            });
          } else {
            status.failed++;
            status.logs.push({ 
              timestamp: new Date().toISOString(), 
              message: `No logo found for ${companyName}`, 
              type: 'warning' 
            });
          }
        } catch (err) {
          status.failed++;
          status.logs.push({ 
            timestamp: new Date().toISOString(), 
            message: `Error for ${companyName}: ${err.message}`, 
            type: 'error' 
          });
        }
      }));

      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Keep logs manageable
      if (status.logs.length > 50) status.logs = status.logs.slice(-50);
    }
    
    status.isWorking = false;
    
    // Close browser after bulk operation to save resources
    try {
      await logoFetcher.closeBrowser();
    } catch (e) {}

    status.logs.push({ 
      timestamp: new Date().toISOString(), 
      message: `Bulk fetch completed. Success: ${status.success}, Failed: ${status.failed}, Sanitized: ${status.sanitized}`, 
      type: 'info' 
    });
  }

  router.post('/admin/magic-fetch-aggregated-logo', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    try {
      const { jobId } = req.body;
      if (!jobId) return res.status(400).json({ success: false, error: 'Job ID is required.' });
      
      client = await pool.connect();
      
      // Get job details to fetch logo
      const jobRes = await client.query(
        'SELECT external_company_name, external_apply_url FROM jobs WHERE id = $1 AND is_external = TRUE',
        [jobId]
      );
      
      if (jobRes.rowCount === 0) {
        return res.status(404).json({ success: false, error: 'Job not found or is not an aggregated job.' });
      }
      
      const { external_company_name, external_apply_url } = jobRes.rows[0];
      
      // Multi-Source Fetch
      const logoUrl = await logoFetcher.getLogoUrl(external_company_name, external_apply_url);
      
      if (!logoUrl) {
        return res.json({ success: false, error: 'Could not find a suitable logo automatically.' });
      }
      
      res.json({ success: true, logoUrl, message: 'Logo discovered successfully!' });
    } catch (error) {
      logger.error('Error in magic logo fetch:', error);
      res.status(500).json({ success: false, error: 'Failed to perform magic logo fetch.' });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/admin/fetch-logo-from-url', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { url, companyName } = req.body;
      
      // Pass the URL as the third parameter to prioritize it
      const logoUrl = await logoFetcher.getLogoUrl(companyName, null, url);
      if (logoUrl) {
        res.json({ success: true, logoUrl });
      } else {
        res.json({ success: false, error: 'Could not find a logo for this URL.' });
      }
    } catch (error) {
      logger.error('Error fetching logo from URL:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch logo from URL.' });
    }
  });

  router.post('/admin/delete-aggregated-job', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    try {
      const { jobId } = req.body;
      if (!jobId) return res.status(400).json({ success: false, error: 'Job ID is required.' });
      
      client = await pool.connect();
      const result = await client.query('DELETE FROM jobs WHERE id = $1 AND is_external = TRUE', [jobId]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, error: 'Job not found or is not an aggregated job.' });
      }
      
      res.json({ success: true, message: 'Job deleted successfully.' });
    } catch (error) {
      logger.error('Error deleting aggregated job:', error);
      res.status(500).json({ success: false, error: 'Failed to delete job.' });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/admin/update-aggregated-job-logo', isAuthenticated, isAdmin, uploadAdminLogo, async (req, res) => {
    let client;
    try {
      const { jobId, logoUrl } = req.body;
      const logoFile = req.files?.['logo']?.[0] || req.files?.['company_logo']?.[0];
      const adminId = req.session.userId;
      
      if (!jobId) return res.status(400).json({ success: false, error: 'Job ID is required.' });
      
      client = await pool.connect();
      await client.query('BEGIN');
      
      let finalLogoUrl = null;

      // 1. Priority: File Upload
      if (logoFile) {
        finalLogoUrl = await storeFileInSupabase(adminId, 'company_logo', logoFile);
      } 
      // 2. Secondary: External Logo URL (Download and Persist)
      else if (logoUrl) {
        try {
          // Download the external logo
          const buffer = await logoFetcher.fetchImageBuffer(logoUrl);
          
          // Determine extension from URL or content type
          const extension = path.extname(new URL(logoUrl).pathname) || '.png';
          const filename = `logo_${Date.now()}${extension}`;
          
          // Mock a file object for storeFileInSupabase
          const mockFile = {
            buffer: buffer,
            originalname: filename,
            mimetype: 'image/png' // fallback
          };
          
          finalLogoUrl = await storeFileInSupabase(adminId, 'company_logo', mockFile);
        } catch (downloadErr) {
          logger.error('Failed to persist external logo, using hotlink as fallback:', downloadErr);
          finalLogoUrl = logoUrl;
        }
      }
      
      if (!finalLogoUrl) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Logo URL or file is required.' });
      }
      
      const result = await client.query(
        'UPDATE jobs SET external_company_logo = $1 WHERE id = $2 AND is_external = TRUE',
        [finalLogoUrl, jobId]
      );
      
      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Job not found or is not an aggregated job.' });
      }
      
      await client.query('COMMIT');
      res.json({ success: true, message: 'Logo updated and persisted successfully.', logoUrl: finalLogoUrl });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      logger.error('Error updating aggregated job logo:', error);
      res.status(500).json({ success: false, error: 'Failed to update logo.' });
    } finally { if (client) client.release(); }
  });

  router.get('/admin/live-view', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'admin', 'live_view.html'));
  });

  router.get('/admin/job-aggregator', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'admin', 'job_aggregator.html'));
  });

  app.use('/', router);
};