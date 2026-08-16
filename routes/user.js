const express = require('express');
const { body, param, query } = require('express-validator');
const logger = require('../utils/logger');

module.exports = function registerUserRoutes(app, pool, {
  isAuthenticated,
  isProfessional,
  isEmailVerified,
  uploadServiceImageMiddleware,
  uploadProfileFiles,
  storeFileInSupabase,
  deleteFileFromSupabase,
  getOptimizedImageUrl,
  handleValidationErrors,
  userService,
  educationService
}) {
  const router = express.Router();

  router.patch(
    '/user/services/:id',
    isAuthenticated,
    isProfessional,
    uploadServiceImageMiddleware,
    [
      param('id').isInt({ min: 1 }),
      body('serviceTitle').isString().trim().isLength({ min: 3 }),
      body('serviceDescription').isString().trim().isLength({ min: 10 }),
      body('price').isFloat({ gt: 0 }),
      body('currency').isString().notEmpty(),
      body('deliveryTime').isString().notEmpty(),
      body('category').isString().notEmpty(),
      body('removeServiceImage').optional().isBoolean({ loose: true })
    ],
    handleValidationErrors,
    async (req, res) => {
    logger.info('Profile update request received', { 
        userId: req.session.userId, 
        body: req.body,
        files: req.files ? Object.keys(req.files) : []
    });
    let client;
    const userId = req.session.userId;
    const serviceId = req.params.id;
    const { serviceTitle, serviceDescription, price, currency, deliveryTime, category, removeServiceImage } = req.body;
    const serviceImageFile = req.file;
    
    if (!serviceTitle || !serviceDescription || !price || !currency || !deliveryTime || !category) {
        return res.status(400).json({ success: false, error: 'All service fields including category are required.' });
    }

    try {
        client = await pool.connect();
        await client.query('BEGIN');
        
        let serviceImagePath = null;
        
        // Handle image removal or replacement
        if (removeServiceImage === 'true' || removeServiceImage === true || serviceImageFile) {
            const oldServiceResult = await client.query('SELECT service_image_path FROM services WHERE id = $1 AND professional_id = (SELECT id FROM professionals WHERE user_id = $2)', [serviceId, userId]);
            const oldServiceImagePath = oldServiceResult.rows[0]?.service_image_path;
            
            if (oldServiceImagePath) {
                await deleteFileFromSupabase(oldServiceImagePath);
            }
            
            if (serviceImageFile) {
                serviceImagePath = await storeFileInSupabase(userId, 'service_image', serviceImageFile);
            }
        }

        const updateFields = [
            'service_title = $1',
            'service_description = $2',
            'price = $3',
            'currency = $4',
            'delivery_time = $5',
            'category = $6',
            'created_at = CURRENT_TIMESTAMP'
        ];
        const updateValues = [serviceTitle, serviceDescription, price, currency, deliveryTime, category];
        let paramIndex = 7;

        if (serviceImageFile) {
            updateFields.push(`service_image_path = $${paramIndex++}`);
            updateValues.push(serviceImagePath);
        } else if (removeServiceImage === 'true' || removeServiceImage === true) {
            updateFields.push(`service_image_path = NULL`);
        }

        updateValues.push(serviceId, userId);
        const updateQuery = `
            UPDATE services SET 
                ${updateFields.join(', ')}
            WHERE id = $${paramIndex++} 
            AND professional_id = (SELECT id FROM professionals WHERE user_id = $${paramIndex++}) 
            RETURNING id`;

        const result = await client.query(updateQuery, updateValues);
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Service not found or does not belong to you.' });
        }
        await client.query('COMMIT');
        res.json({ success: true, message: 'Service updated successfully.' });
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Error updating service:', error);
        res.status(500).json({ success: false, error: 'Failed to update service.' });
    } finally {
        if (client) client.release();
    }
    }
  );

  const calculateCompleteness = (u) => {
    let score = 0;
    
    // 1. Personal Info (20% total)
    if (u.first_name) score += 3;
    if (u.last_name) score += 3;
    if (u.phone) score += 4;
    if (u.city) score += 3;
    if (u.country) score += 3;
    if (u.birthdate) score += 4;

    // 2. Profile Picture (10%)
    if (u.profile_picture_url) score += 10;

    // 3. Bio (10%) - Minimum 20 characters for professional quality
    if (u.bio && String(u.bio).trim().length >= 20) score += 10;

    // 4. Skills (15%)
    const skills = u.skills;
    if (skills && (Array.isArray(skills) ? skills.length > 0 : String(skills).trim().length > 0)) {
        score += 15;
    }

    // 5. Interested Professions (10%)
    let interests = u.interested_professions;
    if (typeof interests === 'string') {
        try { interests = JSON.parse(interests); } catch(e) { interests = []; }
    }
    if (Array.isArray(interests) && interests.length > 0) {
      score += 10;
    }

    // 6. CV / Resume (15%)
    if (u.cv_path && u.cv_path !== '/api/files/censored') score += 15;

    // 7. Status & Work/Education Details (20%)
    if (u.current_status) score += 5; // Base for having a status
    
    // Education History
    let history = u.education_history || [];
    if (typeof history === 'string') {
        try { history = JSON.parse(history); } catch(e) { history = []; }
    }
    if (Array.isArray(history) && history.length > 0) {
        score += 10;
    }

    // Website / Presence
    const bioLength = String(u.bio || '').trim().length;
    if (u.website_link || u.websiteLink || (bioLength >= 50)) {
        score += 5;
    }

    return Math.min(100, score);
  };

  router.post(
    '/user/profile',
    isAuthenticated,
    isProfessional,
    isEmailVerified,
    uploadProfileFiles,
    [
      body('firstName').optional().isString(),
      body('lastName').optional().isString(),
      body('phone').optional().isString(),
      body('city').optional().isString(),
      body('country').optional().isString(),
      body('skills').optional().isString(),
      body('bio').optional().isString(),
      body('current_status').optional().isString(),
      body('interested_professions').optional().custom((value) => {
        if (!value) return true;
        let interests = value;
        if (typeof value === 'string') {
            try { interests = JSON.parse(value); } catch(e) { return false; }
        }
        if (!Array.isArray(interests)) return false;
        if (interests.length > 5) {
            throw new Error('Maximum 5 interested professions allowed.');
        }
        return true;
      }),
      body('gender').optional({ checkFalsy: true }).isString(),
      body('birthdate').optional({ checkFalsy: true }).isISO8601(),
      body('website_link').optional({ checkFalsy: true }).isString().trim(),
      body('privacy_visibility').optional().isIn(['ALL', 'companies', 'none']),
      body('privacy_hide_contact_info').optional().isBoolean({ loose: true }),
      body('removeProfilePic').optional().isBoolean({ loose: true }),
      body('removeCv').optional().isBoolean({ loose: true })
    ],
    handleValidationErrors,
    async (req, res) => {
    logger.info('Profile update request received', { 
        userId: req.session.userId, 
        body: req.body,
        files: req.files ? Object.keys(req.files) : []
    });
    let client;
    const userId = req.session.userId;
    const profilePicFile = req.files && req.files['profilePic'] ? req.files['profilePic'][0] : null;
    const cvFile = req.files && req.files['cv'] ? req.files['cv'][0] : null;
    const { removeProfilePic, removeCv } = req.body;

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // 1. Update Personal Info (Users table)
        await userService.updatePersonalInfo(client, userId, req.body);

        // 2. Update Professional Info (Professionals table)
        await userService.updateProfessionalData(client, userId, req.body);

        // 3. Update Privacy Settings
        await userService.updatePrivacySettings(client, userId, req.body);

        // 4. Handle Profile Picture
        if (removeProfilePic === 'true' || removeProfilePic === true) {
            const oldPicResult = await client.query('SELECT profile_picture_url FROM users WHERE id = $1', [userId]);
            const oldPicPath = oldPicResult.rows[0]?.profile_picture_url;
            if (oldPicPath) await deleteFileFromSupabase(oldPicPath);
            await client.query('UPDATE users SET profile_picture_url = NULL WHERE id = $1', [userId]);
        } else if (profilePicFile) {
            const oldPicResult = await client.query('SELECT profile_picture_url FROM users WHERE id = $1', [userId]);
            const oldPicPath = oldPicResult.rows[0]?.profile_picture_url;
            if (oldPicPath) await deleteFileFromSupabase(oldPicPath);
            const profilePicPath = await storeFileInSupabase(userId, 'profile_picture', profilePicFile);
            await client.query('UPDATE users SET profile_picture_url = $1 WHERE id = $2', [profilePicPath, userId]);
        }

        // 5. Handle CV
        if (removeCv === 'true' || removeCv === true) {
            const oldCvResult = await client.query('SELECT cv_path FROM professionals WHERE user_id = $1', [userId]);
            const oldCvPath = oldCvResult.rows[0]?.cv_path;
            if (oldCvPath) await deleteFileFromSupabase(oldCvPath);
            await client.query('UPDATE professionals SET cv_path = NULL WHERE user_id = $1', [userId]);
        } else if (cvFile) {
            const oldCvResult = await client.query('SELECT cv_path FROM professionals WHERE user_id = $1', [userId]);
            const oldCvPath = oldCvResult.rows[0]?.cv_path;
            if (oldCvPath) await deleteFileFromSupabase(oldCvPath);
            const cvFilePath = await storeFileInSupabase(userId, 'cv', cvFile);
            await client.query('UPDATE professionals SET cv_path = $1 WHERE user_id = $2', [cvFilePath, userId]);
        }

        await client.query('COMMIT');
        
        // Fetch full updated profile data to return to frontend
        const updatedUserResult = await client.query(
          `SELECT 
            u.id, u.first_name, u.last_name, u.email, u.phone, u.city, u.country, u.profile_picture_url, u.gender, u.birthdate, u.slug, u.user_type,
            f.skills, f.bio, f.profession, f.current_status, f.interested_professions, f.website_link,
            f.cv_path, f.profile_views_count as profile_views, f.employer_views_count, f.rating,
            f.privacy_visibility, f.privacy_hide_contact_info,
            f.verification_status,
            ep.notifications_enabled
          FROM users u
          LEFT JOIN professionals f ON u.id = f.user_id
          LEFT JOIN email_preferences ep ON u.id = ep.user_id
          WHERE u.id = $1`,
          [userId]
        );

        const user = updatedUserResult.rows[0];
        if (user) {
          if (user.profile_picture_url) user.profile_picture_url = getOptimizedImageUrl(user.profile_picture_url);
          if (user.cv_path) user.cv_path = getOptimizedImageUrl(user.cv_path);
          
          // Fetch education from the new table and merge it
          try {
              const educationEntries = await educationService.getUserEducation(userId);
              user.education_history = educationEntries.map(e => ({
                  id: e.id,
                  type: e.type.charAt(0).toUpperCase() + e.type.slice(1),
                  organization: e.institution_name,
                  orgId: e.institution_id,
                  title: e.title,
                  field: e.field_of_study,
                  date: e.end_date,
                  link: e.credential_url,
                  is_current: e.is_current
              }));
          } catch (e) {
              logger.error('Error fetching education for completeness check:', e);
              user.education_history = [];
          }

          user.profile_completeness = calculateCompleteness(user);
        }

        res.json({ 
          success: true, 
          message: 'User profile updated successfully.', 
          data: user 
        });
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, error: 'Server error while updating profile.' });
    } finally {
        if (client) client.release();
    }
    }
  );

  router.get(
    '/user/profile',
    isAuthenticated,
    isProfessional,
    async (req, res) => {
      let client;
      const userId = req.session.userId;
      try {
        client = await pool.connect();
        const result = await client.query(
          `SELECT 
            u.id, u.first_name, u.last_name, u.email, u.phone, u.city, u.country, u.profile_picture_url, u.gender, u.birthdate, u.slug, u.user_type,
            f.skills, f.bio, f.profession, f.current_status, f.interested_professions, f.website_link,
            f.cv_path, f.profile_views_count as profile_views, f.employer_views_count, f.rating,
            f.privacy_visibility, f.privacy_hide_contact_info,
            f.verification_status,
            ep.notifications_enabled
          FROM users u
          LEFT JOIN professionals f ON u.id = f.user_id
          LEFT JOIN email_preferences ep ON u.id = ep.user_id
          WHERE u.id = $1`,
          [userId]
        );

        const user = result.rows[0];
        if (!user) {
          return res.status(404).json({ success: false, error: 'Professional profile not found.' });
        }

        // Transform paths to full URLs
        if (user.profile_picture_url) user.profile_picture_url = getOptimizedImageUrl(user.profile_picture_url);
        if (user.cv_path) user.cv_path = getOptimizedImageUrl(user.cv_path);

        // Fetch education from the new table and merge it
        try {
            const educationEntries = await educationService.getUserEducation(userId);
            // Map new table fields to frontend expected fields
            user.education_history = educationEntries.map(e => ({
                id: e.id,
                type: e.type.charAt(0).toUpperCase() + e.type.slice(1), // Capitalize
                organization: e.institution_name,
                orgId: e.institution_id,
                title: e.title,
                field: e.field_of_study,
                date: e.end_date,
                link: e.credential_url,
                is_current: e.is_current,
                grade_score: e.grade_score,
                description: e.description,
                start_date: e.start_date
            }));
        } catch (eduError) {
            logger.error('Error fetching new education data:', eduError);
            user.education_history = [];
        }

        // Calculate profile completeness using weighted function (AFTER fetching education)
        user.profile_completeness = calculateCompleteness(user);

        res.json({ success: true, data: user });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch profile data.' });
      } finally {
        if (client) client.release();
      }
    }
  );

  router.get(
    '/user/services/:id',
    isAuthenticated,
    isProfessional,
    [param('id').isInt({ min: 1 })],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const userId = req.session.userId;
    const serviceId = req.params.id;
    try {
      client = await pool.connect();
      const professionalResult = await client.query('SELECT id FROM professionals WHERE user_id = $1', [userId]);
      const professionalId = professionalResult.rows[0]?.id;
      if (!professionalId) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }
      const result = await client.query(
        `SELECT s.id, s.service_title, s.service_description, s.price, s.currency, s.delivery_time, s.service_image_path FROM services s WHERE s.id = $1 AND s.professional_id = $2`,
        [serviceId, professionalId]
      );
      const service = result.rows[0];
      if (!service) {
        return res.status(404).json({ success: false, error: 'Service not found.' });
      }
      res.json({ success: true, service });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch service.' });
    } finally {
      if (client) client.release();
    }
    }
  );

  router.get('/user/services', isAuthenticated, isProfessional, async (req, res) => {
    let client;
    const professionalUserId = req.session.userId;
    try {
      client = await pool.connect();
      const result = await client.query(`
        SELECT s.id, s.service_title, s.service_description, s.price, s.currency, s.delivery_time, s.service_image_path, s.category
        FROM services s
        JOIN professionals f ON s.professional_id = f.id
        WHERE f.user_id = $1
        ORDER BY s.created_at DESC;
      `, [professionalUserId]);
      
      const services = result.rows.map(s => ({
        ...s,
        service_image_path: s.service_image_path ? getOptimizedImageUrl(s.service_image_path) : null
      }));

      res.json({ success: true, services });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch services.' });
    } finally {
      if (client) client.release();
    }
  });

