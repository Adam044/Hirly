const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../utils/logger');
const AuthService = require('../services/authService');
const { logLiveEvent } = require('../realtime/manager');

module.exports = function registerAuthRoutes(
  app,
  pool,
  {
    authLimiter,
    passwordResetLimiter,
    resendVerificationLimiter,
    emailValidation,
    passwordValidation,
    newPasswordValidation,
    handleValidationErrors,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendPasswordResetConfirmationEmail,
    supabaseAdmin,
    autoCloseExpiredJobs
  }
) {
  const router = express.Router();
  const authService = new AuthService(pool, supabaseAdmin);

  router.post(
    '/signup',
    authLimiter,
    [
      body('firstName')
        .if((value, { req }) => req.body.userType === 'professional' || (req.body.userType === 'employer' && req.body.employerType === 'individual'))
        .trim()
        .isLength({ min: 2, max: 50 })
        .matches(/^[\u0600-\u06FFa-zA-Z0-9\s]+$/)
        .withMessage('First name must be 2-50 characters and contain only letters and numbers'),
      body('lastName')
        .if((value, { req }) => req.body.userType === 'professional' || (req.body.userType === 'employer' && req.body.employerType === 'individual'))
        .trim()
        .isLength({ min: 2, max: 50 })
        .matches(/^[\u0600-\u06FFa-zA-Z0-9\s]+$/)
        .withMessage('Last name must be 2-50 characters and contain only letters and numbers'),
      body('city')
        .if((value, { req }) => req.body.userType === 'professional' || (req.body.userType === 'employer' && req.body.employerType === 'individual'))
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),
      body('companyName')
        .if((value, { req }) => req.body.userType === 'employer' && req.body.employerType === 'company')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Company name must be between 2 and 100 characters'),
      body('companyEmail')
        .if((value, { req }) => req.body.userType === 'employer' && req.body.employerType === 'company')
        .isEmail()
        .withMessage('Please provide a valid company email address'),
      body('companyPhone')
        .if((value, { req }) => req.body.userType === 'employer' && req.body.employerType === 'company')
        .trim()
        .notEmpty()
        .withMessage('Company phone number is required'),
      body('address')
        .if((value, { req }) => req.body.userType === 'employer' && req.body.employerType === 'company')
        .trim()
        .notEmpty()
        .withMessage('Company address is required'),
      body('companyDescription')
        .if((value, { req }) => req.body.userType === 'employer' && req.body.employerType === 'company')
        .trim()
        .notEmpty()
        .withMessage('Company description is required'),
      body('companyCategory')
        .if((value, { req }) => req.body.userType === 'employer' && req.body.employerType === 'company')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Company category is required'),
      body('email')
        .if((value, { req }) => req.body.userType === 'professional' || (req.body.userType === 'employer' && req.body.employerType === 'individual'))
        .isEmail()
        .withMessage('Please provide a valid email address'),
      passwordValidation,
      body('phone')
        .if((value, { req }) => req.body.userType === 'professional' || (req.body.userType === 'employer' && req.body.employerType === 'individual'))
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please provide a valid phone number'),
      body('userType').isIn(['professional', 'employer']).withMessage('User type must be professional or employer'),
      body('employerType').optional().isIn(['individual', 'company']).withMessage('Employer type must be individual or company'),
      body('interests')
        .if((value, { req }) => req.body.userType === 'professional')
        .optional()
        .custom((value) => {
          if (typeof value === 'string') {
            JSON.parse(value);
            return true;
          }
          return Array.isArray(value);
        })
        .withMessage('Interests must be an array'),
      body('currentStatus')
        .if((value, { req }) => req.body.userType === 'professional')
        .notEmpty()
        .withMessage('Current status is required'),
      body('mainCategory')
        .if((value, { req }) => req.body.userType === 'professional' && (req.body.currentStatus === 'Working' || req.body.currentStatus === 'Freelancing'))
        .notEmpty()
        .withMessage('Main category is required for working/freelancing status'),
      body('mainProfession')
        .if((value, { req }) => req.body.userType === 'professional' && (req.body.currentStatus === 'Working' || req.body.currentStatus === 'Freelancing'))
        .notEmpty()
        .withMessage('Main profession is required for working/freelancing status'),
      body('gender').if((value, { req }) => req.body.userType === 'professional').optional().isIn(['male', 'female']).withMessage('Gender must be either "male" or "female"'),
      body('birthdate').if((value, { req }) => req.body.userType === 'professional').optional().isISO8601().withMessage('Birthdate must be a valid date'),
      body('website_link').if((value, { req }) => req.body.userType === 'professional').optional().isURL().withMessage('Website link must be a valid URL'),
      body('degree').if((value, { req }) => req.body.userType === 'professional').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Degree must be between 2 and 100 characters'),
      body('degree_field').if((value, { req }) => req.body.userType === 'professional').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Degree field must be between 2 and 100 characters'),
      body('university').if((value, { req }) => req.body.userType === 'professional').optional().trim().isLength({ min: 2, max: 200 }).withMessage('University must be between 2 and 200 characters')
    ],
    handleValidationErrors,
    async (req, res, next) => {
      try {
        const result = await authService.registerUser(req.body, sendVerificationEmail);
        
        // Log to Live View
        const userName = req.body.userType === 'employer' && req.body.employerType === 'company' 
            ? req.body.companyName 
            : `${req.body.firstName} ${req.body.lastName}`;
        logLiveEvent('signup', `New <b>${req.body.userType}</b> signup: <b>${userName}</b>`);

        res.status(200).json({
          success: true,
          message: 'Please verify your email to complete signup.',
          redirect: `/email_verification_pending.html?email=${encodeURIComponent(result.email)}`
        });
      } catch (error) {
        // Validation/Conflict errors come with proper status codes
        if (error.statusCode) {
          return res.status(error.statusCode).json({ error: error.message });
        }
        // Forward unexpected errors to the global error handler
        next(error);
      }
    }
  );

  router.post(
    '/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: { error: 'Too many failed login attempts. Try again in 15 minutes.', retryAfter: '15 minutes' },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true
    }),
    [emailValidation, body('password').notEmpty().withMessage('Password is required')],
    handleValidationErrors,
    async (req, res, next) => {
      try {
        const { email, password } = req.body;
        const user = await authService.loginUser(email, password, sendVerificationEmail);

        req.session.userId = user.id;
        req.session.userType = user.user_type;
        req.session.authUserId = user.auth_user_id;
        req.session.email = user.db_email;
        req.session.isEmailVerified = user.is_email_verified;

        req.session.save((err) => {
          if (err) {
            logger.error('Session save error:', err);
            return next(new Error('Session save failed.'));
          }

          let redirectUrl = '/';
          if (user.user_type === 'professional') {
            redirectUrl = '/dashboard.html';
          } else if (user.user_type === 'employer') {
            redirectUrl = '/hire_dashboard.html';
          } else if (user.user_type === 'admin') {
            redirectUrl = '/admin_dashboard.html';
          }

          res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
              id: user.id,
              email: user.db_email,
              userType: user.user_type,
              isEmailVerified: user.is_email_verified
            },
            redirect: redirectUrl
          });
        });
      } catch (error) {
        if (error.statusCode) {
          if (error.redirect) {
            return res.status(error.statusCode).json({ success: false, error: error.message, redirect: error.redirect });
          }
          return res.status(error.statusCode).json({ error: error.message });
        }
        next(error);
      }
    }
  );

  router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to log out.' });
      }
      res.clearCookie('connect.sid', { path: '/' });
      res.json({ success: true, redirect: '/login.html' });
    });
  });

  router.get('/user', async (req, res) => {
    // Prevent caching of authentication status
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    let client;
    if (!req.session.userId) {
      return res.status(200).json({ isAuthenticated: false });
    }
    try {
      if (autoCloseExpiredJobs) {
        try {
          await autoCloseExpiredJobs();
        } catch (jobError) {
          logger.error('Error in autoCloseExpiredJobs during user fetch:', jobError);
        }
      }
      client = await pool.connect();
      const userResult = await client.query(
        'SELECT id, first_name, last_name, email, phone, city, user_type, is_email_verified, profile_picture_url, auth_user_id, gender, birthdate, website_link, slug FROM users WHERE id = $1',
        [req.session.userId]
      );
      let user = userResult.rows[0];
      if (!user) {
        return res.status(404).json({ isAuthenticated: false, error: 'User not found' });
      }
      if (req.session.authUserId !== user.auth_user_id) {
        req.session.authUserId = user.auth_user_id;
        await new Promise((resolve) => req.session.save(() => resolve()));
      }
      user.profile = {};
      if (user.user_type === 'professional') {
        const professionalProfileResult = await client.query(
          `SELECT
            skills, bio, profession, current_status, interested_professions,
            cv_path, profile_views_count, rating,
            degree, degree_field, university,
            privacy_visible_to_all, privacy_visible_companies_only, privacy_hide_account, privacy_hide_contact_info
          FROM professionals WHERE user_id = $1`,
          [user.id]
        );
        if (professionalProfileResult.rows.length > 0) {
          user.profile = {
            ...professionalProfileResult.rows[0],
            interested_professions: professionalProfileResult.rows[0].interested_professions || []
          };
          // Force verification status to Verified
          user.profile.verification_status = 'Verified';
          const applicationsCountResult = await client.query('SELECT COUNT(*) AS count FROM applications WHERE professional_id = $1', [user.id]);
          user.profile.applications_count = parseInt(applicationsCountResult.rows[0].count, 10) || 0;
        }
      } else if (user.user_type === 'employer') {
        const employerProfileResult = await client.query(
          `SELECT
            company_name, company_description, address, employer_type,
            company_email, company_phone, company_logo_path, company_category
          FROM employers WHERE user_id = $1`,
          [user.id]
        );
        if (employerProfileResult.rows.length > 0) {
          user.profile = employerProfileResult.rows[0];
          // Force verification status to Verified
          user.profile.verification_status = 'Verified';
        }
        const activeJobsCountResult = await client.query(`
          SELECT COUNT(id) AS count 
          FROM jobs 
          WHERE employer_id = $1 
            AND status = 'open' 
            AND (
              deadline IS NULL 
              OR CASE 
                   WHEN deadline ~ '^\\d{4}-\\d{2}-\\d{2}' THEN deadline::TIMESTAMP > NOW() 
                   ELSE FALSE 
                 END
            )
        `, [user.id]);
        user.profile.active_jobs_count = parseInt(activeJobsCountResult.rows[0].count, 10) || 0;
        const hiredProfessionalsCountResult = await client.query('SELECT COUNT(DISTINCT professional_id) AS count FROM contracts WHERE employer_id = $1', [user.id]);
        user.profile.hired_professionals_count = parseInt(hiredProfessionalsCountResult.rows[0].count, 10) || 0;
      }
      res.json({ isAuthenticated: true, user });
    } catch (err) {
      logger.error('[AUTH] Error in /api/user:', err);
      res.status(500).json({ isAuthenticated: false, error: 'Database error', details: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post(
    '/forgot-password-code',
    passwordResetLimiter,
    [emailValidation],
    handleValidationErrors,
    async (req, res) => {
      let client;
      const { email } = req.body;
      try {
        client = await pool.connect();
        const userResult = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];
        if (!user) {
          return res.json({ success: true, message: 'If an account with that email exists, a password reset code has been sent.' });
        }
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
        await client.query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, token, expiresAt]);
        const emailSent = await sendPasswordResetEmail(email, token);
        if (emailSent.success) {
          res.json({ success: true, message: 'If an account with that email exists, a password reset code has been sent.' });
        } else {
          res.status(500).json({ success: false, error: 'Failed to send password reset code.' });
        }
      } catch (error) {
        if (client) await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: 'An error occurred during password reset code request.' });
      } finally {
        if (client) client.release();
      }
    }
  );

  router.post(
    '/verify-password-reset-code',
    passwordResetLimiter,
    [
      emailValidation,
      body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Code must be a 6-digit number')
    ],
    handleValidationErrors,
    async (req, res) => {
      let client;
      const { email, code } = req.body;
      try {
        client = await pool.connect();
        await client.query('BEGIN');
        const userResult = await client.query('SELECT id FROM users WHERE email = $1 FOR UPDATE', [email]);
        const user = userResult.rows[0];
        if (!user) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, error: 'Invalid email or verification code.' });
        }
        const tokenResult = await client.query('SELECT token, expires_at FROM password_reset_tokens WHERE user_id = $1 AND token = $2 FOR UPDATE', [user.id, code]);
        const resetToken = tokenResult.rows[0];
        if (!resetToken) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, error: 'Invalid verification code.' });
        }
        if (new Date() > new Date(resetToken.expires_at)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new one.' });
        }
        const newPasswordResetToken = crypto.randomBytes(32).toString('hex');
        const newExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND token = $2', [user.id, code]);
        await client.query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, newPasswordResetToken, newExpiry]);
        await client.query('COMMIT');
        res.json({ success: true, message: 'Code verified successfully.', token: newPasswordResetToken });
      } catch (error) {
        if (client) await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: 'An error occurred during verification.' });
      } finally {
        if (client) client.release();
      }
    }
  );

  router.post(
    '/reset-password',
    passwordResetLimiter,
    [body('token').notEmpty().isLength({ min: 10 }).withMessage('Invalid reset token'), newPasswordValidation],
    handleValidationErrors,
    async (req, res) => {
      let client;
      const { token, newPassword } = req.body;
      try {
        client = await pool.connect();
        await client.query('BEGIN');
        const tokenResult = await client.query('SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1 FOR UPDATE', [token]);
        const resetToken = tokenResult.rows[0];
        if (!resetToken || new Date() > new Date(resetToken.expires_at)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, error: 'Invalid or expired token.' });
        }
        const userResult = await client.query('SELECT email, first_name FROM users WHERE id = $1', [resetToken.user_id]);
        const user = userResult.rows[0];
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, resetToken.user_id]);
        await client.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
        await client.query('COMMIT');
        try {
          await sendPasswordResetConfirmationEmail(user.email, user.first_name);
        } catch (_) { }
        res.json({ success: true, message: 'Password reset successfully.', redirect: '/login.html' });
      } catch (error) {
        if (client) await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: 'An error occurred during password reset.' });
      } finally {
        if (client) client.release();
      }
    }
  );

  router.post('/verify-email', async (req, res) => {
    let client;
    const { code, email } = req.body;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const userResult = await client.query('SELECT id, is_email_verified, user_type, auth_user_id, referred_by_code FROM users WHERE email = $1 FOR UPDATE', [email]);
      const user = userResult.rows[0];
      if (!user) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'User not found for this email.' });
      }
      if (user.is_email_verified) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Email is already verified.' });
      }
      const tokenResult = await client.query('SELECT token, expires_at FROM email_verification_tokens WHERE user_id = $1 AND token = $2 FOR UPDATE', [user.id, code]);
      const tokenRecord = tokenResult.rows[0];
      if (!tokenRecord) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Invalid verification code.' });
      }
      if (new Date() > new Date(tokenRecord.expires_at)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new one.' });
      }
      await client.query('UPDATE users SET is_email_verified = TRUE WHERE id = $1', [user.id]);
      await client.query('DELETE FROM email_verification_tokens WHERE user_id = $1 AND token = $2', [user.id, code]);
      await client.query('COMMIT');
      req.session.userId = user.id;
      req.session.userType = user.user_type;
      req.session.authUserId = user.auth_user_id;
      res.json({ success: true, message: 'Email verified successfully!', redirect: '/login.html?message=email_verified_success' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: error.message || 'An error occurred during verification.' });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/resend-verification-email', resendVerificationLimiter, async (req, res) => {
    let client;
    const { email } = req.body;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const userResult = await client.query('SELECT id, is_email_verified FROM users WHERE email = $1 FOR UPDATE', [email]);
      const user = userResult.rows[0];
      if (!user) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'User not found.' });
      }
      if (user.is_email_verified) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Email is already verified.' });
      }
      const newToken = Math.floor(100000 + Math.random() * 900000).toString();
      const newExpiry = new Date(Date.now() + 30 * 60 * 1000);
      await client.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [user.id]);
      await client.query('INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, newToken, newExpiry]);
      await sendVerificationEmail(email, newToken);
      await client.query('COMMIT');
      res.json({ success: true, message: 'New verification code sent to your email.' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: error.message || 'Failed to resend verification email.' });
    } finally {
      if (client) client.release();
    }
  });

  app.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    if (!token) {
      return res.redirect('/email_verification_pending.html');
    }
    let client;
    try {
      client = await pool.connect();
      const tokenResult = await client.query(
        `SELECT u.email 
         FROM email_verification_tokens evt 
         JOIN users u ON evt.user_id = u.id 
         WHERE evt.token = $1 AND evt.expires_at > NOW()`,
        [token]
      );
      if (tokenResult.rows.length > 0) {
        const emailAddr = tokenResult.rows[0].email;
        return res.redirect(`/email_verification_pending.html?email=${encodeURIComponent(emailAddr)}`);
      } else {
        return res.redirect('/email_verification_pending.html');
      }
    } catch (error) {
      return res.redirect('/email_verification_pending.html');
    } finally {
      if (client) client.release();
    }
  });

  app.get('/verify-email-direct', async (req, res) => {
    const { token } = req.query;
    if (!token) {
      return res.redirect('/email_verification_pending.html?error=missing_token');
    }
    let client;
    try {
      client = await pool.connect();
      const tokenResult = await client.query(
        `SELECT u.id, u.email, u.email_verified 
         FROM email_verification_tokens evt 
         JOIN users u ON evt.user_id = u.id 
         WHERE evt.token = $1 AND evt.expires_at > NOW()`,
        [token]
      );
      if (tokenResult.rows.length === 0) {
        return res.redirect('/email_verification_pending.html?error=invalid_token');
      }
      const user = tokenResult.rows[0];
      if (user.email_verified) {
        return res.redirect('/email_verification_success.html?already_verified=true');
      }
      await client.query('UPDATE users SET email_verified = true WHERE id = $1', [user.id]);
      await client.query('DELETE FROM email_verification_tokens WHERE token = $1', [token]);
      return res.redirect('/email_verification_success.html');
    } catch (error) {
      return res.redirect('/email_verification_pending.html?error=server_error');
    } finally {
      if (client) client.release();
    }
  });

  app.use('/api', router);
};
