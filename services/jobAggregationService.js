/**
 * Job Aggregation Service - Working Version
 * 
 * Fetches jobs from external APIs and stores them in the database.
 * 
 * Supported APIs:
 * - Adzuna: General job search (supports 18 countries)
 * - Jooble: MENA region job search (supports Middle East countries)
 * 
 * @version 3.0.0
 */

const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
const logger = require('../utils/logger');
const cron = require('node-cron');
const { logoFetcher } = require('../utils/companyLogoFetcher');
const { DeepSeekAI } = require('../utils/ai/deepSeekAI');
const PalestineCollector = require('./palestineCollector');

// HTTPS agent that bypasses SSL verification for Jooble API
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// Adzuna country mapping (Officially supported API countries)
// Adzuna API does NOT currently support most MENA countries via their standard API
const ADZUNA_SUPPORTED_COUNTRIES = {
    'United Kingdom': 'gb',
    'United States': 'us',
    'Australia': 'au',
    'Austria': 'at',
    'Belgium': 'be',
    'Brazil': 'br',
    'Canada': 'ca',
    'Switzerland': 'ch',
    'Germany': 'de',
    'Spain': 'es',
    'France': 'fr',
    'India': 'in',
    'Italy': 'it',
    'Mexico': 'mx',
    'Netherlands': 'nl',
    'New Zealand': 'nz',
    'Poland': 'pl',
    'Russia': 'ru',
    'Singapore': 'sg',
    'South Africa': 'za'
};

// Map full names to codes for consistency if user expands
const ADZUNA_COUNTRY_MAP = {
    ...ADZUNA_SUPPORTED_COUNTRIES,
    'United Arab Emirates': 'ae', // Added but not officially supported by API
    'Saudi Arabia': 'sa',
    'Egypt': 'eg',
    'Jordan': 'jo',
    'Palestine': 'ps'
};

const hirlyHierarchy = require('../utils/hirlyHierarchy');

class JobAggregationService {
    constructor(pool) {
        this.pool = pool;
        this.isWorking = false;
        this.shouldStop = false;
        this.isAutoTriggerEnabled = false;
        this.scheduledTask = null;
        this.ai = new DeepSeekAI();
        this.collector = new PalestineCollector(this.addLog.bind(this), this.pool);
        
        // Immediate processing for Intelligence Hub (page-by-page)
        this.collector.onJobsFound = async (jobs, sourceId) => {
            if (jobs && jobs.length > 0) {
                this.status.jobsFound += jobs.length;
                await this.stageRawJobs(sourceId, jobs);
                await this.processRawJobs(sourceId);
            }
        };
        
        this.status = {
            isWorking: false,
            isAutoTriggerEnabled: false,
            currentSource: null,
            currentCountry: null,
            progress: 0,
            totalTasks: 0,
            completedTasks: 0,
            jobsFound: 0,
            jobsSaved: 0,
            startTime: null,
            schedule: null,
            logs: []
        };

        // Auto-scheduler enabled via server.js
        this.status.schedule = null;
    }

    async initSchedule() {
        try {
            const res = await this.pool.query("SELECT key, value FROM system_settings WHERE key IN ('job_aggregator_schedule', 'job_aggregator_automation_enabled')");
            
            let schedule = '0 3 * * *';
            let enabled = false;

            res.rows.forEach(row => {
                if (row.key === 'job_aggregator_schedule') {
                    schedule = row.value.cron;
                } else if (row.key === 'job_aggregator_automation_enabled') {
                    enabled = row.value.enabled;
                }
            });

            this.isAutoTriggerEnabled = enabled;
            this.status.isAutoTriggerEnabled = enabled;
            await this.setSchedule(schedule, false);
            
            if (enabled) {
                this.addLog(`Daily automation is ACTIVE (Schedule: ${schedule})`);
            } else {
                this.addLog('Daily automation is currently PAUSED.');
            }
        } catch (error) {
            logger.error('Failed to init schedule:', error.message);
        }
    }

    async setSchedule(cronExpression, persist = true) {
        if (!cron.validate(cronExpression)) {
            throw new Error('Invalid cron expression');
        }

        if (this.scheduledTask) {
            this.scheduledTask.stop();
        }

        this.scheduledTask = cron.schedule(cronExpression, async () => {
            if (!this.isAutoTriggerEnabled) {
                this.addLog('Scheduled task skipped: Automation is disabled.', 'debug');
                return;
            }
            this.addLog(`Starting scheduled aggregation (${cronExpression})...`);
            // Daily automation uses 'isAuto' mode: optimized for speed and new jobs
            await this.runAggregation({ isAuto: true });
            await this.pruneOldJobs();
        });

        this.status.schedule = cronExpression;

        if (persist) {
            await this.pool.query(
                "INSERT INTO system_settings (key, value) VALUES ('job_aggregator_schedule', $1) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()",
                [{ cron: cronExpression }]
            );
            this.addLog(`Schedule updated to: ${cronExpression}`);
        }
    }

    async toggleAutoTrigger(enabled) {
        this.isAutoTriggerEnabled = enabled;
        this.status.isAutoTriggerEnabled = enabled;
        
        await this.pool.query(
            "INSERT INTO system_settings (key, value) VALUES ('job_aggregator_automation_enabled', $1) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()",
            [{ enabled }]
        );
        
        if (enabled) {
            this.addLog('Everyday Trigger: ACTIVATED. Aggregator will run automatically at the scheduled time.', 'success');
        } else {
            this.addLog('Everyday Trigger: DEACTIVATED. Automatic scans are paused.', 'warn');
        }
        
        return enabled;
    }