router.post(
    '/user/services',
    isAuthenticated,
    isProfessional,
    isEmailVerified,
    uploadServiceImageMiddleware,
    [
      body('serviceTitle').isString().trim().isLength({ min: 3 }),
      body('serviceDescription').isString().trim().isLength({ min: 10 }),
      body('price').isFloat({ gt: 0 }),
      body('currency').isString().notEmpty(),
      body('deliveryTime').isString().notEmpty(),
      body('category').isString().notEmpty()
    ],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const userId = req.session.userId;
    const { serviceTitle, serviceDescription, price, currency, deliveryTime, category } = req.body;
    const serviceImageFile = req.file;
    let serviceImagePath = null;
    if (!serviceTitle || !serviceDescription || !price || !currency || !deliveryTime || !category) {
      return res.status(400).json({ success: false, error: 'All service fields including category are required.' });
    }
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const professionalResult = await client.query('SELECT id FROM professionals WHERE user_id = $1', [userId]);
      const professionalId = professionalResult.rows[0]?.id;
      if (!professionalId) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Professional profile not found.' });
      }
      if (serviceImageFile) {
        serviceImagePath = await storeFileInSupabase(userId, 'service_image', serviceImageFile);
      }
      const result = await client.query(
        `INSERT INTO services (professional_id, service_title, service_description, price, currency, delivery_time, service_image_path, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [professionalId, serviceTitle, serviceDescription, price, currency, deliveryTime, serviceImagePath, category]
      );
      await client.query('COMMIT');
      res.json({ success: true, message: 'Service added successfully.', serviceId: result.rows[0].id });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: 'Failed to add service.' });
    } finally {
      if (client) client.release();
    }
    }
  );

  router.delete(
    '/user/services/:id',
    isAuthenticated,
    isProfessional,
    [param('id').isInt({ min: 1 })],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const userId = req.session.userId;
    const serviceId = req.params.id;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const professionalResult = await client.query('SELECT id FROM professionals WHERE user_id = $1', [userId]);
      const professionalId = professionalResult.rows[0]?.id;
      if (!professionalId) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Professional profile not found.' });
      }
      const serviceResult = await client.query('SELECT service_image_path FROM services WHERE id = $1 AND professional_id = $2 FOR UPDATE', [serviceId, professionalId]);
      const service = serviceResult.rows[0];
      if (!service) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Service not found or does not belong to you.' });
      }
      if (service.service_image_path) {
        await deleteFileFromSupabase(service.service_image_path);
      }
      const deleteResult = await client.query('DELETE FROM services WHERE id = $1 AND professional_id = $2', [serviceId, professionalId]);
      if (deleteResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Service not found or already deleted.' });
      }
      await client.query('COMMIT');
      res.json({ success: true, message: 'Service deleted successfully.' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: 'Failed to delete service.' });
    } finally {
      if (client) client.release();
    }
    }
  );

  router.get(
    '/users/:professionalId/services',
    [param('professionalId').isInt({ min: 1 })],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const { professionalId } = req.params;
    try {
      client = await pool.connect();
      const result = await client.query(`
        SELECT s.id, s.service_title, s.service_description, s.price, s.currency, s.delivery_time, s.service_image_path,
               u.id AS professional_id, u.first_name, u.last_name, u.profile_picture_url
        FROM services s
        JOIN professionals f ON s.professional_id = f.id
        JOIN users u ON f.user_id = u.id
        WHERE u.id = $1
        ORDER BY s.created_at DESC;
      `, [professionalId]);
      const servicesWithProfessional = result.rows.map(row => {
        const { professional_id, first_name, last_name, profile_picture_url, ...serviceData } = row;
        return {
          ...serviceData,
          professional: { id: professional_id, first_name, last_name, profile_picture_url }
        };
      });
      res.json({ success: true, services: servicesWithProfessional });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch services.' });
    } finally {
      if (client) client.release();
    }
    }
  );

  // Fetch user profile by slug
  router.get(
    '/users/by-slug/:slug',
    async (req, res) => {
      let client;
      try {
        client = await pool.connect();
        const { slug } = req.params;
        const viewerUserId = req.session ? req.session.userId : null;
        const viewerUserType = req.session ? req.session.userType : null;

        // Determine if viewer is a company
        let viewerIsCompany = false;
        if (viewerUserType === 'employer' && viewerUserId) {
          try {
            const empRes = await client.query('SELECT employer_type FROM employers WHERE user_id = $1', [viewerUserId]);
            viewerIsCompany = empRes.rows[0]?.employer_type === 'company';
          } catch (e) {
          }
        }

        const professionalUserResult = await client.query(`
          SELECT u.id, u.first_name, u.last_name, 
                 CASE WHEN f.privacy_hide_contact_info THEN NULL ELSE u.email END AS email,
                 u.city AS location, u.country,
                 CASE WHEN f.privacy_hide_contact_info THEN NULL ELSE u.phone END AS phone,
                 u.created_at, u.profile_picture_url, u.slug,
                 f.skills, f.bio, f.profession, f.current_status, f.interested_professions, f.verification_status, f.profile_views_count,
                 f.cv_path, f.id AS professional_db_id, f.rating,
                 f.privacy_visibility, f.privacy_hide_contact_info
          FROM users u LEFT JOIN professionals f ON u.id = f.user_id
          WHERE u.slug = $1 AND u.user_type = 'professional'
        `, [slug]);

        const professional = professionalUserResult.rows[0];
        if (!professional) {
          return res.status(404).json({ success: false, error: 'Professional not found' });
        }

        // Fetch education from the new table
        try {
            const educationEntries = await educationService.getUserEducation(professional.id);
            professional.education_history = educationEntries.map(e => ({
                id: e.id,
                type: e.type.charAt(0).toUpperCase() + e.type.slice(1),
                organization: e.institution_name,
                orgId: e.institution_id,
                title: e.title,
                field: e.field_of_study,
                date: e.end_date,
                link: e.credential_url,
                is_current: e.is_current,
                grade_score: e.grade_score,
                description: e.description,
                start_date: e.start_date
            }));
        } catch (eduError) {
            logger.error('Error fetching education for public profile:', eduError);
            professional.education_history = [];
        }

        // Check Privacy Visibility
        const isOwner = viewerUserId && viewerUserId === professional.id;
        if (!isOwner) {
          if (professional.privacy_visibility === 'none') {
            return res.status(403).json({ success: false, error: 'This profile is private' });
          }
          if (professional.privacy_visibility === 'companies' && !viewerIsCompany) {
            return res.status(403).json({ success: false, error: 'This profile is only visible to companies' });
          }
        }

        if (!professional.interested_professions) { professional.interested_professions = []; }
        const processedProfessional = { ...professional, skills: professional.skills ? professional.skills.split(',').map(s => s.trim()) : [] };

        // Increment total profile views for any visit
        const professionalDbId = professional.professional_db_id;
        if (professionalDbId) {
             await client.query('UPDATE professionals SET profile_views_count = COALESCE(profile_views_count, 0) + 1 WHERE id = $1', [professionalDbId]);
        }

        // Log view if viewer is an employer and not the professional themselves
        if (viewerUserType === 'employer' && viewerUserId !== professional.id) {
          await client.query('BEGIN');
          const employerResult = await client.query('SELECT id FROM employers WHERE user_id = $1', [viewerUserId]);
          const employerDbId = employerResult.rows[0]?.id;
          
          if (employerDbId && professionalDbId) {
            const insertViewResult = await client.query(`
              INSERT INTO profile_views (viewer_id, professional_id, viewed_at)
              VALUES ($1, $2, CURRENT_TIMESTAMP)
              ON CONFLICT (viewer_id, professional_id) DO NOTHING RETURNING id
            `, [employerDbId, professionalDbId]);
            
            if (insertViewResult.rowCount > 0) {
              await client.query('UPDATE professionals SET employer_views_count = COALESCE(employer_views_count, 0) + 1 WHERE id = $1', [professionalDbId]);
            }
          }
          await client.query('COMMIT');
        }

        // Redact contact info if not employer/admin/owner
        const isEmployer = viewerUserType === 'employer';
        const isAdmin = viewerUserType === 'admin';
        if (!isOwner && !isEmployer && !isAdmin) {
             processedProfessional.email = null;
             processedProfessional.phone = null;
        }

        res.json({ success: true, professional: processedProfessional });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch professional profile' });
      } finally {
        if (client) client.release();
      }
    }
  );

  router.get(
    '/users/:id',
    async (req, res) => {
      let client;
      try {
        client = await pool.connect();
        const professionalId = parseInt(req.params.id);
        const viewerUserId = req.session ? req.session.userId : null;
        const viewerUserType = req.session ? req.session.userType : null;
        if (isNaN(professionalId) || professionalId <= 0) {
          return res.status(400).json({ success: false, error: 'Invalid Professional ID' });
        }

        // Determine if viewer is a company
        let viewerIsCompany = false;
        if (viewerUserType === 'employer' && viewerUserId) {
          try {
            const empRes = await client.query('SELECT employer_type FROM employers WHERE user_id = $1', [viewerUserId]);
            viewerIsCompany = empRes.rows[0]?.employer_type === 'company';
          } catch (e) {
          }
        }

        const professionalUserResult = await client.query(`
          SELECT u.id, u.first_name, u.last_name, 
                 CASE WHEN f.privacy_hide_contact_info THEN NULL ELSE u.email END AS email,
                 u.city AS location, u.country,
                 CASE WHEN f.privacy_hide_contact_info THEN NULL ELSE u.phone END AS phone,
                 u.created_at, u.profile_picture_url, u.slug,
                 f.skills, f.bio, f.profession, f.current_status, f.interested_professions, f.verification_status, f.profile_views_count,
                 f.cv_path, f.id AS professional_db_id, f.rating,
                 f.privacy_visibility, f.privacy_hide_contact_info
          FROM users u JOIN professionals f ON u.id = f.user_id
          WHERE u.id = $1 AND u.user_type = 'professional'
        `, [professionalId]);
        const professional = professionalUserResult.rows[0];
        if (!professional) {
          return res.status(404).json({ success: false, error: 'Professional not found' });
        }

        // Fetch education from the new table
        try {
            const educationEntries = await educationService.getUserEducation(professional.id);
            professional.education_history = educationEntries.map(e => ({
                id: e.id,
                type: e.type.charAt(0).toUpperCase() + e.type.slice(1),
                organization: e.institution_name,
                orgId: e.institution_id,
                title: e.title,
                field: e.field_of_study,
                date: e.end_date,
                link: e.credential_url,
                is_current: e.is_current,
                grade_score: e.grade_score,
                description: e.description,
                start_date: e.start_date
            }));
        } catch (eduError) {
            logger.error('Error fetching education for profile by id:', eduError);
            professional.education_history = [];
        }

        // Check Privacy Visibility
        const isOwner = viewerUserId && viewerUserId === professional.id;
        if (!isOwner) {
          if (professional.privacy_visibility === 'none') {
            return res.status(403).json({ success: false, error: 'This profile is private' });
          }
          if (professional.privacy_visibility === 'companies' && !viewerIsCompany) {
            return res.status(403).json({ success: false, error: 'This profile is only visible to companies' });
          }
        }

        if (!professional.interested_professions) { professional.interested_professions = []; }
        const processedProfessional = { ...professional, skills: professional.skills ? professional.skills.split(',').map(s => s.trim()) : [] };

        const professionalDbId = professional.professional_db_id;
        if (professionalDbId) {
             await client.query('UPDATE professionals SET profile_views_count = COALESCE(profile_views_count, 0) + 1 WHERE id = $1', [professionalDbId]);
        }

        if (viewerUserType === 'employer' && viewerUserId !== professionalId) {
          await client.query('BEGIN');
          const employerResult = await client.query('SELECT id FROM employers WHERE user_id = $1', [viewerUserId]);
          const employerDbId = employerResult.rows[0]?.id;
          
          if (employerDbId && professionalDbId) {
            const insertViewResult = await client.query(`
              INSERT INTO profile_views (viewer_id, professional_id, viewed_at)
              VALUES ($1, $2, CURRENT_TIMESTAMP)
              ON CONFLICT (viewer_id, professional_id) DO NOTHING RETURNING id
            `, [employerDbId, professionalDbId]);
            if (insertViewResult.rowCount > 0) {
              await client.query('UPDATE professionals SET employer_views_count = COALESCE(employer_views_count, 0) + 1 WHERE id = $1', [professionalDbId]);
            }
          }
          await client.query('COMMIT');
        }

        // Redact contact info if not employer/admin/owner
        const isEmployer = viewerUserType === 'employer';
        const isAdmin = viewerUserType === 'admin';
        if (!isOwner && !isEmployer && !isAdmin) {
             processedProfessional.email = null;
             processedProfessional.phone = null;
        }

        res.json({ success: true, professional: processedProfessional });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch professional profile' });
      } finally {
        if (client) client.release();
      }
    }
  );

  router.get('/user/profile-viewers', isAuthenticated, isProfessional, async (req, res) => {
    let client;
    const professionalUserId = req.session.userId;
    try {
      client = await pool.connect();
      const professionalProfileResult = await client.query('SELECT id FROM professionals WHERE user_id = $1', [professionalUserId]);
      const professionalProfile = professionalProfileResult.rows[0];
      if (!professionalProfile) {
        return res.status(404).json({ success: false, error: 'Professional profile not found.' });
      }
      const professionalDbId = professionalProfile.id;
      const viewersResult = await client.query(`
        SELECT pv.viewed_at, u.first_name, u.last_name, e.company_name, e.company_logo_path, u.id AS employer_user_id
        FROM profile_views pv
        JOIN employers e ON pv.viewer_id = e.id
        JOIN users u ON e.user_id = u.id
        WHERE pv.professional_id = $1
        ORDER BY pv.viewed_at DESC;
      `, [professionalDbId]);
      res.json({ success: true, viewers: viewersResult.rows });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch profile viewers.' });
    } finally {
      if (client) client.release();
    }
  });

  // --- New Education Management Routes ---
  
  router.get('/user/education', isAuthenticated, isProfessional, async (req, res) => {
    try {
      const userId = req.session.userId;
      const entries = await educationService.getUserEducation(userId);
      res.json({ success: true, data: entries });
    } catch (error) {
      logger.error('Error fetching education:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch education data.' });
    }
  });

  router.post('/user/education', isAuthenticated, isProfessional, async (req, res) => {
    try {
      const userId = req.session.userId;
      const entry = await educationService.addEducation(userId, req.body);
      res.json({ success: true, data: entry });
    } catch (error) {
      logger.error('Error adding education:', error);
      res.status(500).json({ success: false, error: 'Failed to add education entry.' });
    }
  });

  router.put('/user/education/:id', isAuthenticated, isProfessional, async (req, res) => {
    try {
      const userId = req.session.userId;
      const entry = await educationService.updateEducation(userId, req.params.id, req.body);
      if (!entry) return res.status(404).json({ success: false, error: 'Education entry not found.' });
      res.json({ success: true, data: entry });
    } catch (error) {
      logger.error('Error updating education:', error);
      res.status(500).json({ success: false, error: 'Failed to update education entry.' });
    }
  });

  router.delete('/user/education/:id', isAuthenticated, isProfessional, async (req, res) => {
    try {
      const userId = req.session.userId;
      const deleted = await educationService.deleteEducation(userId, req.params.id);
      if (!deleted) return res.status(404).json({ success: false, error: 'Education entry not found.' });
      res.json({ success: true, message: 'Education entry deleted.' });
    } catch (error) {
      logger.error('Error deleting education:', error);
      res.status(500).json({ success: false, error: 'Failed to delete education entry.' });
    }
  });

  router.get(
    '/users/:professionalId/reviews',
    [param('professionalId').isInt({ min: 1 })],
    handleValidationErrors,
    async (req, res) => {
    let client;
    const professionalId = req.params.professionalId;
    try {
      client = await pool.connect();
      const reviewsResult = await client.query(`
        SELECT r.id AS review_id, r.rating, r.comment, r.created_at, r.reviewer_id,
               u_reviewer.first_name AS reviewer_first_name, u_reviewer.last_name AS reviewer_last_name,
               j.title AS job_title, j.id AS job_id, e.company_name AS reviewer_company_name,
               e.company_logo_path AS reviewer_company_logo_path, u_reviewer.user_type AS reviewer_user_type
        FROM reviews r
        JOIN jobs j ON r.job_id = j.id
        JOIN users u_reviewer ON r.reviewer_id = u_reviewer.id
        LEFT JOIN employers e ON u_reviewer.id = e.user_id
        WHERE r.professional_id = $1
        ORDER BY r.created_at DESC;
      `, [professionalId]);
      res.json({ success: true, reviews: reviewsResult.rows });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch professional reviews.' });
    } finally {
      if (client) client.release();
    }
    }
  );

  app.use('/api', router);
};
