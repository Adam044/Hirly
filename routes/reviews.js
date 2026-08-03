const express = require('express');
const { logLiveEvent } = require('../realtime/manager');

module.exports = function registerReviewsRoutes(app, pool, {
  isAuthenticated,
  isAdmin,
  isEmployer,
  isEmailVerified,
  updateProfessionalRating,
  updateEmployerRating
}) {
  const router = express.Router();

  // --- Employer Reviews Endpoints ---

  router.get('/employer-reviews/:employerId', async (req, res) => {
    let client;
    const employerId = req.params.employerId;
    try {
      client = await pool.connect();
      const query = `
        SELECT r.id, r.rating, r.comment, r.created_at,
               u.first_name, u.last_name, u.profile_picture_url
        FROM employer_reviews r
        JOIN users u ON r.reviewer_id = u.id
        WHERE r.employer_id = $1
        ORDER BY r.created_at DESC;
      `;
      const result = await client.query(query, [employerId]);
      res.json({ success: true, reviews: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch reviews.' });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/employer-reviews', isAuthenticated, isEmailVerified, async (req, res) => {
    let client;
    const reviewerId = req.session.userId;
    const { employerId, rating, comment } = req.body;

    if (!employerId || !rating) {
      return res.status(400).json({ success: false, error: 'Employer ID and rating are required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5.' });
    }

    try {
      client = await pool.connect();
      await client.query('BEGIN');

      // Check if employer exists
      const employerCheck = await client.query("SELECT id FROM users WHERE id = $1 AND user_type = 'employer';", [employerId]);
      if (employerCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Invalid employer ID.' });
      }
      
      // Prevent self-review
      if (parseInt(reviewerId) === parseInt(employerId)) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, error: 'You cannot review yourself.' });
      }

      // Check existing review
      const existingReview = await client.query('SELECT id FROM employer_reviews WHERE employer_id = $1 AND reviewer_id = $2', [employerId, reviewerId]);
      if (existingReview.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ success: false, error: 'You have already reviewed this employer.' });
      }

      const insertResult = await client.query(
        'INSERT INTO employer_reviews (employer_id, reviewer_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING id',
        [employerId, reviewerId, rating, comment || null]
      );
      
      // Log to Live View
      logLiveEvent('rating', `New employer rating: <b>${rating} stars</b>`);

      await updateEmployerRating(employerId, client);
      await client.query('COMMIT');
      res.status(201).json({ success: true, message: 'Review submitted successfully!', reviewId: insertResult.rows[0].id });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: 'Failed to submit review.' });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/admin/reviews', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      const query = `
        SELECT r.id AS review_id, r.rating, r.comment, r.created_at,
               j.id AS job_id, j.title AS job_title,
               u_reviewer.id AS reviewer_id, u_reviewer.first_name AS reviewer_first_name, u_reviewer.last_name AS reviewer_last_name,
               u_reviewee.id AS reviewee_id, u_reviewee.first_name AS reviewee_first_name, u_reviewee.last_name AS reviewee_last_name
        FROM reviews r
        JOIN jobs j ON r.job_id = j.id
        JOIN users u_reviewer ON r.reviewer_id = u_reviewer.id
        JOIN users u_reviewee ON r.professional_id = u_reviewee.id
        ORDER BY r.created_at DESC;
      `;
      const { rows: reviews } = await client.query(query);
      res.json({ success: true, reviews });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch reviews.' });
    } finally {
      if (client) client.release();
    }
  });

  router.delete('/admin/reviews/:reviewId', isAuthenticated, isAdmin, async (req, res) => {
    let client;
    const reviewId = req.params.reviewId;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const reviewResult = await client.query('SELECT professional_id FROM reviews WHERE id = $1 FOR UPDATE', [reviewId]);
      const review = reviewResult.rows[0];
      if (!review) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Review not found.' });
      }
      await client.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
      await updateProfessionalRating(review.professional_id, client);
      await client.query('COMMIT');
      res.json({ success: true, message: 'Review deleted successfully.' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: 'Failed to delete review.' });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/employer/reviewable-jobs', isAuthenticated, isEmployer, async (req, res) => {
    let client;
    const employerId = req.session.userId;
    try {
      client = await pool.connect();
      const result = await client.query(`
        SELECT j.id AS job_id, j.title AS job_title
        FROM jobs j
        LEFT JOIN reviews r ON j.id = r.job_id AND r.reviewer_id = $1
        WHERE j.employer_id = $1 AND r.id IS NULL
        ORDER BY j.created_at DESC;
      `, [employerId]);
      res.json({ success: true, reviewableJobs: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch reviewable jobs.' });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/reviews', isAuthenticated, isEmployer, isEmailVerified, async (req, res) => {
    let client;
    const reviewerId = req.session.userId;
    const { jobId, professionalId, rating, comment } = req.body;
    if (!jobId || !professionalId || !rating || !comment) {
      return res.status(400).json({ success: false, error: 'Job ID, User ID, rating, and comment are required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5.' });
    }
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const jobResult = await client.query('SELECT id FROM jobs WHERE id = $1 AND employer_id = $2;', [jobId, reviewerId]);
      const job = jobResult.rows[0];
      if (!job) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, error: 'Job not found or does not belong to you.' });
      }
      const professionalUserCheck = await client.query("SELECT id FROM users WHERE id = $1 AND user_type = 'professional';", [professionalId]);
      if (professionalUserCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Invalid user ID provided.' });
      }
      const existingReviewResult = await client.query('SELECT id FROM reviews WHERE job_id = $1 AND reviewer_id = $2', [jobId, reviewerId]);
      if (existingReviewResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ success: false, error: 'You have already submitted a review for this job.' });
      }
      const insertResult = await client.query(
        'INSERT INTO reviews (job_id, professional_id, reviewer_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [jobId, professionalId, reviewerId, rating, comment || null]
      );

      // Log to Live View
      logLiveEvent('rating', `New professional rating: <b>${rating} stars</b>`);

      await updateProfessionalRating(professionalId, client);
      await client.query('COMMIT');
      res.status(201).json({ success: true, message: 'Review submitted successfully!', reviewId: insertResult.rows[0].id });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: 'Failed to submit review.' });
    } finally {
      if (client) client.release();
    }
  });

  router.delete('/reviews/:reviewId', isAuthenticated, isEmployer, isEmailVerified, async (req, res) => {
    let client;
    const reviewId = req.params.reviewId;
    const employerId = req.session.userId;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const reviewResult = await client.query(`
        SELECT r.reviewer_id, r.professional_id AS reviewee_id
        FROM reviews r
        WHERE r.id = $1 AND r.reviewer_id = $2
        FOR UPDATE;
      `, [reviewId, employerId]);
      const review = reviewResult.rows[0];
      if (!review) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, error: 'Review not found or does not belong to you.' });
      }
      const revieweeId = review.reviewee_id;
      const deleteResult = await client.query('DELETE FROM reviews WHERE id = $1 RETURNING id', [reviewId]);
      if (deleteResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Review not found or already deleted.' });
      }
      await updateProfessionalRating(revieweeId, client);
      await client.query('COMMIT');
      res.json({ success: true, message: 'Review deleted successfully.' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: 'Failed to delete review.' });
    } finally {
      if (client) client.release();
    }
  });

  app.use('/api', router);
};