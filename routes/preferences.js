const express = require('express');

module.exports = function registerPreferencesRoutes(app, pool, { isAuthenticated }) {
  const router = express.Router();

  router.post('/email-preferences', isAuthenticated, async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      const { notifications_enabled, notification_frequency } = req.body;
      await client.query(
        `INSERT INTO email_preferences (user_id, notifications_enabled, notification_frequency, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id)
         DO UPDATE SET
           notifications_enabled = $2,
           notification_frequency = $3,
           updated_at = CURRENT_TIMESTAMP`,
        [req.session.userId, notifications_enabled, notification_frequency]
      );
      res.json({ success: true, message: 'Email preferences updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/email-preferences', isAuthenticated, async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        `SELECT notifications_enabled, notification_frequency
         FROM email_preferences
         WHERE user_id = $1`,
        [req.session.userId]
      );
      if (result.rows.length === 0) {
        return res.json({ notifications_enabled: true, notification_frequency: 'daily' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      if (client) client.release();
    }
  });

  app.use('/api', router);
};