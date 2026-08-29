const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

/**
 * Remote Job Collector
 * Fetches high-quality remote jobs from global and regional sources.
 * Sources: We Work Remotely (WWR), Remote OK, etc.
 */
class RemoteCollector {
    constructor(addLog, dbPool) {
        this.addLog = addLog;
        this.dbPool = dbPool;
        this.shouldStop = false;
        this.onJobsFound = null; // Callback for immediate processing
    }

    /**
     * Main collection entry point
     */
    async collect(source, options = {}) {
        this.addLog('🚀 Starting Remote Jobs collection...');
        this.shouldStop = false;
        
        // Source 1: We Work Remotely (RSS - Extremely Reliable)
        try {
            const wwrJobs = await this.fetchFromWWR();
            if (this.onJobsFound) await this.onJobsFound(wwrJobs, source.id);
            this.addLog(`[WWR] Found ${wwrJobs.length} remote jobs.`);
        } catch (error) {
            this.addLog(`[WWR] Error: ${error.message}`, 'error');
        }

        // Source 2: Remote OK (API/RSS)
        if (!this.shouldStop) {
            try {
                const rokJobs = await this.fetchFromRemoteOK();
                if (this.onJobsFound) await this.onJobsFound(rokJobs, source.id);
                this.addLog(`[Remote OK] Found ${rokJobs.length} remote jobs.`);
            } catch (error) {
                this.addLog(`[Remote OK] Error: ${error.message}`, 'error');
            }
        }

        this.addLog(`✅ Remote collection complete.`);
        return [];
    }

    /**
     * Fetch from We Work Remotely RSS
     */
    async fetchFromWWR() {
        const url = 'https://weworkremotely.com/remote-jobs.rss';
        const response = await axios.get(url, { timeout: 15000 });
        const $ = cheerio.load(response.data, { xmlMode: true });
        const jobs = [];

        $('item').each((i, el) => {
            if (this.shouldStop) return;
            
            const title = $(el).find('title').text();
            const link = $(el).find('link').text();
            const description = $(el).find('description').text();
            const pubDate = $(el).find('pubDate').text();
            
            // WWR titles are usually "Company: Job Title"
            const parts = title.split(':');
            const company = parts.length > 1 ? parts[0].trim() : 'Remote Company';
            const jobTitle = parts.length > 1 ? parts[1].trim() : title;

            jobs.push({
                title: jobTitle,
                company_name: company,
                location: 'Remote',
                external_url: link,
                external_source: 'We Work Remotely',
                external_id: `wwr_${Buffer.from(link).toString('base64').slice(-15)}`,
                job_text: description,
                created_at: new Date(pubDate).toISOString(),
                job_site_type: 'Remote',
                raw_payload: {
                    source: 'WWR',
                    fetch_date: new Date().toISOString()
                }
            });
        });

        return jobs;
    }

    /**
     * Fetch from Remote OK RSS
     */
    async fetchFromRemoteOK() {
        const url = 'https://remoteok.com/remote-jobs.rss';
        const response = await axios.get(url, { 
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data, { xmlMode: true });
        const jobs = [];

        $('item').each((i, el) => {
            if (this.shouldStop) return;
            
            const title = $(el).find('title').text();
            const link = $(el).find('link').text();
            const description = $(el).find('description').text();
            const pubDate = $(el).find('pubDate').text();
            
            // Remote OK titles vary, usually "Job Title at Company"
            const parts = title.split(' at ');
            const jobTitle = parts[0].trim();
            const company = parts.length > 1 ? parts[1].trim() : 'Remote Company';

            jobs.push({
                title: jobTitle,
                company_name: company,
                location: 'Remote',
                external_url: link,
                external_source: 'Remote OK',
                external_id: `rok_${Buffer.from(link).toString('base64').slice(-15)}`,
                job_text: description,
                created_at: new Date(pubDate).toISOString(),
                job_site_type: 'Remote',
                raw_payload: {
                    source: 'RemoteOK',
                    fetch_date: new Date().toISOString()
                }
            });
        });

        return jobs;
    }
}

module.exports = RemoteCollector;
