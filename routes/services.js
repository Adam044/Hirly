const express = require('express');

module.exports = function registerServicesRoutes(app, pool, { getOptimizedImageUrl }) {
  const router = express.Router();

  router.get('/services', async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      const { category } = req.query;
      let query = `
        SELECT s.id, s.service_title, s.service_description, s.price, s.currency, s.delivery_time, s.service_image_path, s.category,
               f.id AS professional_id, u.first_name, u.last_name, u.profile_picture_url, u.city, u.slug
        FROM services s
        JOIN professionals f ON s.professional_id = f.id
        JOIN users u ON f.user_id = u.id
      `;
      const queryParams = [];
      if (category) {
        query += ' WHERE s.category = $1';
        queryParams.push(category);
      }
      query += ' ORDER BY s.created_at DESC';
      const result = await client.query(query, queryParams);
      
      const services = result.rows.map(s => ({
        ...s,
        service_image_path: s.service_image_path ? getOptimizedImageUrl(s.service_image_path) : null,
        profile_picture_url: s.profile_picture_url ? getOptimizedImageUrl(s.profile_picture_url) : null
      }));

      res.json({ success: true, services });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch services.' });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/services/:id', async (req, res) => {
    let client;
    const serviceId = req.params.id;
    try {
      client = await pool.connect();
      const result = await client.query(`
        SELECT s.id, s.service_title, s.service_description, s.price, s.currency, s.delivery_time, s.service_image_path, s.category,
               f.id AS professional_id, u.first_name, u.last_name, u.profile_picture_url
        FROM services s
        JOIN professionals f ON s.professional_id = f.id
        JOIN users u ON f.user_id = u.id
        WHERE s.id = $1
      `, [serviceId]);
      const service = result.rows[0];
      if (!service) { return res.status(404).json({ success: false, error: 'Service not found.' }); }
      
      if (service.service_image_path) service.service_image_path = getOptimizedImageUrl(service.service_image_path);
      if (service.profile_picture_url) service.profile_picture_url = getOptimizedImageUrl(service.profile_picture_url);

      res.json({ success: true, service });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch service.' });
    } finally {
      if (client) client.release();
    }
  });

  app.use('/api', router);
};