    stopAggregation() {
        if (this.isWorking) {
            this.shouldStop = true;
            if (this.collector) {
                this.collector.shouldStop = true;
            }
            this.addLog('Stop request received. Finishing current task...', 'warn');
            return true;
        }
        return false;
    }

    addLog(message, type = 'info') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            message,
            type
        };
        
        // Don't show debug logs in the UI status
        if (type !== 'debug') {
            this.status.logs.push(logEntry);
            if (this.status.logs.length > 100) this.status.logs.shift();
        }
        
        if (type === 'error') logger.error(`[JobAggregation] ${message}`);
        else if (type === 'warn') logger.warn(`[JobAggregation] ${message}`);
        else if (type === 'debug') {
            // Only log debug to system console, not status.logs
            if (process.env.NODE_ENV === 'development') {
                console.debug(`[JobAggregation-Debug] ${message}`);
            }
        }
        else logger.info(`[JobAggregation] ${message}`);
    }

    getStatus() {
        return {
            ...this.status,
            uptime: this.status.startTime ? Math.floor((Date.now() - this.status.startTime) / 1000) : 0
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Main aggregation method
     */
    async runAggregation(options = {}) {
        if (this.isWorking) {
            this.addLog('Aggregation already in progress. Skipping.', 'warn');
            return { status: 'skipped', reason: 'already_running' };
        }

        // Reset counters at the very beginning
        this.status.jobsFound = 0;
        this.status.jobsSaved = 0;
        this.status.completedTasks = 0;
        this.status.totalTasks = 0;
        this.status.progress = 0;

        // Smart Lookback Logic
        let lookbackDate = null;
        if (options.lookbackDays && parseInt(options.lookbackDays) > 0) {
            lookbackDate = new Date();
            lookbackDate.setDate(lookbackDate.getDate() - parseInt(options.lookbackDays));
            this.addLog(`Smart Guard: Scanning for jobs since ${lookbackDate.toLocaleDateString()}`);
        }

        // API Credentials
        const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID?.trim();
        const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY?.trim();
        const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY?.trim();

        // STRICT: MIDDLE EAST ONLY - Countries and keywords
        const allMiddleEastCountries = [
            'Palestine',           // 🇵🇸 MOST IMPORTANT - First in list
            'United Arab Emirates', // 🇦🇪
            'Saudi Arabia',        // 🇸🇦
            'Qatar',               // 🇶🇦
            'Kuwait',              // 🇰🇼
            'Egypt',               // 🇪🇬
            'Oman',                // 🇴🇲
            'Bahrain',             // 🇧🇭
            'Jordan',              // 🇯🇴
            'Lebanon',             // 🇱🇧
            'Iraq'                 // 🇮🇶
        ];
        
        // Use admin-selected countries or default to all Middle East
        const selectedCountries = options.countries && options.countries.length > 0 
            ? options.countries.filter(c => allMiddleEastCountries.includes(c))
            : allMiddleEastCountries;
        
        if (selectedCountries.length === 0) {
            selectedCountries.push(...allMiddleEastCountries);
        }

        // Check which APIs are available and requested
        const requestedSources = options.sources || ['jooble', 'intelligence']; // Default to jooble and intelligence if not specified
        
        const credentialsFound = {
            jooble: !!JOOBLE_API_KEY,
            adzuna: !!(ADZUNA_APP_ID && ADZUNA_APP_KEY),
            intelligence: true // Always available if db is up
        };

        const hasJooble = credentialsFound.jooble && requestedSources.includes('jooble');
        const hasAdzuna = credentialsFound.adzuna && requestedSources.includes('adzuna');
        const hasIntelligence = requestedSources.includes('intelligence');

        this.addLog(`APIs Requested: ${requestedSources.join(', ')}`);
        this.addLog(`Credential Status: Jooble=${credentialsFound.jooble ? 'OK' : 'MISSING'}, Adzuna=${credentialsFound.adzuna ? 'OK' : 'MISSING'}, Intelligence=OK`);

        if (requestedSources.includes('jooble') && !credentialsFound.jooble) {
            this.addLog('Jooble API Key is missing in .env file', 'error');
        }
        if (requestedSources.includes('adzuna') && !credentialsFound.adzuna) {
            this.addLog('Adzuna App ID or Key is missing in .env file', 'error');
        }

        if (!hasJooble && !hasAdzuna && !hasIntelligence && !selectedCountries.includes('Palestine')) {
            this.addLog('No valid API credentials for requested sources and no local sources available for selected region.', 'error');
            return { status: 'error', reason: 'no_api_credentials' };
        }

        this.addLog(`Countries selected: ${selectedCountries.join(', ')}`);
        
        const keywords = options.keywords || [
            'software', 'marketing', 'sales', 'design', 'engineering', 
            'management', 'finance', 'healthcare', 'education', 'customer service',
            'admin', 'accounting', 'legal', 'operations', 'business development'
        ];

        // Build task list
        const tasks = [];
        
        // 0. Handle single source scan if sourceId is provided
        if (options.sourceId) {
            try {
                const res = await this.pool.query(
                    "SELECT * FROM job_sources WHERE id = $1",
                    [options.sourceId]
                );
                if (res.rows.length > 0) {
                    const source = res.rows[0];
                    tasks.push({ 
                        source: 'custom', 
                        data: source, 
                        country: source.country_code || 'Global', 
                        keyword: 'manual_scan' 
                    });
                    this.addLog(`Manual scan triggered for source: ${source.name}`);
                }
            } catch (error) {
                this.addLog(`Failed to load source ${options.sourceId}: ${error.message}`, 'error');
            }
        } else {
            // 1. Intelligence Hub Sources
            if (hasIntelligence || options.deepScan) {
                try {
                    let query = "SELECT *, COALESCE(is_sorted, true) as is_sorted, COALESCE(scan_depth_limit, 5) as scan_depth_limit FROM job_sources WHERE active = true";
                    const queryParams = [];
                    
                    // If not a deep scan and countries are selected, filter by country
                    if (!options.deepScan && options.countries && options.countries.length > 0) {
                        query += " AND country_code = ANY($1)";
                        const countryCodes = options.countries.map(c => {
                            if (c === 'Palestine') return 'PS';
                            if (c === 'United Arab Emirates') return 'AE';
                            if (c === 'Saudi Arabia') return 'SA';
                            return c;
                        });
                        queryParams.push(countryCodes);
                    }
                    
                    query += " ORDER BY priority ASC";
                    
                    const res = await this.pool.query(query, queryParams);
                    for (const source of res.rows) {
                        // If specific sourceIds were requested, only add those
                        if (options.intelligenceSources && options.intelligenceSources.length > 0) {
                            if (!options.intelligenceSources.includes(source.id.toString())) continue;
                        }

                        tasks.push({
                            source: 'intelligence',
                            data: source,
                            country: source.country_code || 'Global',
                            keyword: 'intelligence',
                            options: { 
                                ...options,
                                lookbackDate: lookbackDate,
                                isSorted: source.is_sorted,
                                scanDepthLimit: source.scan_depth_limit
                            }
                        });
                    }
                    if (res.rows.length > 0) {
                        this.addLog(`Intelligence Hub: ${res.rows.length} sources added to queue.`);
                    }
                } catch (error) {
                    this.addLog(`Intelligence: Failed to load sources: ${error.message}`, 'error');
                }
            }

            // 2. API Sources (Jooble)
            if (hasJooble) {
                for (const country of selectedCountries) {
                    if (country === 'Palestine') {
                        this.addLog('Jooble: Skipping Palestine (Avoiding US-based results. Using local sources instead.)', 'warn');
                        continue;
                    }
                    for (const keyword of keywords) {
                        tasks.push({ source: 'jooble', country, keyword });
                    }
                }
            }

            // 3. API Sources (Adzuna)
            if (hasAdzuna) {
                let adzunaTasksAdded = 0;
                for (const country of selectedCountries) {
                    if (!ADZUNA_SUPPORTED_COUNTRIES[country]) {
                        this.addLog(`Adzuna: Skipping ${country} (Source only supports Western/Major markets like US, UK, IT, etc.)`, 'warn');
                        continue;
                    }
                    for (const keyword of keywords) {
                        tasks.push({ source: 'adzuna', country, keyword });
                        adzunaTasksAdded++;
                    }
                }
                if (adzunaTasksAdded === 0 && requestedSources.length === 1 && requestedSources[0] === 'adzuna') {
                    this.addLog('Adzuna does not support any of the selected countries.', 'error');
                    return { status: 'error', reason: 'unsupported_region' };
                }
            }
        }

        if (tasks.length === 0) {
            this.addLog('Aggregation failed: No searchable tasks were created. Ensure the selected source supports your chosen countries.', 'error');
            return { status: 'error', reason: 'no_tasks' };
        }

        // Initialize status
        this.status.isWorking = true;
        this.status.shouldStop = false;
        this.status.currentSource = null;
        this.status.currentCountry = null;
        this.status.progress = 0;
        this.status.totalTasks = tasks.length;
        this.status.completedTasks = 0;
        this.status.jobsFound = 0;
        this.status.jobsSaved = 0;
        this.status.startTime = Date.now();
        
        this.isWorking = true;
        this.shouldStop = false;

        this.addLog(`Starting: ${tasks.length} tasks (${keywords.length} keywords × ${Math.round(tasks.length/keywords.length)} countries)`);

        // Execute tasks
        try {
            for (const task of tasks) {
                if (this.shouldStop) break;

                this.status.currentSource = task.source;
                this.status.currentCountry = task.country;

                try {
                    if (task.source === 'adzuna') {
                        await this.fetchFromAdzuna(task.country, task.keyword, ADZUNA_APP_ID, ADZUNA_APP_KEY, { lookbackDate });
                    } else if (task.source === 'jooble') {
                        await this.fetchFromJooble(task.country, task.keyword, JOOBLE_API_KEY, { lookbackDate });
                    } else if (task.source === 'intelligence') {
                        // Data is staged/processed page-by-page via onJobsFound callback
                        await this.collector.collect(task.data, task.options);
                    }
                } catch (error) {
                    this.addLog(`${task.source} error [${task.country}/${task.keyword}]: ${error.message}`, 'error');
                }

                this.status.completedTasks++;
                this.status.progress = Math.round((this.status.completedTasks / this.status.totalTasks) * 100);
                await this.delay(1000); // Rate limiting
            }

            if (this.shouldStop) {
                this.addLog('Stopped by user', 'warn');
            } else {
                this.addLog(`Complete! Found: ${this.status.jobsFound}, Saved: ${this.status.jobsSaved}`);
            }
        } catch (error) {
            this.addLog(`Critical error: ${error.message}`, 'error');
        } finally {
            this.isWorking = false;
            this.shouldStop = false;
            this.status.isWorking = false;
        }

        return {
            status: this.shouldStop ? 'stopped' : 'completed',
            jobsFound: this.status.jobsFound,
            jobsSaved: this.status.jobsSaved
        };
    }

    /**
     * Stage raw jobs into the raw_jobs table
     */
    async stageRawJobs(sourceId, rawJobs) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            for (const job of rawJobs) {
                // Debug log to see what's being staged
                if (job.job_text) {
                    this.addLog(`[Staging] Job text found for ${job.title} (${job.job_text.substring(0, 50)}...)`, 'debug');
                } else {
                    this.addLog(`[Staging] WARNING: Job text is missing for ${job.title}`, 'warn');
                }

                await client.query(
                    `INSERT INTO raw_jobs (source_id, external_id, external_url, job_text, raw_payload, status)
                     VALUES ($1, $2, $3, $4, $5, 'pending')
                     ON CONFLICT ON CONSTRAINT raw_jobs_source_id_external_id_unique DO NOTHING`,
                    [sourceId, job.external_id, job.external_url, job.job_text || null, JSON.stringify(job)]
                );
            }
            await client.query('COMMIT');
            
            // Update source last_sync
            await client.query(
                "UPDATE job_sources SET last_sync = NOW() WHERE id = $1",
                [sourceId]
            );
        } catch (error) {
            try { await client.query('ROLLBACK'); } catch (e) {}
            this.addLog(`Failed to stage raw jobs: ${error.message}`, 'error');
        } finally {
            client.release();
        }
    }

    /**
     * Process pending raw jobs: AI Extraction -> jobs table
     */
    async processRawJobs(sourceId = null) {
        let query = `
            SELECT r.*, s.priority as source_priority 
            FROM raw_jobs r
            JOIN job_sources s ON r.source_id = s.id
            WHERE r.status = 'pending'
        `;
        const params = [];
        
        if (sourceId) {
            query += " AND r.source_id = $1";
            params.push(sourceId);
        }
        
        // Process up to 100 jobs in a single run
        query += " ORDER BY s.priority ASC, r.created_at DESC LIMIT 100";

        const res = await this.pool.query(query, params);
        if (res.rows.length === 0) return 0;

        let processedCount = 0;
        this.addLog(`[Intelligence] Processing ${res.rows.length} pending jobs from staging...`);
        
        const CONCURRENCY_LIMIT = 3; // Reduced concurrency for AI safety
        for (let i = 0; i < res.rows.length; i += CONCURRENCY_LIMIT) {
            if (this.shouldStop) break;
            
            const batch = res.rows.slice(i, i + CONCURRENCY_LIMIT);
            const results = await Promise.all(batch.map(async (rawJob) => {
                try {
                    // Update status to processing
                    await this.pool.query("UPDATE raw_jobs SET status = 'processing' WHERE id = $1", [rawJob.id]);

                    const payload = rawJob.raw_payload;
                    
                    // Map to jobs structure for saveJobs
                    // CRITICAL: Include the high-fidelity job_text from the dedicated column
                    const jobToSave = {
                        ...payload,
                        job_text: rawJob.job_text, 
                        external_id: rawJob.external_id,
                        external_url: rawJob.external_url,
                        external_source: payload.external_source,
                        is_external: true
                    };

                    // Save to jobs table using the existing saveJobs logic which handles deduplication, AI cleaning, and logo fetching
                    const saved = await this.saveJobs([jobToSave]);
                    
                    if (saved > 0) {
                        await this.pool.query("UPDATE raw_jobs SET status = 'processed', updated_at = NOW() WHERE id = $1", [rawJob.id]);
                        return true;
                    } else {
                        await this.pool.query("UPDATE raw_jobs SET status = 'duplicate', updated_at = NOW() WHERE id = $1", [rawJob.id]);
                        return false;
                    }

                } catch (error) {
                    this.addLog(`[AI] Processing failed for raw job ${rawJob.id}: ${error.message}`, 'error');
                    await this.pool.query("UPDATE raw_jobs SET status = 'failed', updated_at = NOW() WHERE id = $1", [rawJob.id]);
                    return false;
                }
            }));

            processedCount += results.filter(r => r === true).length;
            
            // Update live status immediately for the UI
            this.status.jobsSaved += results.filter(r => r === true).length;
            
            // Small delay between AI batches
            await this.delay(1000);
        }
        return processedCount;
    }

    async fetchFromAdzuna(country, keyword, appId, appKey, options = {}) {
        try {
            const { lookbackDate } = options;
            // Map full country name to Adzuna code
            const countryCode = ADZUNA_COUNTRY_MAP[country] || 'ae'; // Default to UAE if unknown
            
            const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1`;
            
            const response = await axios.get(url, {
                params: {
                    app_id: appId,
                    app_key: appKey,
                    results_per_page: 50, // Increased for better coverage
                    what: keyword
                },
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            const jobs = response.data?.results || [];
            
            if (jobs.length > 0) {
                this.addLog(`Adzuna [${country}/${keyword}]: ${jobs.length} raw jobs found`);
                
                let mappedJobs = jobs.map(job => ({
                    external_id: `adzuna_${job.id}`,
                    title: this.cleanText(job.title),
                    description: this.cleanText(job.description),
                    category: this.mapCategory(job.category?.label),
                    company_name: job.company?.display_name || 'Private Company',
                    location: job.location?.display_name || 'Remote',
                    city: this.extractCity(job.location),
                    job_type: this.mapJobType(job.contract_type),
                    job_site_type: 'On-site',
                    external_url: job.redirect_url,
                    external_source: 'Adzuna',
                    created_at: job.created || new Date().toISOString()
                }));

                // Smart Guard: Filter by date
                if (lookbackDate) {
                    const originalCount = mappedJobs.length;
                    mappedJobs = mappedJobs.filter(job => new Date(job.created_at) >= lookbackDate);
                    if (mappedJobs.length < originalCount) {
                        this.addLog(`Smart Guard: Filtered out ${originalCount - mappedJobs.length} stale jobs from Adzuna.`);
                    }
                }

                if (mappedJobs.length > 0) {
                    this.status.jobsFound += mappedJobs.length;
                    await this.saveJobs(mappedJobs);
                }
            }
        } catch (error) {
            if (error.response?.status === 404) {
                this.addLog(`Adzuna [${country}]: Not supported`, 'warn');
            } else {
                throw error;
            }
        }
    }

    async fetchFromJooble(country, keyword, apiKey, options = {}) {
        try {
            const url = `https://jooble.org/api/${apiKey}`;

            // IMPROVED PALESTINE FETCHING - Rotation for maximum coverage
            if (country === 'Palestine') {
                // We'll rotate between these locations to find all jobs
                const palestineLocations = ['Palestinian Territory', 'Ramallah', 'Gaza', 'West Bank'];
                
                for (const loc of palestineLocations) {
                    this.addLog(`Jooble [Palestine]: Searching in "${loc}" for "${keyword}"...`, 'debug');
                    const requestBody = {
                        keywords: keyword,
                        location: loc,
                        page: 1,
                        resultonpage: 50
                    };
                    
                    try {
                        const response = await axios.post(url, requestBody, {
                            headers: { 'Content-Type': 'application/json' },
                            httpsAgent: httpsAgent,
                            timeout: 20000
                        });
                        
                        const jobs = response.data?.jobs || [];
                        if (jobs.length > 0) {
                            await this.processJoobleJobs(jobs, country, keyword, options);
                        }
                    } catch (e) {
                        this.addLog(`Jooble [Palestine/${loc}]: ${e.message}`, 'error');
                    }
                }
                return; // Palestine handled by rotation
            }

            // UAE FALLBACK LOGIC
            let location = country;
            if (country === 'United Arab Emirates') {
                location = 'United Arab Emirates'; // Full name first
            }
            
            const requestBody = {
                keywords: keyword,
                location: location,
                page: 1,
                resultonpage: 50
            };

            let response = await axios.post(url, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                httpsAgent: httpsAgent,
                timeout: 30000,
                maxRedirects: 5
            });

            // FALLBACK: If 0 jobs for UAE, try "Dubai" or "Abu Dhabi"
            if (country === 'United Arab Emirates' && (!response.data?.jobs || response.data.jobs.length === 0)) {
                this.addLog(`Jooble: No results for full UAE name, trying "Dubai"...`, 'debug');
                requestBody.location = 'Dubai';
                response = await axios.post(url, requestBody, {
                    headers: { 'Content-Type': 'application/json' },
                    httpsAgent: httpsAgent
                });
            }

            const jobs = response.data?.jobs || [];
            if (jobs.length > 0) {
                await this.processJoobleJobs(jobs, country, keyword, options);
            }
        } catch (error) {
            this.addLog(`Jooble [${country}/${keyword}]: ${error.message}`, 'error');
        }
    }

    /**
     * Helper to process raw Jooble jobs into the database
     */
    async processJoobleJobs(jobs, country, keyword, options = {}) {
        this.addLog(`Jooble [${country}/${keyword}]: ${jobs.length} raw jobs found`);
        const { lookbackDate } = options;

        let mappedJobs = jobs.map(job => {
            const jobLocation = job.location || '';
            const jobTitle = job.title || '';
            const jobLink = job.link || '';
            
            // GEOGRAPHIC VALIDATION - STRICTER CHECK
            if (country === 'Palestine') {
                if (this.isLikelyUSPalestine(jobLocation, jobTitle, jobLink)) {
                    return null;
                }
            }

            const locationParts = jobLocation.split(',').map(p => p.trim());
            let city = locationParts[0] || 'Other';
            
            if (!jobLocation.toLowerCase().includes(country.toLowerCase()) && 
                !jobLocation.toLowerCase().includes('palestine') &&
                !jobLocation.toLowerCase().includes('territory') &&
                !jobLocation.toLowerCase().includes('الضفة') &&
                !jobLocation.toLowerCase().includes('غزة')) {
                city = 'Other';
            }
            
            return {
                external_id: `jooble_${job.id}`,
                title: this.cleanText(job.title),
                description: this.cleanText(job.content || job.snippet),
                category: 'Other',
                company_name: job.company || 'Private Company',
                location: country,
                city: city,
                job_type: 'Full-time',
                job_site_type: 'On-site',
                external_url: job.link,
                external_source: 'Jooble',
                created_at: job.updated || new Date().toISOString()
            };
        }).filter(j => j !== null);

        // Smart Guard: Filter by date
        if (lookbackDate) {
            const originalCount = mappedJobs.length;
            mappedJobs = mappedJobs.filter(job => new Date(job.created_at) >= lookbackDate);
            if (mappedJobs.length < originalCount) {
                this.addLog(`Smart Guard: Filtered out ${originalCount - mappedJobs.length} stale jobs from Jooble.`);
            }
        }

        if (mappedJobs.length === 0) {
            this.addLog(`Jooble [${country}/${keyword}]: No relevant or fresh jobs found`, 'debug');
            return;
        }

        this.status.jobsFound += mappedJobs.length;
        await this.saveJobs(mappedJobs);
    }

    /**
     * Helper to detect if a job is likely in Palestine, Texas instead of Palestinian Territories
     */
    isLikelyUSPalestine(location, title, link) {
        const text = `${location} ${title} ${link}`.toLowerCase();
        
        // Positive markers for US-based Palestine
        const usMarkers = [
            'texas', ', tx', 'united states', 'usa', '/palestine-tx', 
            'houston', 'dallas', 'austin', 'fort worth'
        ];
        
        if (usMarkers.some(marker => text.includes(marker))) return true;
        
        // If it explicitly says "Palestine" but has zero Middle East markers, be suspicious
        const meMarkers = [
            'territory', 'west bank', 'gaza', 'ramallah', 'nablus', 'hebron', 
            'bethlehem', 'jerusalem', 'jenin', 'tulkarm', 'jericho', 'rawabi',
            'فلسطين', 'الضفة', 'غزة', 'رام الله'
        ];
        
        // If location is just "Palestine" and no ME markers are found in the title/desc/link, 
        // it's likely the US one because Jooble ME usually says "Palestinian Territory"
        if (location.toLowerCase() === 'palestine' && !meMarkers.some(marker => text.includes(marker))) {
            return true;
        }

        return false;
    }

    // Helper methods
    normalizeString(str) {
        if (!str) return '';
        return str.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Remove punctuation
            .replace(/\s+/g, " ") // Normalize spaces
            .trim();
    }

    cleanText(text) {
        if (!text) return '';
        return text.replace(/<\/?[^>]+(>|$)/g, '').trim();
    }

    extractCity(location) {
        if (!location) return 'Other';
        if (location.area && location.area.length > 0) {
            return location.area[location.area.length - 1];
        }
        return location.display_name || 'Other';
    }

    mapCategory(externalCategory) {
        if (!externalCategory) return 'Other';
        
        const mapping = {
            'IT Jobs': 'Tech & Development',
            'Sales Jobs': 'Sales & Marketing',
            'Marketing Jobs': 'Sales & Marketing',
            'Engineering Jobs': 'Engineering',
            'Finance & Accounting Jobs': 'Business & Finance',
            'Healthcare & Nursing Jobs': 'Healthcare',
            'Teaching Jobs': 'Education & Research'
        };

        return mapping[externalCategory] || 'Other';
    }

    mapJobType(externalType) {
        const types = {
            'full_time': 'Full-time',
            'part_time': 'Part-time',
            'contract': 'Contract',
            'permanent': 'Full-time'
        };
        return types[externalType] || 'Full-time';
    }

    async findMatchingEmployer(companyName, email, website) {
        const client = await this.pool.connect();
        try {
            // 1. Match by email directly
            if (email) {
                const emailMatch = await client.query(
                    `SELECT u.id FROM users u 
                     JOIN employers e ON u.id = e.user_id 
                     WHERE u.email = $1 OR e.company_email = $1`,
                    [email]
                );
                if (emailMatch.rows.length > 0) return emailMatch.rows[0].id;

                // 2. Match by email domain
                const domain = email.split('@')[1];
                if (domain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domain.toLowerCase())) {
                    const domainMatch = await client.query(
                        `SELECT u.id FROM users u 
                         JOIN employers e ON u.id = e.user_id 
                         WHERE u.email LIKE $1 OR e.company_email LIKE $1 OR e.website_link LIKE $2`,
                        [`%@${domain}`, `%${domain}%`]
                    );
                    if (domainMatch.rows.length > 0) return domainMatch.rows[0].id;
                }
            }

            // 3. Match by company name
            if (companyName) {
                const nameMatch = await client.query(
                    `SELECT user_id FROM employers 
                     WHERE LOWER(company_name) = LOWER($1) OR LOWER(company_name) LIKE $2`,
                    [companyName, `%${companyName}%`]
                );
                if (nameMatch.rows.length > 0) return nameMatch.rows[0].user_id;
            }

            // 4. Match by website domain
            if (website) {
                const url = new URL(website.startsWith('http') ? website : `https://${website}`);
                const domain = url.hostname.replace('www.', '');
                if (domain) {
                    const webMatch = await client.query(
                        `SELECT user_id FROM employers 
                         WHERE website_link LIKE $1`,
                        [`%${domain}%`]
                    );
                    if (webMatch.rows.length > 0) return webMatch.rows[0].user_id;
                }
            }

            return null;
        } catch (error) {
            this.addLog(`Employer matching failed: ${error.message}`, 'debug');
            return null;
        } finally {
            client.release();
        }
    }

    async saveJobs(jobs) {
        if (!jobs || jobs.length === 0) return 0;

        let savedCount = 0;
        let duplicateCount = 0;
        const CONCURRENCY_LIMIT = 5; // Process 5 jobs at a time to avoid rate limits

        try {
            // Process jobs in parallel batches to speed up AI and logo fetching
            for (let i = 0; i < jobs.length; i += CONCURRENCY_LIMIT) {
                if (this.shouldStop) break;

                const batch = jobs.slice(i, i + CONCURRENCY_LIMIT);
                const results = await Promise.all(batch.map(async (job) => {
                    const client = await this.pool.connect();
                    try {
                        // 1. ADVANCED Deduplication check
                        // Check 1: Semantic match (Normalized Title + Company + City)
                        const normTitle = this.normalizeString(job.title);
                        const normCompany = this.normalizeString(job.company_name);
                        const normCity = this.normalizeString(job.city);

                        const semanticMatch = await client.query(
                            `SELECT id FROM jobs 
                             WHERE (LOWER(title) = LOWER($1) OR LOWER(title) = $2)
                             AND (LOWER(external_company_name) = LOWER($3) OR LOWER(external_company_name) = $4)
                             AND (LOWER(city) = LOWER($5) OR LOWER(city) = $6)
                             AND created_at > NOW() - INTERVAL '60 days'`,
                            [job.title, normTitle, job.company_name, normCompany, job.city, normCity]
                        );

                        if (semanticMatch.rows.length > 0) {
                            return { status: 'duplicate', title: job.title, reason: 'semantic_match' };
                        }

                        // Check 2: Direct External ID match
                        const idMatch = await client.query(
                            "SELECT id FROM jobs WHERE external_id = $1",
                            [job.external_id]
                        );

                        if (idMatch.rows.length > 0) {
                            return { status: 'duplicate', title: job.title, reason: 'id_match' };
                        }

                        // Check 3: Content Similarity (Title + First 200 chars of description)
                        // This catches jobs with slightly different titles but identical content
                        if (job.description && job.description.length > 100) {
                            const descSnippet = job.description.substring(0, 200).toLowerCase().trim();
                            const contentMatch = await client.query(
                                `SELECT id FROM jobs 
                                 WHERE LOWER(title) LIKE $1
                                 AND LOWER(description) LIKE $2
                                 AND created_at > NOW() - INTERVAL '30 days'
                                 LIMIT 1`,
                                [`%${normTitle}%`, `%${descSnippet}%`]
                            );

                            if (contentMatch.rows.length > 0) {
                                return { status: 'duplicate', title: job.title, reason: 'content_match' };
                            }
                        }

                        // 2. AI Normalization & Data Cleaning (Parallel)
                        let cleanJob = { ...job };
                        try {
                            this.addLog(`AI cleaning job: ${job.title} at ${job.company_name}`, 'debug');
                            const aiData = await this.ai.extractJobData({
                                title: job.title,
                                description: job.description,
                                job_text: job.job_text, // Pass the high-fidelity text for AI analysis
                                company: job.company_name,
                                location: job.location,
                                city: job.city,
                                country: job.location,
                                original_date: job.created_at,
                                external_company_email: job.email // Pass email found by scraper to AI for verification
                            }, hirlyHierarchy);

                            cleanJob.title = aiData.title || job.title;
                            cleanJob.description = aiData.description || job.description;
                            cleanJob.category = aiData.category || job.category;
                            cleanJob.profession_required = aiData.professions || [];
                            cleanJob.company_name = aiData.company || job.company_name;
                            cleanJob.city = aiData.city || job.city;
                            cleanJob.country = aiData.country || job.location;
                            cleanJob.job_type = aiData.job_type || job.job_type;
                            cleanJob.job_site_type = aiData.job_site_type || job.job_site_type || 'On-site';
                            cleanJob.budget = aiData.salary || null;
                            cleanJob.currency = aiData.currency || null;
                            cleanJob.gender_requirement = aiData.gender_requirement || 'any';
                            cleanJob.age_min = aiData.age_min || null;
                            cleanJob.age_max = aiData.age_max || null;
                            cleanJob.company_website = aiData.company_website || null;
                            cleanJob.external_company_email = aiData.external_company_email || job.email || null;
                            cleanJob.requirements = aiData.requirements || [];
                            cleanJob.job_dossier = {
                                responsibilities: aiData.responsibilities || [],
                                preferred_qualifications: aiData.preferred_qualifications || [],
                                benefits: aiData.benefits || [],
                                experience_level: aiData.experience_level || 'Not specified',
                                skills: aiData.skills || []
                            };
                            cleanJob.created_at = aiData.posted_at || job.created_at || new Date().toISOString();
                            cleanJob.deadline = aiData.deadline || null;

                            // 2a. Deadline Fallback: If no deadline, set to 30 days from posting
                            if (!cleanJob.deadline) {
                                const postedDate = new Date(cleanJob.created_at);
                                const fallbackDeadline = new Date(postedDate);
                                fallbackDeadline.setDate(fallbackDeadline.getDate() + 30);
                                cleanJob.deadline = fallbackDeadline.toISOString();
                                this.addLog(`[Deadline Guard] No deadline for "${job.title}". Fallback: 30 days applied.`, 'debug');
                            }

                            // 2b. Future Date Guard: Ensure created_at is not in the future
                            const createdAtDate = new Date(cleanJob.created_at);
                            if (createdAtDate > new Date()) {
                                this.addLog(`Future date detected for ${job.title}: ${createdAtDate.toISOString()}. Resetting to now.`, 'warn');
                                cleanJob.created_at = new Date().toISOString();
                            }

                            // 2c. Deadline Guard: Skip if deadline has passed
                            if (cleanJob.deadline) {
                                const deadlineDate = new Date(cleanJob.deadline);
                                const now = new Date();
                                // Set both to start of day for fair comparison
                                deadlineDate.setHours(0, 0, 0, 0);
                                now.setHours(0, 0, 0, 0);
                                
                                if (deadlineDate < now) {
                                    return { status: 'skipped_expired', title: job.title, deadline: cleanJob.deadline };
                                }
                            }
                        } catch (aiError) {
                            this.addLog(`AI cleaning failed for ${job.title}: ${aiError.message}`, 'warn');
                            cleanJob.country = job.location;
                        }

                        // 3. Fetch company logo (Parallel)
                        let companyLogo = null;
                        try {
                            const targetCompanyName = cleanJob.company_name || job.company_name;
                            const targetWebsite = cleanJob.company_website;
                            const pageLogo = job.raw_payload?.page_logo;
                            companyLogo = await logoFetcher.getLogoUrl(targetCompanyName, job.external_url, targetWebsite, pageLogo);
                        } catch (logoError) {
                            this.addLog(`Failed to fetch logo for ${job.company_name}: ${logoError.message}`, 'debug');
                        }

                        // 3b. Try to match an existing Hirly employer
                        let matchedEmployerId = null;
                        try {
                            matchedEmployerId = await this.findMatchingEmployer(
                                cleanJob.company_name, 
                                cleanJob.external_company_email, 
                                cleanJob.company_website
                            );
                            if (matchedEmployerId) {
                                this.addLog(`[Matching] Found existing Hirly employer for ${cleanJob.company_name} (ID: ${matchedEmployerId})`, 'debug');
                            }
                        } catch (matchError) {
                            this.addLog(`Employer matching failed: ${matchError.message}`, 'debug');
                        }

                        // 4. Insert into database
                        await client.query(
                            `INSERT INTO jobs (
                                title, description, category, profession_required,
                                external_company_name, city, country, job_type, 
                                job_site_type, external_apply_url, external_source, 
                                external_id, is_external, status, external_company_logo,
                                budget, currency, gender_requirement, age_min, age_max, 
                                requirements, created_at, deadline, job_dossier,
                                external_company_email, employer_id
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
                            [
                                cleanJob.title, cleanJob.description, cleanJob.category, 
                                JSON.stringify(cleanJob.profession_required),
                                cleanJob.company_name, cleanJob.city, cleanJob.country, 
                                cleanJob.job_type, cleanJob.job_site_type, cleanJob.external_url, 
                                cleanJob.external_source, cleanJob.external_id, true, 'open', companyLogo,
                                cleanJob.budget, cleanJob.currency, cleanJob.gender_requirement,
                                cleanJob.age_min, cleanJob.age_max, JSON.stringify(cleanJob.requirements),
                                cleanJob.created_at, cleanJob.deadline, JSON.stringify(cleanJob.job_dossier),
                                cleanJob.external_company_email, matchedEmployerId
                            ]
                        );
                        return { status: 'saved' };
                    } finally {
                        client.release();
                    }
                }));

                // Count results for the batch
                results.forEach(res => {
                    if (res.status === 'saved') {
                        savedCount++;
                        this.status.jobsSaved++; // Update live status immediately
                    }
                    if (res.status === 'duplicate') {
                        duplicateCount++;
                        this.addLog(`Duplicate skipped: "${res.title}" (Reason: ${res.reason})`, 'debug');
                    }
                    if (res.status === 'skipped_expired') {
                        this.addLog(`Expired job skipped: "${res.title}" (Deadline: ${res.deadline})`, 'warn');
                    }
                });

                // Small delay between batches to be kind to APIs
                if (i + CONCURRENCY_LIMIT < jobs.length) await this.delay(500);
            }

            if (duplicateCount > 0) this.addLog(`Skipped ${duplicateCount} jobs that already exist.`);
            if (savedCount > 0) this.addLog(`Successfully saved ${savedCount} new jobs.`);
            
            return savedCount;
        } catch (error) {
            logger.error('Error saving jobs:', error.message);
            throw error;
        }
    }

    async pruneOldJobs() {
        try {
            // Update external jobs to 'closed' instead of deleting them
            const jobsResult = await this.pool.query(
                "UPDATE jobs SET status = 'closed' WHERE is_external = true AND status = 'open' AND created_at < NOW() - INTERVAL '30 days'"
            );
            
            // Also prune old raw jobs that were processed or failed (these are fine to delete as they are just intermediate data)
            const rawJobsResult = await this.pool.query(
                "DELETE FROM raw_jobs WHERE (status = 'processed' OR status = 'duplicate' OR status = 'failed') AND created_at < NOW() - INTERVAL '15 days'"
            );

            this.addLog(`Closed ${jobsResult.rowCount} old external jobs and pruned ${rawJobsResult.rowCount} old raw jobs.`);
            return jobsResult.rowCount;
        } catch (error) {
            this.addLog(`Error pruning jobs: ${error.message}`, 'error');
            return 0;
        }
    }

    async pruneRawJobs() {
        // Explicitly called from scheduler if needed
        return await this.pruneOldJobs();
    }
}

module.exports = JobAggregationService;
