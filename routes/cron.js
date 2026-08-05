const express = require('express');
const logger = require('../utils/logger');

module.exports = function registerCronRoutes(app, pool, { jobAggregator }) {
    const router = express.Router();

    /**
     * Trigger job aggregation externally (e.g., from GCP Cloud Scheduler)
     * URL: /api/cron/trigger-scrape?secret=YOUR_CRON_SECRET
     */
    router.get('/trigger-scrape', async (req, res) => {
        const secret = req.query.secret;
        const expectedSecret = process.env.CRON_SECRET;

        if (!expectedSecret || secret !== expectedSecret) {
            logger.warn('Unauthorized cron trigger attempt', { ip: req.ip });
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        if (jobAggregator.isWorking) {
            return res.status(409).json({ success: false, message: 'Scraper is already running' });
        }

        logger.info('External cron trigger: Starting job aggregation...');
        
        // Start the process asynchronously so the request doesn't timeout
        // Cloud Scheduler just needs a 200 OK to know the task was triggered
        jobAggregator.runAggregation({ isAuto: true })
            .then(result => {
                logger.info('External cron job completed', result);
                // Also run pruning after scrape
                return jobAggregator.pruneOldJobs();
            })
            .catch(error => {
                logger.error('External cron job failed', { error: error.message });
            });

        res.json({ 
            success: true, 
            message: 'Job aggregation triggered successfully',
            timestamp: new Date().toISOString()
        });
    });

    app.use('/api/cron', router);
};
