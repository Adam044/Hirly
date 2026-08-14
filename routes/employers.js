const express = require('express');
const userService = require('../services/userService');

module.exports = function registerEmployersRoutes(app, pool, {
  isAuthenticated,
  isEmployer,
  isEmailVerified,
  uploadProfileFiles,
  uploadLogo,
  storeFileInSupabase,
  deleteFileFromSupabase,
  autoCloseExpiredJobs
}) {
  const router = express.Router();

  router.get('/employer/profile', isAuthenticated, isEmployer, async (req, res) => {
    let client;
    const employerId = req.session.userId;
    try {
      client = await pool.connect();
      const result = await client.query(`
        SELECT u.id, u.first_name as "firstName", u.last_name as "lastName", u.email, u.phone, u.city, u.country, u.slug, u.user_type as "userType",
               e.company_name as "companyName", e.company_description as "companyDescription", e.address, e.employer_type as "employerType",
               e.company_logo_path as "companyLogo", e.id_verification_path as "idVerificationPath",
               e.verification_status as "idVerificationStatus", e.company_category as "companyCategory",
               e.website_link as "websiteLink", e.company_email as "companyEmail", e.company_phone as "companyPhone",
               (SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.employer_id = u.id) as "totalApplications",
               e.profile_views as "profileViews"
        FROM users u
        LEFT JOIN employers e ON u.id = e.user_id
        WHERE u.id = $1 AND u.user_type = 'employer'
      `, [employerId]);
      const employer = result.rows[0];
      if (!employer) { return res.status(404).json({ success: false, error: 'Employer profile not found.' }); }
      res.json({ success: true, user: employer });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch employer profile.' });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/employer/profile', isAuthenticated, isEmployer, isEmailVerified, uploadProfileFiles, async (req, res) => {
    let client;
    const employerId = req.session.userId;
    const { firstName, lastName, phone, city, companyName, companyDescription, address, employerType, companyEmail, companyPhone, companyCategory, website_link } = req.body;
    const idFile = req.files && req.files['idFile'] ? req.files['idFile'][0] : null;
    try {
      if (autoCloseExpiredJobs) {
        await autoCloseExpiredJobs();
      }
      client = await pool.connect();
      await client.query('BEGIN');

      // 1. Update Personal Info (Users table)
      await userService.updatePersonalInfo(client, employerId, req.body);

      // 2. Update Employer Info (Employers table)
      await userService.updateEmployerData(client, employerId, req.body);

      if (idFile) {
        const oldIdResult = await client.query('SELECT id_verification_path FROM employers WHERE user_id = $1', [employerId]);
        const oldIdPath = oldIdResult.rows[0]?.id_verification_path;
        if (oldIdPath) { await deleteFileFromSupabase(oldIdPath); }
        const idFilePath = await storeFileInSupabase(employerId, 'id_verification', idFile);
        await client.query("UPDATE employers SET id_verification_path = $1, verification_status = 'Pending Verification' WHERE user_id = $2", [idFilePath, employerId]);
      }
      await client.query('COMMIT');
      res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: error.message || 'Failed to update profile.' });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/employer/upload-logo', isAuthenticated, isEmployer, isEmailVerified, (req, res) => {
    uploadLogo(req, res, async (err) => {
      if (err) { return res.status(400).json({ success: false, error: err.message }); }
      if (!req.file) { return res.status(400).json({ success: false, error: 'No logo file uploaded.' }); }
      const employerId = req.session.userId;
      let client;
      try {
        client = await pool.connect();
        await client.query('BEGIN');
        const company_logo_path = await storeFileInSupabase(employerId, 'company_logo', req.file);
        const oldLogoResult = await client.query('SELECT company_logo_path FROM employers WHERE user_id = $1', [employerId]);
        const oldLogo = oldLogoResult.rows[0] ? oldLogoResult.rows[0].company_logo_path : null;
        if (oldLogo) { await deleteFileFromSupabase(oldLogo); }
        await client.query('UPDATE employers SET company_logo_path = $1 WHERE user_id = $2', [company_logo_path, employerId]);
        await client.query('COMMIT');
        res.json({ success: true, message: 'Company logo uploaded successfully.', company_logo_path });
      } catch (error) {
        if (client) await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: 'Failed to upload company logo.' });
      } finally {
        if (client) client.release();
      }
    });
  });

  router.post('/employer/remove-logo', isAuthenticated, isEmployer, isEmailVerified, async (req, res) => {
    let client;
    const employerId = req.session.userId;
    try {
      if (autoCloseExpiredJobs) {
        await autoCloseExpiredJobs();
      }
      client = await pool.connect();
      await client.query('BEGIN');
      const result = await client.query('SELECT company_logo_path FROM employers WHERE user_id = $1', [employerId]);
      const row = result.rows[0];
      if (row && row.company_logo_path) { await deleteFileFromSupabase(row.company_logo_path); }
      await client.query('UPDATE employers SET company_logo_path = NULL WHERE user_id = $1', [employerId]);
      await client.query('COMMIT');
      res.json({ success: true, message: 'Company logo removed successfully.' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: 'Failed to remove company logo.' });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/employers', async (req, res) => {
    let client;
    try {
      if (autoCloseExpiredJobs) {
        await autoCloseExpiredJobs();
      }
      client = await pool.connect();
      const { search, location, category, sort } = req.query;
      let query = `
        SELECT u.id, u.first_name, u.last_name, u.city, u.slug,
               e.company_name, e.company_description, e.company_logo_path, e.verification_status, e.company_category, e.website_link,
               (SELECT COUNT(*) FROM jobs WHERE employer_id = u.id AND status = 'open') AS jobs_posted_count
        FROM users u JOIN employers e ON u.id = e.user_id
        WHERE u.user_type = 'employer'
      `;
      const params = [];
      let paramIndex = 1;
      if (search) {
        const searchTerm = `%${search.toLowerCase()}%`;
        query += ` AND (LOWER(u.first_name) ILIKE $${paramIndex} OR LOWER(u.last_name) ILIKE $${paramIndex} OR LOWER(e.company_name) ILIKE $${paramIndex} OR LOWER(e.company_description) ILIKE $${paramIndex})`;
        params.push(searchTerm);
        paramIndex++;
      }
      if (location) {
        try {
          const parsedLocations = JSON.parse(location);
          if (Array.isArray(parsedLocations) && parsedLocations.length > 0) {
            const placeholders = parsedLocations.map(() => `LOWER($${paramIndex++})`).join(', ');
            query += ` AND LOWER(u.city) IN (${placeholders})`;
            params.push(...parsedLocations.map(loc => loc.toLowerCase()));
          }
        } catch (e) {}
      }
      if (category) {
        try {
          const parsedCategories = JSON.parse(category);
          if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
            const placeholders = parsedCategories.map(() => `LOWER($${paramIndex++})`).join(', ');
            query += ` AND LOWER(e.company_category) IN (${placeholders})`;
            params.push(...parsedCategories.map(cat => cat.toLowerCase()));
          }
        } catch (e) {}
      }
      if (sort) {
        switch (sort) {
          case 'newest': query += ' ORDER BY u.created_at DESC'; break;
          case 'jobs_posted_desc': query += ' ORDER BY jobs_posted_count DESC'; break;
          default: query += ' ORDER BY u.created_at DESC';
        }
      } else {
        query += ' ORDER BY u.created_at DESC';
      }
      const result = await client.query(query, params);
      res.json({ success: true, employers: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch employers data.' });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/employers/by-slug/:slug', async (req, res) => {
    let client;
    const { slug } = req.params;
    try {
      if (autoCloseExpiredJobs) {
        await autoCloseExpiredJobs();
      }
      client = await pool.connect();
      // Increment profile views
      await client.query('UPDATE employers SET profile_views = COALESCE(profile_views, 0) + 1 WHERE user_id = (SELECT id FROM users WHERE slug = $1)', [slug]);
      
      const result = await client.query(`
        SELECT u.id, u.first_name, u.last_name, u.city AS location, u.slug,
               e.company_name, e.company_description, e.address, e.employer_type, e.company_logo_path,
               e.id_verification_path, e.verification_status, e.company_category, e.website_link, u.email, u.phone,
               e.profile_views
        FROM users u JOIN employers e ON u.id = e.user_id
        WHERE u.slug = $1 AND u.user_type = 'employer'
      `, [slug]);
      const employer = result.rows[0];
      if (!employer) { return res.status(404).json({ success: false, error: 'Employer not found.' }); }
      res.json({ success: true, employer });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch employer data.' });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/employers/:id', async (req, res) => {
    let client;
    const employerId = req.params.id;
    try {
      if (autoCloseExpiredJobs) {
        await autoCloseExpiredJobs();
      }
      client = await pool.connect();
      // Increment profile views
      await client.query('UPDATE employers SET profile_views = COALESCE(profile_views, 0) + 1 WHERE user_id = $1', [employerId]);

      const result = await client.query(`
        SELECT u.id, u.first_name, u.last_name, u.city AS location, u.slug,
               e.company_name, e.company_description, e.address, e.employer_type, e.company_logo_path,
               e.id_verification_path, e.verification_status, e.company_category, e.website_link, e.rating, u.email, u.phone,
               e.profile_views
        FROM users u JOIN employers e ON u.id = e.user_id
        WHERE u.id = $1 AND u.user_type = 'employer'
      `, [employerId]);
      const employer = result.rows[0];
      if (!employer) { return res.status(404).json({ success: false, error: 'Employer not found.' }); }
      res.json({ success: true, employer });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch employer data.' });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/companies/featured', async (req, res) => {
    let client;
    try {
      if (autoCloseExpiredJobs) {
        await autoCloseExpiredJobs();
      }
      client = await pool.connect();
      const result = await client.query(`
        SELECT e.company_name, e.company_logo_path, u.id AS user_id, u.slug, e.company_category
        FROM employers e JOIN users u ON e.user_id = u.id
        WHERE e.company_name IS NOT NULL AND e.verification_status = 'Verified'
        ORDER BY u.created_at DESC;
      `);
      res.json({ success: true, companies: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch featured companies.' });
    } finally {
      if (client) client.release();
    }
  });

  app.use('/api', router);
};