const express = require('express');
const { body, param, query } = require('express-validator');
const logger = require('../utils/logger');
const { logLiveEvent } = require('../realtime/manager');

module.exports = function registerJobsRoutes(app, pool, {
  isAuthenticated,
  isAdmin,
  isEmployer,
  isEmployerVerified,
  isEmailVerified,
  isProfessional,
  upload,
  uploadJobImageMiddleware,
  storeFileInSupabase,
  deleteFileFromSupabase,
  sendApplicationRejectedEmail,
  handleValidationErrors,
  sendEmail
}) {
  const router = express.Router();

  let lastAutoCloseTime = 0;
  const AUTO_CLOSE_INTERVAL = 1000 * 60 * 60; // Run once per hour

  async function autoCloseExpiredJobs() {
    const now = Date.now();
    if (now - lastAutoCloseTime < AUTO_CLOSE_INTERVAL) {
      return;
    }
    lastAutoCloseTime = now;
    
    let client;
    try {
      client = await pool.connect();
      await client.query(`
        UPDATE jobs 
        SET status = 'closed' 
        WHERE status = 'open'
          AND deadline < CURRENT_DATE
      `);
    } catch (error) {
      logger.error('Error auto-closing expired jobs:', error);
    } finally {
      if (client) client.release();
    }
  }

  router.post(
    '/jobs',
    isAuthenticated,
    (req, res, next) => {
      if (req.session.userType === 'admin') return next();
      return isEmployer(req, res, next);
    },
    (req, res, next) => {
      if (req.session.userType === 'admin') return next();
      return isEmployerVerified(req, res, next);
    },
    isEmailVerified,
    uploadJobImageMiddleware,
    [
      body('title').isString().trim().isLength({ min: 3 }),
      body('description').isString().trim().isLength({ min: 10 }),
      body('category').isString().trim().notEmpty(),
      body('jobType').isString().isIn(['Full-time','Part-time','Internship','Temporary','Freelance','Contract']),
      body('jobSiteType').isString().isIn(['Remote','On-site','Hybrid']),
      body('deadline').isISO8601(),
      body('requiredProfessions').isString().custom(v => { const a = JSON.parse(v || '[]'); if (!Array.isArray(a) || a.length === 0) throw new Error('invalid'); return true; }),
      body('requirements').optional({ checkFalsy: true }).isString().custom(v => { const a = JSON.parse(v || '[]'); if (!Array.isArray(a)) throw new Error('invalid'); return true; }),
      body('budget').optional({ checkFalsy: true }).isFloat({ gt: 0 }),
      body('currency').if(body('budget').exists()).isString().notEmpty(),
      body('city').custom((val, { req }) => { const t = req.body.jobSiteType; if (t === 'On-site' || t === 'Hybrid') { if (!val || String(val).trim() === '') throw new Error('invalid'); } return true; }).optional({ checkFalsy: true }),
      body('externalApplyUrl').optional({ checkFalsy: true }).isURL({ require_protocol: true }),
      body('genderRequirement').optional({ checkFalsy: true }).isIn(['male','female','any']),
      body('ageMin').optional({ checkFalsy: true }).isInt({ min: 16, max: 100 }),
      body('ageMax').optional({ checkFalsy: true }).isInt({ min: 16, max: 100 }),
      body('is_verified').optional().isBoolean(),
      body('is_confidential').optional().isBoolean()
    ],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const employerId = req.session.userId;
    const isAdminUser = req.session.userType === 'admin';
    const { 
        title, description, budget, currency, category, deadline, jobType, 
        jobSiteType, city, requiredProfessions, externalApplyUrl, requirements, 
        genderRequirement, ageMin, ageMax, is_verified, is_confidential 
    } = req.body;
 
    let jobImagePath = null;
    let fileCleanupId = null;
 
    try {
        client = await pool.connect();
        await client.query('BEGIN');
 
        if (req.file) {
            const jobImageFileUrl = await storeFileInSupabase(employerId, 'job_image', req.file);
            jobImagePath = jobImageFileUrl;
            fileCleanupId = jobImageFileUrl.split('/').pop();
        }
 
        let professionsArray;
        try {
            professionsArray = JSON.parse(requiredProfessions || '[]');
            if (!Array.isArray(professionsArray)) {
                throw new Error('Parsed professions is not an array.');
            }
        } catch (e) {
            throw e;
        }

        let requirementsArray;
        try {
            requirementsArray = JSON.parse(requirements || '[]');
            if (!Array.isArray(requirementsArray)) {
                throw new Error('Parsed requirements is not an array.');
            }
            requirementsArray = requirementsArray
                .map(r => (typeof r === 'string' ? r.trim() : ''))
                .filter(r => r.length > 0);
        } catch (e) {
            throw e;
        }

        let normalizedExternalUrl = null;
        if (externalApplyUrl && externalApplyUrl.trim() !== '') {
            try {
                const candidate = externalApplyUrl.trim();
                const u = new URL(candidate);
                normalizedExternalUrl = u.toString();
            } catch (e) {
                throw new Error('Invalid external application link.');
            }
        }

        if (!title || !description || !category || !jobType || !jobSiteType || !deadline || !professionsArray || professionsArray.length === 0) {
          throw new Error('All required job fields must be filled, select at least one profession, and a deadline.');
        }
        const isBudgetProvided = budget !== undefined && budget !== null && budget !== '';
        if (isBudgetProvided) {
          const parsedBudget = parseFloat(budget);
          if (isNaN(parsedBudget) || parsedBudget <= 0) {
            throw new Error('Budget must be a positive number.');
          }
          if (!currency) {
            throw new Error('Currency must be selected when a budget is provided.');
          }
        }
        if ((jobSiteType === 'On-site' || jobSiteType === 'Hybrid') && !city) {
            throw new Error('City is required for On-site or Hybrid jobs.');
        }
        let ageMinValue = null;
        let ageMaxValue = null;
        if (ageMin !== undefined || ageMax !== undefined) {
            const minParsed = ageMin !== undefined && ageMin !== null && String(ageMin).trim() !== '' ? parseInt(ageMin, 10) : null;
            const maxParsed = ageMax !== undefined && ageMax !== null && String(ageMax).trim() !== '' ? parseInt(ageMax, 10) : null;
            if (minParsed === null || maxParsed === null || isNaN(minParsed) || isNaN(maxParsed) || minParsed < 16 || maxParsed < 16 || minParsed > 100 || maxParsed > 100 || minParsed > maxParsed) {
                throw new Error('Invalid age range provided.');
            }
            ageMinValue = minParsed;
            ageMaxValue = maxParsed;
        }
        let genderRequirementValue = null;
        if (genderRequirement && ['male','female','any'].includes(genderRequirement)) {
            genderRequirementValue = genderRequirement;
        }

        const professionsJsonString = JSON.stringify(professionsArray);
        const requirementsJsonString = JSON.stringify(requirementsArray);

        // Handle Admin Flags
        const verifiedFlag = isAdminUser ? (String(is_verified) === 'true') : false;
        const confidentialFlag = isAdminUser ? (String(is_confidential) === 'true') : false;

        const jobInsertResult = await client.query(
          `INSERT INTO jobs (
              employer_id, title, description, budget, currency, category, deadline, 
              job_type, job_site_type, city, profession_required, job_image_path, 
              external_apply_url, requirements, gender_requirement, age_min, age_max,
              is_verified, is_confidential
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING id`,
          [
              employerId, title, description, isBudgetProvided ? parseFloat(budget) : null, 
              isBudgetProvided ? currency : null, category, deadline, jobType, 
              jobSiteType, city, professionsJsonString, jobImagePath, normalizedExternalUrl, 
              requirementsJsonString, genderRequirementValue, ageMinValue, ageMaxValue,
              verifiedFlag, confidentialFlag
          ]
        );
        const jobId = jobInsertResult.rows[0].id;
        
        // Log to Live View
        logLiveEvent('job', `New job posted: <b>${title}</b> in <b>${city || 'Remote'}</b>`);

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Job posted successfully.', jobId: jobId });
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        if (fileCleanupId) {
            await deleteFileFromSupabase(fileCleanupId).catch(err => logger.error('Failed to clean up file:', err));
        }
        logger.error('Error in job posting or database insert:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to post job due to server error.' });
    } finally {
        if (client) client.release();
    }
    }
  );

  router.get('/jobs/my', isAuthenticated, isEmployer, async (req, res) => {
    let client;
    const employerId = req.session.userId;
    try {
      await autoCloseExpiredJobs();
      client = await pool.connect();
      const result = await client.query(`
        SELECT
            j.id,
            j.title,
            j.budget,
            j.currency,
            j.status,
            j.created_at,
            j.deadline,
            j.city,
            j.job_type,
            j.views_count,
            (SELECT COUNT(*) FROM applications WHERE job_id = j.id) AS applications_count
        FROM jobs j
        WHERE j.employer_id = $1
        ORDER BY j.created_at DESC
      `, [employerId]);
      const formattedJobs = result.rows.map(job => {
          if (!job.profession_required) {
              job.profession_required = [];
          }
          return job;
      });
      res.json({ success: true, jobs: formattedJobs });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch employer jobs.' });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/jobs/recent', async (req, res) => {
    let client;
    const limit = parseInt(req.query.limit) || 6;
    const homeMode = req.query.mode === 'homepage';

    try {
      await autoCloseExpiredJobs();
      client = await pool.connect();
      
      let query = `
        SELECT j.id, j.title, j.city, j.country, j.category, j.job_site_type, j.created_at, j.job_image_path, j.job_type,
               j.is_verified, j.is_confidential,
               CASE 
                  WHEN j.is_confidential THEN 'Confidential Employer'
                  ELSE COALESCE(j.external_company_name, e.company_name, u.first_name || ' ' || u.last_name, 'N/A')
               END AS company_name,
               CASE 
                  WHEN j.is_confidential THEN NULL
                  ELSE COALESCE(j.external_company_logo, e.company_logo_path, u.profile_picture_url)
               END AS company_logo,
               CASE WHEN j.is_confidential THEN NULL ELSE u.slug END AS employer_slug,
               CASE WHEN j.is_confidential THEN NULL ELSE u.id END AS employer_id
        FROM jobs j
        LEFT JOIN employers e ON j.employer_id = e.user_id
        LEFT JOIN users u ON j.employer_id = u.id
        WHERE j.status = 'open' AND (j.deadline IS NULL OR j.deadline >= CURRENT_DATE)
      `;

      if (homeMode) {
        // Homepage constraints: Must have a logo, and title must be short (approx 4 words max)
        query += ` AND COALESCE(j.external_company_logo, e.company_logo_path, u.profile_picture_url) IS NOT NULL`;
        query += ` AND array_length(regexp_split_to_array(trim(j.title), '\\s+'), 1) <= 4`;
      }

      query += ` ORDER BY j.created_at DESC LIMIT $1`;

      const result = await client.query(query, [limit]);
      res.json({ success: true, jobs: result.rows });
    } catch (error) {
      logger.error('Error fetching recent jobs:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch recent jobs' });
    } finally {
      if (client) client.release();
    }
  });

  router.get(
    '/jobs',
    [
      query('search').optional().isString(),
      query('category').optional().isString(),
      query('budget').optional().isFloat({ gt: 0 }),
      query('location').optional().isString(),
      query('country').optional().isString(),
      query('jobSiteType').optional().isIn(['Remote','On-site','Hybrid']),
      query('professionRequired').optional().isString(),
      query('sort').optional().isIn(['budget_desc','budget_asc','date_desc','date_asc','newest','oldest']),
      query('jobType').optional()
    ],
    handleValidationErrors,
    async (req, res) => {
    let client;
    try {
      await autoCloseExpiredJobs();
      client = await pool.connect();
      const { search, category, budget, location, country, jobSiteType, professionRequired, sort, jobType } = req.query;

    const parseParamArray = (param) => {
        if (!param) return null;
        try {
            const parsed = JSON.parse(param);
            if (Array.isArray(parsed)) return parsed;
            return [param];
        } catch (e) {
            return [param];
        }
    };

    const categories = parseParamArray(category);
    const locations = parseParamArray(location);
    const countries = parseParamArray(country);
    const professions = parseParamArray(professionRequired);
    const jobTypes = parseParamArray(jobType);

    let selectClause = `
      j.id, j.title, j.description, j.budget, j.currency, j.deadline, j.created_at, j.status, j.job_type, j.job_site_type, j.city, j.country, j.profession_required, j.job_image_path, j.category, j.gender_requirement, j.age_min, j.age_max,
      j.is_external, j.external_source, j.external_apply_url, j.is_verified, j.is_confidential,
      CASE 
         WHEN j.is_confidential THEN 'Confidential Employer'
         ELSE COALESCE(j.external_company_name, e.company_name, u.first_name || ' ' || u.last_name, 'N/A')
      END AS display_employer_name,
      CASE 
         WHEN j.is_confidential THEN NULL
         ELSE COALESCE(j.external_company_logo, e.company_logo_path, u.profile_picture_url)
      END AS display_employer_logo,
      CASE 
         WHEN j.is_confidential THEN 'confidential'
         WHEN j.is_external THEN 'external'
         WHEN e.company_name IS NOT NULL THEN 'company'
         ELSE 'individual'
      END AS display_employer_type,
      u.user_type AS employer_type,
      CASE WHEN j.is_confidential THEN NULL ELSE u.id END AS employer_user_id,
      CASE WHEN j.is_confidential THEN NULL ELSE u.slug END AS employer_slug
    `;

    let whereClause = `WHERE (j.status = 'open' OR j.status = 'closed') AND (j.deadline IS NULL OR j.deadline >= CURRENT_DATE)`;
    const params = [];
    let paramIndex = 1;
    let rankClause = '';

    if (search) {
      // Use PostgreSQL Full-Text Search with weights and fallback to ILIKE
      // A: Title (highest weight), B: Description, C: Company Name
      whereClause += ` AND (
        to_tsvector('english', concat_ws(' ', j.title, j.description, j.external_company_name, e.company_name)) @@ plainto_tsquery('english', $${paramIndex})
        OR j.title ILIKE $${paramIndex + 1}
        OR j.description ILIKE $${paramIndex + 1}
        OR COALESCE(j.external_company_name, e.company_name) ILIKE $${paramIndex + 1}
      )`;
      
      rankClause = `, ts_rank_cd(
        setweight(to_tsvector('english', COALESCE(j.title, '')), 'A') || 
        setweight(to_tsvector('english', COALESCE(j.description, '')), 'B') ||
        setweight(to_tsvector('english', concat_ws(' ', j.external_company_name, e.company_name)), 'C'),
        plainto_tsquery('english', $${paramIndex})
      ) AS relevance_rank`;
      
      params.push(search, `%${search}%`);
      paramIndex += 2;
    }

    let query = `
      SELECT ${selectClause} ${rankClause}
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.user_id
      LEFT JOIN users u ON j.employer_id = u.id
      ${whereClause}
    `;
      if (categories && categories.length > 0) {
        query += ` AND j.category = ANY($${paramIndex}::text[])`;
        params.push(categories);
        paramIndex++;
      }
      if (budget) {
        const parsedBudget = parseFloat(budget);
        if (!isNaN(parsedBudget)) {
          query += ` AND j.budget >= $${paramIndex}`;
          params.push(parsedBudget);
          paramIndex++;
        }
      }
      if (locations && locations.length > 0) {
        query += ` AND j.city = ANY($${paramIndex}::text[])`;
        params.push(locations);
        paramIndex++;
      }
      if (countries && countries.length > 0) {
        query += ` AND j.country = ANY($${paramIndex}::text[])`;
        params.push(countries);
        paramIndex++;
      }
      if (jobSiteType) {
        query += ` AND j.job_site_type = $${paramIndex}`;
        params.push(jobSiteType);
        paramIndex++;
      }
      if (professions && professions.length > 0) {
        query += ` AND j.profession_required ?| $${paramIndex}::text[]`;
        params.push(professions);
        paramIndex++;
      }
      if (jobTypes && jobTypes.length > 0) {
        query += ` AND j.job_type = ANY($${paramIndex}::text[])`;
        params.push(jobTypes);
        paramIndex++;
      }
      // Primary Sort: Active jobs first, Expired jobs at the bottom
      const deadlineSort = `
        CASE 
          WHEN j.deadline IS NULL THEN 0
          WHEN j.deadline >= CURRENT_DATE THEN 0
          ELSE 1
        END ASC
      `;

      let orderBy = `ORDER BY ${deadlineSort}`;
      if (search) {
        orderBy += `, relevance_rank DESC`;
      }

      if (sort) {
        if (sort === 'budget_desc') orderBy += `, j.budget DESC NULLS LAST`;
        else if (sort === 'budget_asc') orderBy += `, j.budget ASC NULLS LAST`;
        else if (sort === 'date_desc' || sort === 'newest') orderBy += `, j.created_at DESC`;
        else if (sort === 'date_asc' || sort === 'oldest') orderBy += `, j.created_at ASC`;
        else orderBy += `, j.created_at DESC`;
      } else if (!search) {
        orderBy += `, j.created_at DESC`;
      }

      query += ` ${orderBy}`;
      const result = await client.query(query, params);
      res.json({ success: true, jobs: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
    } finally {
      if (client) client.release();
    }
    }
  );

  router.get('/jobs/featured-companies', async (req, res) => {
    let client;
    try {
      await autoCloseExpiredJobs();
      client = await pool.connect();
      const result = await client.query(`
        SELECT
            e.company_name,
            e.company_logo_path,
            u.id AS user_id,
            u.slug,
            e.company_category
        FROM employers e
        JOIN users u ON e.user_id = u.id
        WHERE e.company_name IS NOT NULL
        ORDER BY u.created_at DESC;
      `);
      res.json({ success: true, companies: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch featured companies.' });
    } finally {
      if (client) client.release();
    }
  });

  router.get(
    '/jobs/:id',
    [param('id').isInt({ min: 1 })],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const jobId = req.params.id;
    try {
      await autoCloseExpiredJobs();
      client = await pool.connect();
      const result = await client.query(`
        SELECT
            j.id, j.title, j.description, j.budget, j.currency, j.deadline, j.category, j.status, j.created_at,
            j.job_type, j.job_site_type, j.profession_required, j.job_image_path,
            j.is_external, j.external_source, j.external_apply_url,
            j.requirements, j.external_apply_clicks,
            j.city AS job_city, j.country AS job_country,
            j.is_verified, j.is_confidential,
            CASE 
                WHEN j.is_confidential THEN 'Confidential Employer'
                ELSE COALESCE(j.external_company_name, e.company_name, u.first_name || ' ' || u.last_name, 'N/A')
            END AS display_employer_name,
            CASE 
                WHEN j.is_confidential THEN NULL
                ELSE COALESCE(j.external_company_logo, e.company_logo_path, u.profile_picture_url)
            END AS display_employer_logo,
            CASE 
                WHEN j.is_confidential THEN 'confidential'
                WHEN j.is_external THEN 'external'
                WHEN e.company_name IS NOT NULL THEN 'company'
                ELSE 'individual'
            END AS display_employer_type,
            CASE WHEN j.is_confidential THEN NULL ELSE e.company_description END AS employer_company_description,
            CASE WHEN j.is_confidential THEN false ELSE COALESCE(e.verification_status = 'Verified', false) END AS is_employer_verified,
            e.employer_type,
            CASE WHEN j.is_confidential THEN NULL ELSE e.address END AS employer_address,
            CASE WHEN j.is_confidential THEN NULL ELSE u.email END AS employer_email,
            CASE WHEN j.is_confidential THEN NULL ELSE u.phone END AS employer_phone,
            CASE WHEN j.is_confidential THEN NULL ELSE u.first_name END AS employer_first_name,
            CASE WHEN j.is_confidential THEN NULL ELSE u.last_name END AS employer_last_name,
            CASE WHEN j.is_confidential THEN NULL ELSE u.id END AS employer_user_id,
            CASE WHEN j.is_confidential THEN NULL ELSE u.slug END AS employer_slug,
            CASE WHEN j.is_confidential THEN NULL ELSE u.city END AS employer_city,
            (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE professional_id = u.id) AS professional_average_rating,
            (SELECT COUNT(id) FROM reviews WHERE professional_id = u.id) AS professional_reviews_count
        FROM jobs j
        LEFT JOIN users u ON j.employer_id = u.id
        LEFT JOIN employers e ON u.id = e.user_id
        WHERE j.id = $1
      `, [jobId]);
      const job = result.rows[0];
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      if (!job.profession_required) job.profession_required = [];
      if (!job.requirements) job.requirements = [];
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      if (client) client.release();
    }
    }
  );

  router.post(
    '/jobs/:jobId/external-apply-click',
    [param('jobId').isInt({ min: 1 })],
    handleValidationErrors,
    async (req, res) => {
    const jobId = req.params.jobId;
    let client;
    try {
      await autoCloseExpiredJobs();
      client = await pool.connect();
      const updateResult = await client.query(
        'UPDATE jobs SET external_apply_clicks = COALESCE(external_apply_clicks, 0) + 1 WHERE id = $1 RETURNING external_apply_clicks',
        [jobId]
      );
      if (updateResult.rowCount === 0) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }
      res.json({ success: true, external_apply_clicks: updateResult.rows[0].external_apply_clicks });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to record click.' });
    } finally {
      if (client) client.release();
    }
    }
  );

  router.post(
    '/jobs/:jobId/view',
    [param('jobId').isInt({ min: 1 })],
    handleValidationErrors,
    async (req, res) => {
    const jobId = req.params.jobId;
    let client;
    try {
      await autoCloseExpiredJobs();
      client = await pool.connect();
      const updateResult = await client.query(
        'UPDATE jobs SET views_count = COALESCE(views_count, 0) + 1 WHERE id = $1 RETURNING views_count',
        [jobId]
      );
      if (updateResult.rowCount === 0) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }
      res.json({ success: true, views_count: updateResult.rows[0].views_count });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to record view.' });
    } finally {
      if (client) client.release();
    }
    }
  );

  router.get(
    '/jobs/employer/:employerId',
    [
      param('employerId').isInt({ min: 1 }),
      query('excludeJobId').optional().isInt({ min: 1 })
    ],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const employerId = req.params.employerId;
    const excludeJobId = req.query.excludeJobId;
    try {
      await autoCloseExpiredJobs();
      client = await pool.connect();
      let query = `
        SELECT j.id, j.title, j.description, j.budget, j.currency, j.category, j.job_site_type, j.city, j.created_at, j.job_image_path, j.job_type,
               j.is_verified, j.is_confidential,
               CASE WHEN j.is_confidential THEN NULL ELSE u.slug END AS employer_slug
        FROM jobs j
        JOIN users u ON j.employer_id = u.id
        WHERE j.employer_id = $1 AND j.is_confidential = false
      `;
      const params = [employerId];
      let paramIndex = 2;
      if (excludeJobId) {
        query += ` AND j.id != $${paramIndex}`;
        params.push(excludeJobId);
        paramIndex++;
      }
      query += ` ORDER BY j.created_at DESC LIMIT 5`;
      const result = await client.query(query, params);
      res.json({ success: true, jobs: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch other jobs.' });
    } finally {
      if (client) client.release();
    }
    }
  );

  router.post(
    '/jobs/:jobId/apply',
    isAuthenticated,
    isProfessional,
    isEmailVerified,
    upload.none(),
    [
      param('jobId').isInt({ min: 1 }),
      body('proposalMessage').isString().trim().isLength({ min: 1 }),
      body('bidAmount').optional({ checkFalsy: true }).isFloat({ gt: 0 }),
      body('timeline').optional({ nullable: true, checkFalsy: true }).isString()
    ],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const jobId = req.params.jobId;
    const professionalId = req.session.userId;
    let { proposalMessage, bidAmount, timeline } = req.body;

    try {
      await autoCloseExpiredJobs();
      client = await pool.connect();
      await client.query('BEGIN');

      if (!proposalMessage || proposalMessage.trim() === '') {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Proposal message is required.' });
      }

      const jobResult = await client.query('SELECT id, title, employer_id, status, job_type, currency FROM jobs WHERE id = $1 FOR UPDATE', [jobId]);
      const job = jobResult.rows[0];

      if (!job) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Job not found.' });
      }
      if (!job.status || job.status.toLowerCase() !== 'open') {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Cannot apply to a job that is not open.' });
      }

      if (job.job_type === 'Full-time' || job.job_type === 'Part-time' || job.job_type === 'Internship' || job.job_type === 'Temporary') {
          bidAmount = 0;
          timeline = null;
      } else if (job.job_type === 'Freelance' || job.job_type === 'Contract') {
          const parsedBidAmount = parseFloat(bidAmount);
          if (!bidAmount || isNaN(parsedBidAmount) || parsedBidAmount <= 0) {
              await client.query('ROLLBACK');
              return res.status(400).json({ success: false, error: 'Bid amount is required and must be a positive number for this job type.' });
          }
          bidAmount = parsedBidAmount;
          timeline = timeline || null;
      } else {
          bidAmount = (bidAmount && !isNaN(parseFloat(bidAmount))) ? parseFloat(bidAmount) : null;
          timeline = timeline || null;
      }

      const existingApplicationResult = await client.query('SELECT id FROM applications WHERE job_id = $1 AND professional_id = $2', [jobId, professionalId]);
      const existingApplication = existingApplicationResult.rows[0];

      if (existingApplication) {
        await client.query('ROLLBACK');
        return res.status(409).json({ success: false, error: 'You have already applied for this job.' });
      }

      const applicationInsertResult = await client.query(
        `INSERT INTO applications (job_id, professional_id, proposal_message, bid_amount, timeline, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [jobId, professionalId, proposalMessage, bidAmount, timeline, 'pending']
      );
      const applicationId = applicationInsertResult.rows[0].id;

      // Log to Live View
      logLiveEvent('application', `New application submitted for <b>${job.title}</b>`);

      await client.query('COMMIT');

      // Trigger AI evaluation in the background if it's an external job
      if (job.is_external || !job.employer_id) {
          const aiEvalService = req.app.get('aiEvaluationService');
          if (aiEvalService) {
              aiEvalService.analyzeApplication(applicationId).catch(err => {
                  logger.error(`Auto AI evaluation failed for app ${applicationId}:`, err);
              });
          }
      }

      res.status(201).json({ success: true, message: 'Application submitted successfully.', applicationId: applicationId });
    } catch (error) {
      if (client) {
          try {
              await client.query('ROLLBACK');
          } catch (rollbackError) {}
      }
      res.status(500).json({ success: false, error: 'Server error during application submission.' });
    } finally {
      if (client) client.release();
    }
    }
  );

  router.post(
    '/jobs/:jobId/bulk-reject',
    isAuthenticated,
    isEmployer,
    isEmployerVerified,
    isEmailVerified,
    upload.none(),
    [
      param('jobId').isInt({ min: 1 }),
      body('rejectionReason').optional().isString().isLength({ max: 500 }),
      body('targetStatuses').optional().isArray(),
      body('filters').optional().isObject()
    ],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const jobId = req.params.jobId;
    const { rejectionReason, targetStatuses = ['pending'], filters = {} } = req.body;
    const employerId = req.session.userId;

    try {
        client = await pool.connect();
        await client.query('BEGIN');
        const jobResult = await client.query('SELECT title FROM jobs WHERE id = $1 AND employer_id = $2', [jobId, employerId]);
        if (jobResult.rows.length === 0) {
            return res.status(403).json({ success: false, error: 'Access denied. You do not have permission to modify applications for this job.' });
        }
        const jobTitle = jobResult.rows[0].title;

        // Build Query
        let queryStr = `
            SELECT a.id, u.email, u.first_name, u.last_name
            FROM applications a
            JOIN users u ON a.professional_id = u.id
            LEFT JOIN professionals f ON u.id = f.user_id
            WHERE a.job_id = $1 AND a.status = ANY($2::text[])
        `;
        const queryParams = [jobId, targetStatuses];
        let paramIndex = 3;

        if (filters.city) {
            queryStr += ` AND u.city = $${paramIndex}`;
            queryParams.push(filters.city);
            paramIndex++;
        }
        if (filters.gender) {
            queryStr += ` AND u.gender = $${paramIndex}`;
            queryParams.push(filters.gender);
            paramIndex++;
        }
        if (filters.hasCV === 'yes') {
            queryStr += ` AND f.cv_path IS NOT NULL`;
        } else if (filters.hasCV === 'no') {
            queryStr += ` AND f.cv_path IS NULL`;
        }

        const pendingApplicationsResult = await client.query(queryStr, queryParams);
        const pendingApplications = pendingApplicationsResult.rows;

        if (pendingApplications.length === 0) {
            return res.status(400).json({ success: false, error: 'No matching applications found to reject.' });
        }

        const applicationIds = pendingApplications.map(app => app.id);
        
        // Bulk Update
        let updateQuery;
        let updateParams;
        if (rejectionReason && rejectionReason.trim()) {
            updateQuery = `
                UPDATE applications 
                SET status = 'rejected', rejection_reason = $1 
                WHERE id = ANY($2::int[])
            `;
            updateParams = [rejectionReason.trim(), applicationIds];
        } else {
            updateQuery = `
                UPDATE applications 
                SET status = 'rejected', rejection_reason = NULL 
                WHERE id = ANY($1::int[])
            `;
            updateParams = [applicationIds];
        }

        const updateResult = await client.query(updateQuery, updateParams);
        await client.query('COMMIT');

        // Send Emails
        const batchSize = 5;
        let emailsSent = 0;
        let emailsFailed = 0;

        // Process emails asynchronously to avoid blocking response too long, or keep it simple
        // Given nodejs event loop, we can just fire and forget or await if we want to report stats.
        // User wants "smart" organization, reporting stats is good.
        for (let i = 0; i < pendingApplications.length; i += batchSize) {
            const batch = pendingApplications.slice(i, i + batchSize);
            const batchPromises = batch.map(async (applicant) => {
                try {
                    const result = await sendApplicationRejectedEmail(applicant.email, applicant.first_name, jobTitle, rejectionReason);
                    if (result.success) emailsSent++; else emailsFailed++;
                } catch (error) {
                    emailsFailed++;
                }
            });
            await Promise.all(batchPromises);
        }

        res.json({ 
            success: true, 
            message: `Successfully rejected ${updateResult.rowCount} applications.`,
            rejectedCount: updateResult.rowCount,
            emailsSent,
            emailsFailed
        });
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        logger.error('Bulk reject error:', error);
        res.status(500).json({ success: false, error: 'Server error while rejecting applications.' });
    } finally {
        if (client) client.release();
    }
    }
  );

  router.post(
    '/jobs/:jobId/reject-all-pending',
    isAuthenticated,
    isEmployer,
    isEmployerVerified,
    isEmailVerified,
    upload.none(),
    [
      param('jobId').isInt({ min: 1 }),
      body('rejectionReason').optional().isString().isLength({ max: 500 })
    ],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const jobId = req.params.jobId;
    const { rejectionReason } = req.body;
    const employerId = req.session.userId;

    try {
        client = await pool.connect();
        await client.query('BEGIN');
        const jobResult = await client.query('SELECT title FROM jobs WHERE id = $1 AND employer_id = $2', [jobId, employerId]);
        if (jobResult.rows.length === 0) {
            return res.status(403).json({ success: false, error: 'Access denied. You do not have permission to modify applications for this job.' });
        }
        const jobTitle = jobResult.rows[0].title;

        const pendingApplicationsResult = await client.query(`
            SELECT a.id, u.email, u.first_name, u.last_name
            FROM applications a
            JOIN users u ON a.professional_id = u.id
            WHERE a.job_id = $1 AND a.status = 'pending'
        `, [jobId]);
        const pendingApplications = pendingApplicationsResult.rows;

        if (pendingApplications.length === 0) {
            return res.status(400).json({ success: false, error: 'No pending applications found for this job.' });
        }

        const applicationIds = pendingApplications.map(app => app.id);
        let updateQuery;
        let updateParams;
        if (rejectionReason && rejectionReason.trim()) {
            updateQuery = `
                UPDATE applications 
                SET status = 'rejected', rejection_reason = $1 
                WHERE id = ANY($2::int[])
            `;
            updateParams = [rejectionReason.trim(), applicationIds];
        } else {
            updateQuery = `
                UPDATE applications 
                SET status = 'rejected', rejection_reason = NULL 
                WHERE id = ANY($1::int[])
            `;
            updateParams = [applicationIds];
        }

        const updateResult = await client.query(updateQuery, updateParams);
        await client.query('COMMIT');

        const batchSize = 5;
        const totalApplicants = pendingApplications.length;
        let emailsSent = 0;
        let emailsFailed = 0;

        for (let i = 0; i < pendingApplications.length; i += batchSize) {
            const batch = pendingApplications.slice(i, i + batchSize);
            const batchPromises = batch.map(async (applicant) => {
                try {
                    const result = await sendApplicationRejectedEmail(applicant.email, applicant.first_name, jobTitle, rejectionReason);
                    if (result.success) {
                        emailsSent++;
                    } else {
                        emailsFailed++;
                    }
                } catch (error) {
                    emailsFailed++;
                }
            });
            await Promise.all(batchPromises);
            if (i + batchSize < pendingApplications.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        res.json({ 
            success: true, 
            message: `Successfully rejected ${updateResult.rowCount} pending applications. ${emailsSent} rejection emails sent successfully${emailsFailed > 0 ? `, ${emailsFailed} failed` : ''}.`,
            rejectedCount: updateResult.rowCount,
            emailsSent,
            emailsFailed,
            totalEmails: totalApplicants
        });
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: 'Server error while rejecting applications.' });
    } finally {
        if (client) client.release();
    }
    }
  );

  router.delete(
    '/jobs/:jobId',
    isAuthenticated,
    isEmployer,
    isEmployerVerified,
    [param('jobId').isInt({ min: 1 })],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const jobId = req.params.jobId;
    const employerId = req.session.userId;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        const jobResult = await client.query('SELECT employer_id FROM jobs WHERE id = $1 FOR UPDATE', [jobId]);
        const job = jobResult.rows[0];
        if (!job || job.employer_id !== employerId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, error: 'Access denied. You do not own this job.' });
        }
        
        // Instead of deleting, we just mark it as closed
        const updateResult = await client.query('UPDATE jobs SET status = \'closed\' WHERE id = $1 RETURNING id', [jobId]);
        
        if (updateResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Job not found.' });
        }
        await client.query('COMMIT');
        res.json({ success: true, message: 'Job closed successfully.' });
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        logger.error('Error closing job:', error);
        res.status(500).json({ success: false, error: 'Server error during job closure.' });
    } finally {
        if (client) client.release();
    }
    }
  );

  router.post(
    '/jobs/:jobId/assign-professional',
    isAuthenticated,
    isEmployer,
    isEmployerVerified,
    isEmailVerified,
    [
      param('jobId').isInt({ min: 1 }),
      body('professionalId').isInt({ min: 1 }),
      body('keepJobOpen').optional().isBoolean({ loose: true })
    ],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const jobId = req.params.jobId;
    const { professionalId, keepJobOpen } = req.body;
    const employerId = req.session.userId;
    if (!professionalId) {
      return res.status(400).json({ success: false, error: 'Professional ID is required.' });
    }
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const jobResult = await client.query('SELECT employer_id, status, title FROM jobs WHERE id = $1 FOR UPDATE', [jobId]);
      const job = jobResult.rows[0];
      if (!job || job.employer_id !== employerId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, error: 'Access denied. This job does not belong to you.' });
      }
      if (job.status !== 'open') {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Job is not open for assignment.' });
      }
      const applicationResult = await client.query('SELECT id FROM applications WHERE job_id = $1 AND professional_id = $2', [jobId, professionalId]);
      const application = applicationResult.rows[0];
      if (!application) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Professional did not apply to this job or does not exist.' });
      }
      await client.query('UPDATE applications SET status = \'accepted\' WHERE job_id = $1 AND professional_id = $2', [jobId, professionalId]);
      const professionalResult = await client.query('SELECT email, first_name FROM users WHERE id = $1', [professionalId]);
      const professional = professionalResult.rows[0];
      await client.query('COMMIT');
      if (professional && professional.email) {
        try {
          const nodemailer = require('nodemailer');
          const subject = '🎉 تهانينا! لقد تم اختيارك للوظيفة!';
          const mainContentHtml = `
            <div style="text-align: center; padding: 20px 0;">
                <h1 style="color: #6366f1; font-size: 28px; margin-bottom: 10px;">🎉 مبروك ${professional.first_name}! 🎉</h1>
                <div style="font-size: 48px; margin: 20px 0;">🚀</div>
            </div>
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 20px 0;">
                <h2 style="margin: 0; font-size: 24px;">لقد تم توظيفك!</h2>
                <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">للوظيفة: "${job.title}"</p>
            </div>
            <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; border-right: 4px solid #10b981; margin: 20px 0;">
                <p style="font-size: 18px; margin: 0; color: #065f46;">
                    <strong>🎯 هذا إنجاز رائع!</strong><br>
                    لقد أعجب صاحب العمل بمهاراتك وخبرتك واختارك من بين جميع المتقدمين.
                </p>
            </div>
            <div style="margin: 25px 0;">
                <h3 style="color: #374151; font-size: 20px; margin-bottom: 15px;">📋 الخطوات التالية:</h3>
                <ul style="list-style: none; padding: 0;">
                    <li style="padding: 8px 0; font-size: 16px;">✅ تم تحديث حالة طلبك إلى "مقبول"</li>
                    <li style="padding: 8px 0; font-size: 16px;">📧 سيتواصل معك صاحب العمل قريباً</li>
                    <li style="padding: 8px 0; font-size: 16px;">💼 ابدأ التحضير لمشروعك الجديد</li>
                </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.APP_BASE_URL || 'http://localhost:8080'}/dashboard.html" 
                   style="background-color: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                    🏠 اذهب إلى لوحة التحكم
                </a>
            </div>
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-right: 4px solid #f59e0b; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 16px;">
                    <strong>💡 نصيحة:</strong> تأكد من التواصل المستمر مع صاحب العمل وتسليم العمل في الوقت المحدد لبناء سمعة ممتازة على المنصة.
                </p>
            </div>
            <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f0f9ff; border-radius: 8px;">
                <p style="font-size: 18px; color: #0369a1; margin: 0;">
                    <strong>🌟 نحن فخورون بك ونتمنى لك التوفيق في مشروعك الجديد!</strong>
                </p>
            </div>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 16px; margin: 5px 0;">مع أطيب التحيات،</p>
                <p style="color: #6366f1; font-size: 18px; font-weight: bold; margin: 5px 0;">فريق هايرلي 💜</p>
            </div>
          `;
          
          await sendEmail(professional.email, subject, mainContentHtml);
        } catch (_) {}
      }
      res.json({ success: true, message: 'Professional hired successfully!' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: 'Failed to assign professional.' });
    } finally {
      if (client) client.release();
    }
    }
  );

  router.patch(
    '/jobs/:jobId/toggle-status',
    isAuthenticated,
    isEmployer,
    isEmployerVerified,
    [
      param('jobId').isInt({ min: 1 }),
      body('newDeadline').optional({ checkFalsy: true }).isISO8601()
    ],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const jobId = req.params.jobId;
    const employerId = req.session.userId;
    const { newDeadline } = req.body;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const jobResult = await client.query('SELECT employer_id, status FROM jobs WHERE id = $1 FOR UPDATE', [jobId]);
      const job = jobResult.rows[0];
      if (!job || job.employer_id !== employerId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, error: 'Access denied. This job does not belong to you.' });
      }
      let newStatus;
      let message;
      if (job.status === 'open') { newStatus = 'closed'; message = 'Job closed successfully.'; }
      else if (job.status === 'closed' || job.status === 'assigned') { newStatus = 'open'; message = 'Job opened successfully.'; }
      else { await client.query('ROLLBACK'); return res.status(400).json({ success: false, error: 'Invalid current job status for toggling.' }); }
      if (newStatus === 'open' && newDeadline) {
        await client.query('UPDATE jobs SET status = $1, deadline = $2 WHERE id = $3', [newStatus, newDeadline, jobId]);
        message = 'Job reopened successfully with new deadline.';
      } else {
        await client.query('UPDATE jobs SET status = $1 WHERE id = $2', [newStatus, jobId]);
      }
      if (newStatus === 'completed') {
        await client.query('UPDATE contracts SET status = \'completed\' WHERE job_id = $1', [jobId]);
      } else if (newStatus === 'open' || newStatus === 'closed') {
        await client.query('UPDATE contracts SET status = \'active\' WHERE job_id = $1 AND status = \'completed\'', [jobId]);
      }
      await client.query('COMMIT');
      res.json({ success: true, message, newStatus });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: 'Failed to toggle job status.' });
    } finally {
      if (client) client.release();
    }
    }
  );

  router.get(
    '/jobs/:jobId/intelligence-report',
    isAuthenticated,
    (req, res, next) => {
      if (req.session.userType === 'admin') return next();
      return isEmployer(req, res, next);
    },
    async (req, res) => {
      const jobId = req.params.jobId;
      const employerId = req.session.userId;
      const isAdmin = req.session.userType === 'admin';
      let client;

      try {
        client = await pool.connect();

        // 1. Fetch Job Stats
        const jobStatsQuery = `
          SELECT 
            j.title, j.status, j.created_at, j.deadline, j.views_count,
            COUNT(a.id) as total_applications,
            ROUND(AVG(COALESCE(ae.match_score, 0))) as avg_score,
            COUNT(CASE WHEN a.status = 'accepted' OR a.status = 'hired' THEN 1 END) as hired_count
          FROM jobs j
          LEFT JOIN applications a ON j.id = a.job_id
          LEFT JOIN application_ai_evaluations ae ON a.id = ae.application_id
          WHERE j.id = $1 ${isAdmin ? '' : 'AND j.employer_id = $2'}
          GROUP BY j.id
        `;
        const jobStatsResult = await client.query(jobStatsQuery, isAdmin ? [jobId] : [jobId, employerId]);
        
        if (jobStatsResult.rowCount === 0) {
          return res.status(404).send('Job not found or access denied.');
        }

        const stats = jobStatsResult.rows[0];

        // 2. Fetch Top Candidates
        const candidatesQuery = `
          SELECT 
            u.first_name, u.last_name, 
            ae.match_score, ae.verdict, ae.summary as headline
          FROM applications a
          JOIN users u ON a.professional_id = u.id
          LEFT JOIN application_ai_evaluations ae ON a.id = ae.application_id
          WHERE a.job_id = $1
          ORDER BY ae.match_score DESC NULLS LAST
          LIMIT 5
        `;
        const candidatesResult = await client.query(candidatesQuery, [jobId]);

        // 3. Generate HTML Template
        const candidatesHtml = candidatesResult.rows.map(c => `
          <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #f1f5f9;">
            <div style="width: 45px; height: 45px; border-radius: 12px; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; margin-right: 15px; font-size: 14px;">
              ${c.match_score || 0}%
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 700; font-size: 15px; color: #0f172a;">${c.first_name} ${c.last_name}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${c.headline || 'Pending Analysis'}</div>
            </div>
            <div style="padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; 
              ${c.verdict === 'Strong Hire' ? 'background: #dcfce7; color: #166534;' : 
                c.verdict === 'Interview' ? 'background: #dbeafe; color: #1e40af;' : 
                'background: #f1f5f9; color: #475569;'}">
              ${c.verdict || 'Pending'}
            </div>
          </div>
        `).join('');

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;700;900&display=swap');
              body { font-family: 'Inter', sans-serif; color: #1e293b; margin: 0; padding: 50px; line-height: 1.5; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 30px; margin-bottom: 40px; }
              .logo { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 24px; color: #0f172a; letter-spacing: -1px; }
              .report-tag { font-size: 10px; text-transform: uppercase; color: #6366f1; font-weight: 900; letter-spacing: 3px; }
              .job-title { font-size: 32px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -1px; }
              .meta-row { display: flex; gap: 25px; margin-top: 15px; font-size: 12px; color: #64748b; font-weight: 600; }
              .meta-item { display: flex; align-items: center; gap: 6px; }
              .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 40px 0; }
              .stat-card { background: #ffffff; padding: 25px; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
              .stat-value { font-size: 28px; font-weight: 900; color: #0f172a; }
              .stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-top: 4px; letter-spacing: 1px; }
              .section-title { font-size: 16px; font-weight: 900; color: #0f172a; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; }
              .section-title::after { content: ''; flex: 1; height: 1px; background: #f1f5f9; }
              .footer { margin-top: 60px; padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 10px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
              .verified-badge { background: #6366f1; color: white; padding: 2px 8px; border-radius: 4px; font-size: 9px; margin-left: 10px; vertical-align: middle; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="logo">HIRLY</div>
                <div class="report-tag">Intelligence Report</div>
              </div>
              <div style="text-align: right; font-size: 10px; color: #94a3b8;">
                Ref: #JOB-${jobId}<br>
                Generated: ${new Date().toLocaleDateString()}
              </div>
            </div>

            <div style="margin-bottom: 40px;">
              <h1 class="job-title">${stats.title} <span class="verified-badge">VERIFIED</span></h1>
              <div class="meta-row">
                <div class="meta-item">📅 Posted: ${new Date(stats.created_at).toLocaleDateString()}</div>
                <div class="meta-item">⏱️ Status: ${stats.status.toUpperCase()}</div>
                <div class="meta-item">🎯 Deadline: ${new Date(stats.deadline).toLocaleDateString()}</div>
              </div>
            </div>

            <div class="section-title">Engagement Metrics</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${stats.views_count || 0}</div>
                <div class="stat-label">Total Views</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.total_applications}</div>
                <div class="stat-label">Applications</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.avg_score || 0}%</div>
                <div class="stat-label">Avg. Match</div>
              </div>
              <div class="stat-card" style="background: #f8fafc; border-color: #6366f1;">
                <div class="stat-value" style="color: #6366f1;">${stats.hired_count}</div>
                <div class="stat-label">Success Hires</div>
              </div>
            </div>

            <div class="section-title">Top Talent Intelligence</div>
            <div style="background: white; border: 1px solid #f1f5f9; border-radius: 16px; overflow: hidden;">
              ${candidatesHtml || '<div style="padding: 40px; text-align: center; color: #64748b;">No applicants analyzed yet.</div>'}
            </div>

            <div class="footer">
              PROPRIETARY INTELLIGENCE REPORT • PROTECTED BY HIRLY SECURITY SYSTEMS • DOCUMENT ID: ${Math.random().toString(36).substring(7).toUpperCase()}
            </div>
          </body>
          </html>
        `;

        // 4. Convert to PDF using Playwright
        const { chromium } = require('playwright');
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
        });
        await browser.close();

        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Hirly-Intelligence-Report-${jobId}.pdf`);
        res.send(pdfBuffer);

      } catch (error) {
        logger.error('Error generating PDF report:', error);
        res.status(500).send('Failed to generate intelligence report.');
      } finally {
        if (client) client.release();
      }
    }
  );

  app.use('/api', router);

  return { autoCloseExpiredJobs };
};
